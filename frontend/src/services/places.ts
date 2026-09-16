// Nearby-amenities lookup — routed through our own backend (`/api/places/nearby`)
// for the same reason services/geocode.ts is: Google's Places API rejects
// referrer-restricted keys, so it can't be called with the browser-side
// Maps JavaScript API key used to render the map in map-card.tsx.
//
// Goes through API_BASE_URL like every other service call — see the note
// in geocode.ts for why a bare relative fetch breaks once frontend/backend
// are deployed separately (Vercel/Render).
import { API_BASE_URL } from './api-client'

export type AmenityCategory = 'school' | 'grocery' | 'park' | 'transit' | 'healthcare' | 'dining' | 'other'

export type Amenity = {
  id: string
  name: string
  category: AmenityCategory
  primaryType: string
  lat: number
  lng: number
  rating?: number
}

export class PlacesRequestError extends Error {}

export async function getNearbyAmenities(lat: number, lng: number, radiusMeters = 5000): Promise<Amenity[]> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radiusMeters: String(radiusMeters),
  })
  const res = await fetch(`${API_BASE_URL}/api/places/nearby?${params}`)
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message = (data && typeof data === 'object' && 'error' in data ? data.error : null) as string | null
    throw new PlacesRequestError(message || `Nearby amenities lookup failed with status ${res.status}`)
  }

  return (data?.amenities ?? []) as Amenity[]
}
