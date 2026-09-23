import { env } from '../config/env.js'

export type AddressSuggestion = {
  placeId: string
  mainText: string
  secondaryText: string
  /** Full suggestion text — what gets re-geocoded once the user picks it. */
  description: string
}

/** Thrown for any autocomplete lookup failure; `status` is the HTTP status the controller should return. */
export class AutocompleteError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

type GooglePlacePrediction = {
  placeId?: string
  text?: { text: string }
  structuredFormat?: {
    mainText?: { text: string }
    secondaryText?: { text: string }
  }
}

type GoogleAutocompleteResponse = {
  suggestions?: Array<{ placePrediction?: GooglePlacePrediction }>
  error?: { message?: string; status?: string }
}

/**
 * Calls Google's Places API (New) "Autocomplete" server-side — same reason
 * geocode.service.ts and places.service.ts live behind the backend: this API
 * rejects referrer-restricted keys, so it can't share the browser-side Maps
 * JavaScript API key used to render the map in map-card.tsx. Same server key
 * as those two (GOOGLE_MAPS_SERVER_KEY) — no new credentials needed, this is
 * the same Places API (New) product findNearbyAmenities already calls.
 *
 * `sessionToken` should be a client-generated id (e.g. crypto.randomUUID())
 * kept stable for one "typing session" — first keystroke through the user
 * picking a result or giving up. Google bills a whole session as one unit
 * instead of per-keystroke when a token is present, PROVIDED the session
 * ends with a matching Place Details call. This app currently resolves the
 * picked suggestion by re-running it through /api/geocode (geocode.service.ts)
 * rather than adding a third Google endpoint just for this, so that discount
 * isn't fully realized end-to-end yet — the token still groups the
 * in-progress keystrokes together, but if Places quota/cost becomes a
 * concern, swapping the resolve-on-select step for a Place Details call
 * keyed by placeId is the next optimization.
 */
export async function findAddressSuggestions(input: string, sessionToken?: string): Promise<AddressSuggestion[]> {
  if (!env.googleMaps.serverKey) {
    throw new AutocompleteError('Address suggestions are not configured on the server', 503)
  }

  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': env.googleMaps.serverKey,
    },
    body: JSON.stringify({
      input,
      ...(sessionToken ? { sessionToken } : {}),
      // Soft bias toward Australia (every address in this app is AU/NSW) —
      // this ranks AU matches higher without hard-excluding anything else,
      // unlike includedRegionCodes which would filter results outright.
      regionCode: 'au',
    }),
  })

  const data = (await res.json()) as GoogleAutocompleteResponse

  if (!res.ok) {
    console.error(`Places Autocomplete API error: ${res.status}${data.error?.message ? ` — ${data.error.message}` : ''}`)
    throw new AutocompleteError(data.error?.message || `Address suggestions failed (${res.status})`, 502)
  }

  return (data.suggestions ?? [])
    .map((suggestion) => suggestion.placePrediction)
    .filter((prediction): prediction is GooglePlacePrediction => Boolean(prediction?.placeId && prediction.text?.text))
    .map((prediction) => ({
      placeId: prediction.placeId!,
      mainText: prediction.structuredFormat?.mainText?.text ?? prediction.text!.text,
      secondaryText: prediction.structuredFormat?.secondaryText?.text ?? '',
      description: prediction.text!.text,
    }))
}
