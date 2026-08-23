// v2-only additions to the agent service surface: create/update client, which
// the backend already supports (POST/PATCH /api/clients) but v1's services/agent.ts
// doesn't expose yet. New exports only — v1's service file is untouched.
// See figma-ui-migration-plan.md §9.1 (Clients).

import { API_BASE_URL } from '../../services/api-client'
import type { ClientStatus } from '../../services/agent'
import type { CaseStatus } from '../../services/dashboard'

export class ClientApiError extends Error {
  fieldErrors?: Record<string, string>

  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message)
    this.name = 'ClientApiError'
    this.fieldErrors = fieldErrors
  }
}

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; message: string; errors?: Record<string, string> }

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  try {
    const raw = window.localStorage.getItem('relaive_auth')
    if (raw) {
      const parsed = JSON.parse(raw) as { accessToken?: string }
      if (parsed.accessToken) headers.Authorization = `Bearer ${parsed.accessToken}`
    }
  } catch {
    // Ignore malformed session; request proceeds unauthenticated and the API will 401.
  }
  return headers
}

async function requestClient<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: authHeaders() })
  const body = (await response.json()) as ApiResponse<T>

  if (!body.success) {
    throw new ClientApiError(body.message, body.errors)
  }

  return body.data
}

export type CreateClientInput = {
  fullName: string
  email: string
  phone: string
  status: ClientStatus
  notes?: string
  addressLine: string
  suburb: string
  state: string
  postcode: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  parking: number
  landSizeSqm: number
}

export type UpdateClientInput = Partial<CreateClientInput>

export function createClient(input: CreateClientInput): Promise<unknown> {
  return requestClient('/api/clients', { method: 'POST', body: JSON.stringify(input) })
}

export function updateClient(clientId: string, input: UpdateClientInput): Promise<unknown> {
  return requestClient(`/api/clients/${clientId}`, { method: 'PATCH', body: JSON.stringify(input) })
}

// --- Report cards (richer than v1's CaseItem — same /api/reports endpoint, more fields read) ---
// v1's services/agent.ts -> getAgentReportListMockData() maps /api/reports into CaseItem, which
// drops fields (estimatedValue, bedrooms, bathrooms, landSizeSqm) that the backend already returns.
// This reads the same real endpoint and keeps them, for the richer v2 report cards.

export type AgentReportCard = {
  id: string
  title: string
  address: string
  suburb: string
  clientName: string | null
  estimatedValue: number
  bedrooms: number
  bathrooms: number
  landSizeSqm: number
  status: CaseStatus
  updatedAt: string
}

type StoredReportRow = {
  reportId: string
  propertyAddressLine: string
  propertySuburb: string
  propertyState: string
  propertyPostcode: string
  propertyType: string
  estimatedValue: number
  bedrooms: number
  bathrooms: number
  landSizeSqm: number
  pdfStoragePath: string | null
  clientName: string | null
  clientEmail: string | null
  updatedAt: string
}

export async function getAgentReportCards(): Promise<AgentReportCard[]> {
  const rows = await requestClient<StoredReportRow[]>('/api/reports', { method: 'GET' })

  return rows.map((row) => ({
    id: row.reportId,
    title: `${row.propertyType || 'Report'} – ${row.propertyAddressLine}`,
    address: row.propertyAddressLine,
    suburb: `${row.propertySuburb} ${row.propertyState} ${row.propertyPostcode}`,
    clientName: row.clientName,
    estimatedValue: row.estimatedValue,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    landSizeSqm: row.landSizeSqm,
    status: row.pdfStoragePath || row.clientEmail || row.clientName ? 'exported' : 'draft',
    updatedAt: row.updatedAt,
  }))
}
