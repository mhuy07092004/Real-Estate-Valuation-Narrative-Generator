// Address suggestions — routed through our own backend (`/api/places/autocomplete`)
// for the same reason geocode.ts and places.ts are: Places API (New) rejects
// referrer-restricted keys, so it can't be called with the browser-side
// Maps JavaScript API key used to render the map in map-card.tsx.
//
// Goes through API_BASE_URL like every other service call — see the note
// in geocode.ts for why a bare relative fetch breaks once frontend/backend
// are deployed separately (Vercel/Render).
import { API_BASE_URL } from './api-client'

export type AddressSuggestion = {
  placeId: string
  mainText: string
  secondaryText: string
  /** Full suggestion text — pass this straight to geocodeAddress() once picked. */
  description: string
}

export class AutocompleteRequestError extends Error {}

export async function getAddressSuggestions(input: string, sessionToken?: string): Promise<AddressSuggestion[]> {
  const params = new URLSearchParams({ input })
  if (sessionToken) params.set('sessionToken', sessionToken)

  const res = await fetch(`${API_BASE_URL}/api/places/autocomplete?${params}`)
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message = (data && typeof data === 'object' && 'error' in data ? data.error : null) as string | null
    throw new AutocompleteRequestError(message || `Address suggestions failed with status ${res.status}`)
  }

  return (data?.suggestions ?? []) as AddressSuggestion[]
}
