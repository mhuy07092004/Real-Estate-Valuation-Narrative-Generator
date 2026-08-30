// Investor types + HTTP service — ROI calculator, reports, notifications.

import { fetchJson } from './api-client'
import type { InboxNotification } from './common'

export type RoiSummaryTone = 'green' | 'red' | 'navy' | 'net'

export type RoiSummaryRow = {
  label: string
  amount: number
  tone: RoiSummaryTone
}

export type RoiStatMetric = {
  label: string
  value: string
  trend: string
  tone: 'blue' | 'teal' | 'orange' | 'sky'
}

export type RoiReturnTone = 'green' | 'red' | 'navy'

export type RoiReturnRow = {
  label: string
  display: string
  tone: RoiReturnTone
}

export type RoiCalculationMock = {
  annualSummary: RoiSummaryRow[]
  metrics: RoiStatMetric[]
  investmentReturns: RoiReturnRow[]
}

export type InvestorReportStatus = 'draft' | 'in_review' | 'shared' | 'archived'

export type InvestorReportListStatus = 'generated' | 'shared'

export type InvestorReportItem = {
  id: string
  propertyName: string
  suburb: string
  portfolio: string
  reportType: string
  status: InvestorReportStatus
  purchaseValue: number
  grossYield: number | null
  updatedAt: string
}

export type InvestorReportListItem = {
  id: string
  address: string
  suburb: string
  clientName: string
  status: InvestorReportListStatus
  estimatedValue: number
  beds: number
  baths: number
  areaSqm: number
  updatedAt: string
}

export type InvestorReportSummary = {
  totalReports: number
  draftCount: number
  sharedCount: number
}

export function getRoiCalculationMockData(): Promise<RoiCalculationMock> {
  return fetchJson('/api/investor/roi-calculation')
}

export function getInvestorReportListMockData(): Promise<InvestorReportListItem[]> {
  return fetchJson('/api/investor/reports')
}

export function getInvestorReportSummary(): Promise<InvestorReportSummary> {
  return fetchJson('/api/investor/reports/summary')
}

export function getInvestorNotifications(): Promise<InboxNotification[]> {
  return fetchJson('/api/investor/notifications')
}

export function getInvestorUnreadNotificationCount(): Promise<number> {
  return fetchJson('/api/investor/notifications/unread-count')
}

export type InvestorSavedProperty = {
  id: string
  address: string
  savedAgo: string
  propertyType: string
  beds: number
  baths: number
  areaSqm: number
}

export function getInvestorSavedProperties(): Promise<InvestorSavedProperty[]> {
  return fetchJson('/api/investor/properties/saved')
}

// ---------------------------------------------------------------------------
// Suburb Explorer
// ---------------------------------------------------------------------------
// Independent copy for the investor role — intentionally not shared/imported from
// services/agent.ts or services/buyer.ts so each role's page stays self-contained.

// Expected backend input: { suburb: string } — free-text "Suburb STATE", e.g. "Richmond VIC"
// Intended real endpoint (not wired yet): GET /api/investor/suburb-explorer?suburb=<suburb>
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
