import { env } from '../config/env.js'

export type AmenityCategory = 'school' | 'grocery' | 'park' | 'transit' | 'healthcare' | 'dining' | 'other'

// Curated slice of Google's Places "Table A" types — keeps the map
// readable and keeps includedTypes short. Extend per-category as needed.
const CATEGORY_TYPES: Record<Exclude<AmenityCategory, 'other'>, string[]> = {
  school: ['school', 'primary_school', 'secondary_school'],
  grocery: ['supermarket', 'grocery_store'],
  park: ['park'],
  transit: ['transit_station', 'train_station', 'bus_station', 'subway_station'],
  healthcare: ['hospital', 'pharmacy'],
  dining: ['restaurant', 'cafe'],
}

export type Amenity = {
  id: string
  name: string
  category: AmenityCategory
  primaryType: string
  lat: number
  lng: number
  rating?: number
}

/** Thrown for any Places lookup failure; `status` is the HTTP status the controller should return. */
export class PlacesError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

type GooglePlace = {
  id: string
  displayName?: { text: string }
  location: { latitude: number; longitude: number }
  primaryType?: string
  types?: string[]
  rating?: number
}

type SearchNearbyResponse = {
  places?: GooglePlace[]
  error?: { message?: string; status?: string }
}

/**
 * Calls Google's Places API (New) "Nearby Search" server-side — same reason
 * geocode.service.ts exists: this API rejects referrer-restricted keys, so
 * it can't share the browser-side Maps JavaScript API key in map-card.tsx.
 *
 * One request PER category (not one shared request across all of them) —
 * each with its own 20-result budget. This used to be a single request
 * covering every category at once, capped at 20 results total combined.
 * That meant a category-dense area (e.g. lots of cafes) could fill the
 * entire 20-result cap on its own and crowd out every other category
 * regardless of radius — and because Google returns the closest N matches
 * within the circle, once that cap was filled by nearby results, widening
 * the radius from the frontend's Map Layers slider had no visible effect:
 * the same closest 20 were still the closest 20. Splitting by category
 * gives each one a fresh budget, so a cluster of restaurants can no longer
 * hide every school/hospital/etc, and there's real room for a wider radius
 * to surface more results per category. Trade-off: this costs roughly
 * 6x the Google Places quota/billing of the old single-request version.
 */
export async function findNearbyAmenities(lat: number, lng: number, radiusMeters: number): Promise<Amenity[]> {
  if (!env.googleMaps.serverKey) {
    throw new PlacesError('Nearby amenities lookup is not configured on the server', 503)
  }
  const serverKey = env.googleMaps.serverKey

  const categories = Object.keys(CATEGORY_TYPES) as Array<Exclude<AmenityCategory, 'other'>>
  // allSettled, not all — 6 requests instead of 1 means 6x the surface for a
  // transient failure (rate limit, one-off 5xx), and a hiccup in the
  // "healthcare" request shouldn't blank out the other five categories that
  // came back fine.
  const settled = await Promise.allSettled(
    categories.map((category) => searchNearbyByCategory(category, lat, lng, radiusMeters, serverKey)),
  )

  // Flatten and de-dupe by place id — CATEGORY_TYPES' type lists don't
  // currently overlap, but a place could in principle satisfy more than one.
  const seen = new Set<string>()
  const amenities: Amenity[] = []
  let failureCount = 0
  settled.forEach((result, index) => {
    if (result.status === 'rejected') {
      failureCount += 1
      console.error(`Places lookup failed for category "${categories[index]}":`, result.reason)
      return
    }
    for (const amenity of result.value) {
      if (seen.has(amenity.id)) continue
      seen.add(amenity.id)
      amenities.push(amenity)
    }
  })

  // Only surface an error to the caller if every category failed (e.g. a bad
  // API key) — a single category's hiccup degrades gracefully instead of
  // taking down the whole map.
  if (failureCount === categories.length) {
    throw new PlacesError('Nearby amenities lookup failed', 502)
  }

  return amenities
}

async function searchNearbyByCategory(
  category: Exclude<AmenityCategory, 'other'>,
  lat: number,
  lng: number,
  radiusMeters: number,
  serverKey: string,
): Promise<Amenity[]> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': serverKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.primaryType,places.types,places.rating',
    },
    body: JSON.stringify({
      locationRestriction: {
        circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters },
      },
      includedTypes: CATEGORY_TYPES[category],
      maxResultCount: 20,
      rankPreference: 'DISTANCE',
    }),
  })

  const data = (await res.json()) as SearchNearbyResponse

  if (!res.ok) {
    console.error(`Places API error (${category}): ${res.status}${data.error?.message ? ` — ${data.error.message}` : ''}`)
    throw new PlacesError(data.error?.message || `Nearby amenities lookup failed (${res.status})`, 502)
  }

  return (data.places ?? []).map((place) => ({
    id: place.id,
    name: place.displayName?.text ?? 'Unnamed place',
    // Known upfront — this request only ever searched `category`'s own
    // types, so there's no need to guess from primaryType/types anymore.
    category,
    primaryType: place.primaryType ?? place.types?.[0] ?? category,
    lat: place.location.latitude,
    lng: place.location.longitude,
    rating: place.rating,
  }))
}
