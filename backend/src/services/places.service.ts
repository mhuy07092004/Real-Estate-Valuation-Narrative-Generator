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

const TYPE_TO_CATEGORY = new Map<string, AmenityCategory>(
  Object.entries(CATEGORY_TYPES).flatMap(([category, types]) => types.map((type) => [type, category as AmenityCategory])),
)

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

function categoryFor(place: GooglePlace): AmenityCategory {
  if (place.primaryType && TYPE_TO_CATEGORY.has(place.primaryType)) {
    return TYPE_TO_CATEGORY.get(place.primaryType)!
  }
  const match = place.types?.find((type) => TYPE_TO_CATEGORY.has(type))
  return match ? TYPE_TO_CATEGORY.get(match)! : 'other'
}

/**
 * Calls Google's Places API (New) "Nearby Search" server-side — same reason
 * geocode.service.ts exists: this API rejects referrer-restricted keys, so
 * it can't share the browser-side Maps JavaScript API key in map-card.tsx.
 *
 * One request covers every category in CATEGORY_TYPES, ranked by distance,
 * capped at 20 results total (Google's per-request max). That means a
 * category-dense area (e.g. lots of cafes) can crowd out sparser ones
 * (e.g. schools) within the same radius — fine for a first pass, but if you
 * want guaranteed per-category coverage later, split this into one request
 * per category instead (more quota/cost, more even results).
 */
export async function findNearbyAmenities(lat: number, lng: number, radiusMeters: number): Promise<Amenity[]> {
  if (!env.googleMaps.serverKey) {
    throw new PlacesError('Nearby amenities lookup is not configured on the server', 503)
  }

  const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': env.googleMaps.serverKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.primaryType,places.types,places.rating',
    },
    body: JSON.stringify({
      locationRestriction: {
        circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters },
      },
      includedTypes: Object.values(CATEGORY_TYPES).flat(),
      maxResultCount: 20,
      rankPreference: 'DISTANCE',
    }),
  })

  const data = (await res.json()) as SearchNearbyResponse

  if (!res.ok) {
    console.error(`Places API error: ${res.status}${data.error?.message ? ` — ${data.error.message}` : ''}`)
    throw new PlacesError(data.error?.message || `Nearby amenities lookup failed (${res.status})`, 502)
  }

  return (data.places ?? []).map((place) => ({
    id: place.id,
    name: place.displayName?.text ?? 'Unnamed place',
    category: categoryFor(place),
    primaryType: place.primaryType ?? place.types?.[0] ?? 'other',
    lat: place.location.latitude,
    lng: place.location.longitude,
    rating: place.rating,
  }))
}
