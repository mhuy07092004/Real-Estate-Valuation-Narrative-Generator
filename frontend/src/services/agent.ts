// Agent types + HTTP service — CRM client list, reports, notifications.

import { API_BASE_URL, fetchJson } from './api-client'
import type { InboxNotification } from './common'

export type ClientStatus =
  | 'prospecting'
  | 'active'
  | 'appraisal_sent'
  | 'listing'
  | 'sold'

export type ClientItem = {
  id: string
  name: string
  initials: string
  isStarred: boolean
  address: string | null
  email: string
  phone: string
  notes: string
  reportCount: number
  status: ClientStatus
  followUpAt: string
}

export type ClientListSummary = {
  totalClients: number
  followUpsDueSoon: number
}

type ApiSuccess<T> = {
  success: true
  data: T
}

type StoredClientRow = {
  clientId: string
  fullName: string
  email: string
  phone: string
  status: string
  notes: string | null
  addressLine: string
  suburb: string
  state: string
  postcode: string
  reportCount?: number
  createdAt: string
  updatedAt: string
}

type StoredReportRow = {
  reportId: string
  clientId: string | null
  propertyAddressLine: string
  propertySuburb: string
  propertyState: string
  propertyPostcode: string
  propertyType: string
  narrativeText: string
  pdfStoragePath: string | null
  updatedAt: string
  clientName: string | null
  clientEmail: string | null
}

type StoredReportResponse = {
  success: boolean
  data: StoredReportRow[]
}

function toInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return 'CL'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

function toClientStatus(status: string): ClientStatus {
  if (
    status === 'prospecting' ||
    status === 'active' ||
    status === 'appraisal_sent' ||
    status === 'listing' ||
    status === 'sold'
  ) {
    return status
  }
  return 'prospecting'
}

function toClientItem(row: StoredClientRow, reportCount: number): ClientItem {
  return {
    id: row.clientId,
    name: row.fullName,
    initials: toInitials(row.fullName),
    isStarred: false,
    address: `${row.addressLine}, ${row.suburb} ${row.state} ${row.postcode}`,
    email: row.email,
    phone: row.phone,
    notes: row.notes ?? '',
    reportCount,
    status: toClientStatus(row.status),
    followUpAt: row.updatedAt,
  }
}

function daysFromToday(days: number): string {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

const AGENT_CLIENTS_PAGE_MOCK: ClientItem[] = [
  {
    id: 'CL-1001',
    name: 'Sarah Mitchell',
    initials: 'SM',
    isStarred: false,
    address: '45 Park Ave, Richmond VIC',
    email: 'sarah.mitchell@email.com',
    phone: '0412 345 678',
    notes: 'Keen vendor, moving to Brisbane.',
    reportCount: 1,
    status: 'appraisal_sent',
    followUpAt: daysFromToday(0),
  },
  {
    id: 'CL-1002',
    name: 'David Park',
    initials: 'DP',
    isStarred: false,
    address: '12 Church St, Fitzroy VIC',
    email: 'david.park@email.com',
    phone: '0413 222 901',
    notes: 'Listing campaign in progress.',
    reportCount: 2,
    status: 'listing',
    followUpAt: daysFromToday(-2),
  },
  {
    id: 'CL-1003',
    name: 'Lisa Chen',
    initials: 'LC',
    isStarred: false,
    address: '88 Brunswick St, Fitzroy VIC',
    email: 'lisa.chen@email.com',
    phone: '0421 887 334',
    notes: 'Early prospect. Interested in Fitzroy.',
    reportCount: 0,
    status: 'prospecting',
    followUpAt: daysFromToday(-5),
  },
]

export function getClientListPageMockData(): Promise<ClientItem[]> {
  return Promise.resolve(AGENT_CLIENTS_PAGE_MOCK)
}

export function getClientListMockData(): Promise<ClientItem[]> {
  // /api/reports doesn't exist until the Report feature is built (Level 2,
  // depends on Client/ComparableSale). Using allSettled so a missing/failed
  // reports endpoint only degrades reportCount to its fallback instead of
  // wiping out otherwise-successful client data via Promise.all's fail-fast
  // behavior.
  return Promise.allSettled([
    fetchJson<ApiSuccess<StoredClientRow[]>>('/api/clients'),
    fetchJson<StoredReportResponse>('/api/reports'),
  ]).then(([clientsResult, reportsResult]) => {
    if (clientsResult.status === 'rejected') throw clientsResult.reason

    const countByClientId = new Map<string, number>()
    const countByClientEmail = new Map<string, number>()

    const reports = reportsResult.status === 'fulfilled' ? reportsResult.value.data ?? [] : []

    for (const report of reports) {
      if (report.clientId) {
        countByClientId.set(report.clientId, (countByClientId.get(report.clientId) ?? 0) + 1)
      }

      const reportClientEmail = report.clientEmail?.trim().toLowerCase()
      if (reportClientEmail) {
        countByClientEmail.set(
          reportClientEmail,
          (countByClientEmail.get(reportClientEmail) ?? 0) + 1,
        )
      }
    }

    return clientsResult.value.data.map((row) => {
      const emailKey = row.email.trim().toLowerCase()
      const reportCount =
        countByClientId.get(row.clientId) ?? countByClientEmail.get(emailKey) ?? row.reportCount ?? 0

      return toClientItem(row, reportCount)
    })
  })
}

export function getClientListSummary(): Promise<ClientListSummary> {
  return getClientListMockData().then((clients) => {
    const oneDayMs = 24 * 60 * 60 * 1000
    const now = Date.now()
    const followUpsDueSoon = clients.filter((item) => {
      const followUpTime = new Date(item.followUpAt).getTime()
      return Number.isFinite(followUpTime) && followUpTime <= now + oneDayMs
    }).length

    return {
      totalClients: clients.length,
      followUpsDueSoon,
    }
  })
}

export function updateClientNotes(id: string, notes: string): Promise<ClientItem> {
  return fetchJson<ApiSuccess<StoredClientRow>>(`/api/clients/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  }).then((response) => toClientItem(response.data, response.data.reportCount ?? 0))
}

export class CreateClientError extends Error {
  constructor(
    message: string,
    public errors?: Record<string, string>,
  ) {
    super(message)
  }
}

export type CreateClientInput = {
  fullName: string
  email: string
  phone: string
  status: ClientStatus
  notes: string
  addressLine: string
  suburb: string
  state: string
  postcode: string
}

// Bypasses fetchJson so a failed request's real message/errors body can be
// read (fetchJson only throws a generic "failed with status N") — but unlike
// auth.ts, this call is authenticated, so the bearer token is attached here.
export async function createClient(input: CreateClientInput): Promise<ClientItem> {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  const rawSession = window.localStorage.getItem('relaive_auth')
  if (rawSession) {
    try {
      const parsed = JSON.parse(rawSession) as { accessToken?: string }
      if (parsed.accessToken) headers.set('Authorization', `Bearer ${parsed.accessToken}`)
    } catch {
      // Ignore malformed session values; the request proceeds unauthenticated
      // and the backend will reject it with 401.
    }
  }

  const response = await fetch(`${API_BASE_URL}/api/clients`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  })

  const body = (await response.json()) as ApiSuccess<StoredClientRow> | {
    success: false
    message: string
    errors?: Record<string, string>
  }

  if (!body.success) {
    throw new CreateClientError(body.message, body.errors)
  }

  return toClientItem(body.data, body.data.reportCount ?? 0)
}

export type AgentClientReportStatus = 'generated' | 'shared'

export type AgentClientReport = {
  id: string
  address: string
  suburb: string
  clientName: string
  status: AgentClientReportStatus
  estimatedValue: number
  beds: number
  baths: number
  areaSqm: number
  updatedAt: string
}

export function getAgentReportListMockData(): Promise<AgentClientReport[]> {
  return fetchJson('/api/agent/reports')
}

export function getAgentNotifications(): Promise<InboxNotification[]> {
  return fetchJson('/api/agent/notifications')
}

export function getAgentUnreadNotificationCount(): Promise<number> {
  return fetchJson('/api/agent/notifications/unread-count')
}

export type AgentSavedProperty = {
  id: string
  address: string
  savedAgo: string
  propertyType: string
  beds: number
  baths: number
  areaSqm: number
}

export function getAgentSavedProperties(): Promise<AgentSavedProperty[]> {
  return fetchJson('/api/agent/properties/saved')
}

// ---------------------------------------------------------------------------
// Market Insights
// ---------------------------------------------------------------------------

// Expected backend input: { suburb: string } — free-text "Suburb STATE", e.g. "Richmond VIC"
// Intended real endpoint (not wired yet): GET /api/agent/market-insights?suburb=<suburb>
export type MarketInsightsQuery = {
  suburb: string
}

export type MarketTrendPoint = {
  month: string        // short month label, e.g. "Jan"
  priceIndex: number   // relative price index (not a dollar value), ~0-120 scale
}

export type MarketInsightsStats = {
  medianPrice: string          // pre-formatted, e.g. "$1.28M"
  medianPriceTrend: string     // e.g. "+8.2%"
  monthlyGrowth: string        // e.g. "+0.68%"
  monthlyGrowthTrend: string   // e.g. "+0.12pp"
  daysOnMarket: number | null  // null when genuinely unknown for this suburb — render "N/A", never the literal string "null"
  daysOnMarketTrend: string    // e.g. "-3 days"
  rentalYield: string          // e.g. "3.4%"
  rentalYieldTrend: string     // e.g. "+0.2%"
}

export type MarketInsightsData = {
  suburb: string
  stats: MarketInsightsStats
  priceTrend: MarketTrendPoint[]   // 12 points, Jan-Dec
}

// BACKEND-103: real suburbs with real MarketIntelligence rows, used only for
// this page's "try one of these" suggestion chips — not an exhaustive list
// of what the backend supports (814+ real suburbs exist; these three are
// just known-good examples with rich data, one per data-completeness tier).
export const MARKET_INSIGHTS_KNOWN_SUBURBS: string[] = ['Richmond VIC', 'Orange NSW', 'Box Hill NSW']

export function getMarketInsights(query: MarketInsightsQuery): Promise<MarketInsightsData | null> {
  const params = new URLSearchParams({ suburb: query.suburb })
  return fetchJson(`/api/agent/market-insights?${params.toString()}`)
}
