// Buyer types + HTTP service — affordability, property search/saved, reports.

import type { PropertyCardData } from '../components/ui/property-card/property-card'
import { fetchJson } from './api-client'
import type { InboxNotification } from './common'

export type AffordabilitySummaryValueTone = 'orange' | 'green' | 'red' | 'navy'

export type AffordabilitySummaryRow = {
  label: string
  value: string
  valueTone?: AffordabilitySummaryValueTone
}

export type AffordabilityStatMetric = {
  label: string
  value: string
  trend?: string
  tone: 'blue' | 'teal' | 'orange' | 'sky'
  valueClassName?: string
}

export type AffordabilityCalculationMock = {
  summary: AffordabilitySummaryRow[]
  metrics: AffordabilityStatMetric[]
}

export function getAffordabilityCalculationMockData(): Promise<AffordabilityCalculationMock> {
  return fetchJson('/api/buyer/affordability-calculation')
}

export function getSearchProperties(): Promise<PropertyCardData[]> {
  return fetchJson('/api/buyer/properties/search')
}

export type BuyerSavedProperty = {
  id: string
  address: string
  savedAgo: string
  propertyType: string
  beds: number
  baths: number
  areaSqm: number
}

export function getSavedProperties(): Promise<BuyerSavedProperty[]> {
  return fetchJson('/api/buyer/properties/saved')
}

export type BuyerReportListStatus = 'generated' | 'shared'

export type BuyerReportListItem = {
  id: string
  address: string
  suburb: string
  clientName: string
  status: BuyerReportListStatus
  estimatedValue: number
  beds: number
  baths: number
  areaSqm: number
  updatedAt: string
}

export function getBuyerReportListMockData(): Promise<BuyerReportListItem[]> {
  return fetchJson('/api/buyer/reports')
}

export function getBuyerNotifications(): Promise<InboxNotification[]> {
  return fetchJson('/api/buyer/notifications')
}

export function getBuyerUnreadNotificationCount(): Promise<number> {
  return fetchJson('/api/buyer/notifications/unread-count')
}

// ---------------------------------------------------------------------------
// Suburb Explorer
// ---------------------------------------------------------------------------
// Independent copy for the buyer role — intentionally not shared/imported from
// services/agent.ts or services/investor.ts so each role's page stays self-contained.

// Expected backend input: { suburb: string } — free-text "Suburb STATE", e.g. "Richmond VIC"
// Intended real endpoint (not wired yet): GET /api/buyer/suburb-explorer?suburb=<suburb>
export type SuburbExplorerQuery = {
  suburb: string
}

export type SuburbTrendPoint = {
  month: string        // short month label, e.g. "Jan"
  priceIndex: number   // relative price index (not a dollar value), ~0-120 scale
}

export type SuburbExplorerStats = {
  medianPrice: string          // pre-formatted, e.g. "$1.28M"
  medianPriceTrend: string     // e.g. "+8.2%"
  monthlyGrowth: string        // e.g. "+0.68%"
  monthlyGrowthTrend: string   // e.g. "+0.12pp"
  daysOnMarket: number         // e.g. 22
  daysOnMarketTrend: string    // e.g. "-3 days"
  rentalYield: string          // e.g. "3.4%"
  rentalYieldTrend: string     // e.g. "+0.2%"
}

export type SuburbExplorerData = {
  suburb: string
  stats: SuburbExplorerStats
  priceTrend: SuburbTrendPoint[]   // 12 points, Jan-Dec
}

const SUBURB_TREND_MONTHS = [
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

function buildSuburbPriceTrend(indexValues: number[]): SuburbTrendPoint[] {
  return SUBURB_TREND_MONTHS.map((month, index) => ({
    month,
    priceIndex: indexValues[index],
  }))
}

const SUBURB_EXPLORER_MOCK: Record<string, SuburbExplorerData> = {
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
    priceTrend: buildSuburbPriceTrend([61, 65, 69, 73, 77, 81, 85, 89, 93, 97, 100, 103]),
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
    priceTrend: buildSuburbPriceTrend([70, 71, 73, 75, 76, 78, 79, 81, 82, 83, 84, 85]),
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
    priceTrend: buildSuburbPriceTrend([75, 77, 78, 80, 82, 83, 85, 87, 88, 90, 91, 92]),
  },
}

export const SUBURB_EXPLORER_KNOWN_SUBURBS: string[] = Object.values(SUBURB_EXPLORER_MOCK).map(
  (entry) => entry.suburb,
)

export function getSuburbExplorerMockData(
  query: SuburbExplorerQuery,
): Promise<SuburbExplorerData | null> {
  const key = query.suburb.trim().toLowerCase()
  return Promise.resolve(SUBURB_EXPLORER_MOCK[key] ?? null)
}
