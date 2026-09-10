// Valuer types + HTTP service — evidence centre, valuation cases, notifications.

import { fetchJson } from './api-client'
import type { CaseItem } from './dashboard'
import type { InboxNotification } from './common'

export type EvidenceCategory = 'comparable' | 'market' | 'document' | 'history' | 'missing'
export type EvidenceStatus = 'verified' | 'pending' | 'missing'

export type EvidenceItem = {
  id: string
  title: string
  detail: string
  category: EvidenceCategory
  source: string
  status: EvidenceStatus
  confidence: number | null
  updatedAt: string
}

export type EvidenceCentreMockPayload = {
  totalItems: number
  missingCount: number
}

export type ValuationCasesMockPayload = {
  totalCases: number
  returnedForRevision: number
}

export function getEvidenceListMockData(): Promise<EvidenceItem[]> {
  return fetchJson('/api/valuer/evidence')
}

export function getEvidenceCentreMockData(): Promise<EvidenceCentreMockPayload> {
  return fetchJson('/api/valuer/evidence/summary')
}

export function getValuationCasesMockData(): Promise<ValuationCasesMockPayload> {
  return fetchJson('/api/valuer/cases/summary')
}

export function getValuerCaseListMockData(): Promise<CaseItem[]> {
  return fetchJson('/api/valuer/cases')
}

export type UpdateCaseInput = {
  addressLine?: string
  status?: CaseItem['status']
}

export function updateValuerCase(id: string, input: UpdateCaseInput): Promise<CaseItem> {
  return fetchJson(`/api/valuer/cases/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function getValuerNotifications(): Promise<InboxNotification[]> {
  return fetchJson('/api/valuer/notifications')
}

export function getValuerUnreadNotificationCount(): Promise<number> {
  return fetchJson('/api/valuer/notifications/unread-count')
}

export type ValuerSavedEvidence = {
  id: string
  address: string
  savedAgo: string
  propertyType: string
  beds: number
  baths: number
  areaSqm: number
}

export function getValuerSavedEvidence(): Promise<ValuerSavedEvidence[]> {
  return fetchJson('/api/valuer/evidence/saved')
}

// ---------------------------------------------------------------------------
// Market Insights
// ---------------------------------------------------------------------------
// Independent copy for the valuer role — intentionally not shared/imported from
// services/agent.ts so each role's Market Insights page stays self-contained.

// Expected backend input: { suburb: string } — free-text "Suburb STATE", e.g. "Richmond VIC"
// Intended real endpoint (not wired yet): GET /api/valuer/market-insights?suburb=<suburb>
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
  return fetchJson(`/api/valuer/market-insights?${params.toString()}`)
}
