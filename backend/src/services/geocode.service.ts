import { env } from '../config/env.js'

export type GeocodeResult = {
  formattedAddress: string
  lat: number
  lng: number
}

/** Thrown for any geocoding failure; `status` is the HTTP status the controller should return. */
export class GeocodeError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

type GoogleGeocodeResponse = {
  status: string
  error_message?: string
  results: Array<{
    formatted_address: string
    geometry: { location: { lat: number; lng: number } }
  }>
}

/**
 * Calls Google's Geocoding API server-side, using a key that is NOT
 * referrer-restricted (Google rejects referrer-restricted keys outright for
 * this API — see GOOGLE_MAPS_SERVER_KEY in env.ts). This is why geocoding
 * lives behind the backend instead of being called directly from the browser
 * with the same key used for Maps JavaScript API.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  if (!env.googleMaps.serverKey) {
    throw new GeocodeError('Geocoding is not configured on the server', 503)
  }

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', address)
  url.searchParams.set('key', env.googleMaps.serverKey)

  const res = await fetch(url)
  const data = (await res.json()) as GoogleGeocodeResponse

  if (data.status === 'ZERO_RESULTS') {
    throw new GeocodeError('Address not found', 404)
  }

  if (data.status !== 'OK') {
    // Surface the real reason in server logs instead of letting every
    // failure mode collapse into "address not found" the way the old
    // client-side call did.
    console.error(`Geocoding API error: ${data.status}${data.error_message ? ` — ${data.error_message}` : ''}`)
    throw new GeocodeError(data.error_message || `Geocoding failed (${data.status})`, 502)
  }

  const result = data.results[0]
  if (!result) {
    throw new GeocodeError('Address not found', 404)
  }

  return {
    formattedAddress: result.formatted_address,
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
  }
}
