// Address geocoding — routed through our own backend (`/api/geocode`)
// rather than calling Google directly from the browser. Geocoding API
// rejects referrer-restricted keys outright, so it can't safely share the
// same key used for the Maps JavaScript API render in map-card.tsx.
//
// Goes through API_BASE_URL like every other service call — in dev that's
// empty and Vite's proxy forwards the relative path to localhost:4000, but
// in production (frontend on Vercel, backend on Render) there's no proxy,
// so a bare relative fetch would hit Vercel's own SPA catch-all instead of
// the real backend.
import { API_BASE_URL } from './api-client'

export type GeocodeResult = {
  formattedAddress: string
  lat: number
  lng: number
}

export class GeocodeRequestError extends Error {}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const res = await fetch(`${API_BASE_URL}/api/geocode?address=${encodeURIComponent(address)}`)
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message = (data && typeof data === 'object' && 'error' in data ? data.error : null) as
      | string
      | null
    throw new GeocodeRequestError(message || `Geocoding failed with status ${res.status}`)
  }

  return data as GeocodeResult
}
