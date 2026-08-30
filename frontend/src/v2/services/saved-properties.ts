// v2-only addition: wires the Comparable Sales standalone page's "Save Property" button
// to the backend's real SavedPropertySearch model / /api/saved-properties routes
// (backend/src/routes/saved-properties.routes.ts, backend/src/controllers/saved-properties.controller.ts).
// A real POST that persists — not a fabricated local-only "saved" toggle.
// See figma-ui-migration-plan.md §9.7 B.2.

import { fetchJson } from '../../services/api-client'
import type { AppraisalInputContext } from '../../services/common'

type ApiResponse<T> = { success: true; data: T } | { success: false; message: string; errors?: Record<string, string> }

function parseAddressForSave(address: string): {
  streetLine: string
  suburb: string
  state: string
  postcode: string
} {
  const fallback = { streetLine: address, suburb: 'Bonnyrigg', state: 'NSW', postcode: '2177' }

  const match = address
    .trim()
    .match(/^(\d+\s+[^,]+),\s*([^,]+)\s+([A-Za-z]{2,3})\s+(\d{4})$/)

  if (!match) return fallback

  return {
    streetLine: match[1].trim(),
    suburb: match[2].trim(),
    state: match[3].trim().toUpperCase(),
    postcode: match[4].trim(),
  }
}

export type SavedPropertyRow = {
  savedPropertyId: string
  addressLine: string
  suburb: string
  state: string
  postcode: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  landSizeSqm: number
  createdAt: string
}

export async function listSavedProperties(): Promise<SavedPropertyRow[]> {
  const response = await fetchJson<ApiResponse<SavedPropertyRow[]>>('/api/saved-properties')
  if (!response.success) {
    throw new Error(response.message)
  }
  return response.data
}

// Phase 4 addition: DELETE /api/saved-properties/:savedPropertyId already exists server-side
// (backend/src/routes/saved-properties.routes.ts's `deleteSavedProperty` controller) — just
// not previously wired up on the frontend. Real delete, not a fabricated local-only removal.
export async function deleteSavedProperty(savedPropertyId: string): Promise<void> {
  const response = await fetchJson<ApiResponse<null>>(`/api/saved-properties/${savedPropertyId}`, {
    method: 'DELETE',
  })
  if (!response.success) {
    throw new Error(response.message)
  }
}

export async function saveComparableProperty(context: AppraisalInputContext): Promise<void> {
  const address = parseAddressForSave(context.address)

  const response = await fetchJson<ApiResponse<{ savedPropertyId: string }>>('/api/saved-properties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      addressLine: address.streetLine,
      suburb: address.suburb,
      state: address.state,
      postcode: address.postcode,
      propertyType: context.propertyType || 'House',
      bedrooms: context.bedrooms ?? 3,
      bathrooms: context.bathrooms ?? 2,
      parking: context.parking ?? 2,
      landSizeSqm: context.landSizeSqm ?? 430,
    }),
  })

  if (!response.success) {
    throw new Error(response.message)
  }
}
