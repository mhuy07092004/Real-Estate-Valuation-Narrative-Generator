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
  daysOnMarket: number         // e.g. 22
  daysOnMarketTrend: string    // e.g. "-3 days"
  rentalYield: string          // e.g. "3.4%"
  rentalYieldTrend: string     // e.g. "+0.2%"
}

export type MarketInsightsData = {
  suburb: string
  stats: MarketInsightsStats
  priceTrend: MarketTrendPoint[]   // 12 points, Jan-Dec
}

const MARKET_TREND_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function buildPriceTrend(indexValues: number[]): MarketTrendPoint[] {
  return MARKET_TREND_MONTHS.map((month, index) => ({
    month,
    priceIndex: indexValues[index],
  }))
}

const MARKET_INSIGHTS_MOCK: Record<string, MarketInsightsData> = {
  'richmond vic': {
    suburb: 'Richmond VIC',
    stats: {
      medianPrice: '$1.28M',
      medianPriceTrend: '+8.2%',
      monthlyGrowth: '+0.68%',
      monthlyGrowthTrend: '+0.12pp',
      daysOnMarket: 22,
      daysOnMarketTrend: '-3 days',
      rentalYield: '3.4%',
      rentalYieldTrend: '+0.2%',
    },
    priceTrend: buildPriceTrend([61, 65, 69, 73, 77, 81, 85, 89, 93, 97, 100, 103]),
  },
  'fitzroy vic': {
    suburb: 'Fitzroy VIC',
    stats: {
      medianPrice: '$980K',
      medianPriceTrend: '+5.4%',
      monthlyGrowth: '+0.45%',
      monthlyGrowthTrend: '+0.05pp',
      daysOnMarket: 18,
      daysOnMarketTrend: '-1 day',
      rentalYield: '3.9%',
      rentalYieldTrend: '+0.1%',
    },
    priceTrend: buildPriceTrend([70, 71, 73, 75, 76, 78, 79, 81, 82, 83, 84, 85]),
  },
  'south yarra vic': {
    suburb: 'South Yarra VIC',
    stats: {
      medianPrice: '$1.45M',
      medianPriceTrend: '+6.1%',
      monthlyGrowth: '+0.52%',
      monthlyGrowthTrend: '+0.08pp',
      daysOnMarket: 25,
      daysOnMarketTrend: '+2 days',
      rentalYield: '3.1%',
      rentalYieldTrend: '-0.1%',
    },
    priceTrend: buildPriceTrend([75, 77, 78, 80, 82, 83, 85, 87, 88, 90, 91, 92]),
  },
}

export const MARKET_INSIGHTS_KNOWN_SUBURBS: string[] = Object.values(MARKET_INSIGHTS_MOCK).map(
  (entry) => entry.suburb,
)

export function getMarketInsightsMockData(
  query: MarketInsightsQuery,
): Promise<MarketInsightsData | null> {
  const key = query.suburb.trim().toLowerCase()
  return Promise.resolve(MARKET_INSIGHTS_MOCK[key] ?? null)
}
