// Address geocoding — routed through our own backend (`/api/geocode`)
// rather than calling Google directly from the browser. Geocoding API
// rejects referrer-restricted keys outright, so it can't safely share the
// same key used for the Maps JavaScript API render in map-card.tsx.

export type GeocodeResult = {
  formattedAddress: string
  lat: number
  lng: number
}

export class GeocodeRequestError extends Error {}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`)
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message = (data && typeof data === 'object' && 'error' in data ? data.error : null) as
      | string
      | null
    throw new GeocodeRequestError(message || `Geocoding failed with status ${res.status}`)
  }

  return data as GeocodeResult
}
