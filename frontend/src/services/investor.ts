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

export type RoiCalculationInput = {
  purchasePrice: number
  deposit: number
  interestRate: number
  loanTermYears: number
  weeklyRent: number
  vacancyAllowance: number
  managementFee: number
  councilRates: number
  landlordInsurance: number
  maintenance: number
  landTax: number
}

export type RoiCalculationResponse = RoiCalculationMock & {
  grossYieldPct: number
  netYieldPct: number
  monthlyCashFlow: number
  cashOnCashReturnPct: number | null
}

export function calculateRoi(input: RoiCalculationInput): Promise<RoiCalculationResponse> {
  return fetchJson('/api/investor/roi-calculation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
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
  daysOnMarket: number | null  // null when genuinely unknown for this suburb — render "N/A", never the literal string "null"
  daysOnMarketTrend: string    // e.g. "-3 days"
  rentalYield: string          // e.g. "3.4%"
  rentalYieldTrend: string     // e.g. "+0.2%"
}

export type SuburbExplorerData = {
  suburb: string
  stats: SuburbExplorerStats
  priceTrend: SuburbTrendPoint[]   // 12 points, Jan-Dec
}

// BACKEND-103: real suburbs with real MarketIntelligence rows, used only for
// this page's "try one of these" suggestion chips — not an exhaustive list
// of what the backend supports (814+ real suburbs exist; these three are
// just known-good examples with rich data, one per data-completeness tier).
export const SUBURB_EXPLORER_KNOWN_SUBURBS: string[] = ['Richmond VIC', 'Orange NSW', 'Box Hill NSW']

export function getSuburbExplorer(query: SuburbExplorerQuery): Promise<SuburbExplorerData | null> {
  const params = new URLSearchParams({ suburb: query.suburb })
  return fetchJson(`/api/investor/suburb-explorer?${params.toString()}`)
}

// ---------------------------------------------------------------------------
// Market Comparison
// ---------------------------------------------------------------------------
// BACKEND-117: real endpoint, GET /api/investor/market-comparison. Only
// returns suburbs with a complete real value for every field below — a
// suburb missing even one (e.g. no exact-match ABS SA2 region, or no unit
// sales in the trailing 12-month window) is omitted, never fabricated.

export type MarketComparisonSuburb = {
  id: string
  suburb: string
  postcode: string
  medianHousePrice: number // dollars
  medianUnitPrice: number // dollars
  growth12m: number // %
  rentalYield: number // %
  vacancyRate: number // %, lower is better
  clearanceRate: number // %
  populationGrowth: number // % p.a.
  supplyConstraint: number // 0-100 score, higher is better
}

export type MarketComparisonAxisKey =
  | 'growth12m'
  | 'rentalYield'
  | 'vacancyRate'
  | 'clearanceRate'
  | 'populationGrowth'
  | 'supplyConstraint'

export type MarketComparisonAxis = {
  key: MarketComparisonAxisKey
  label: string
  higherIsBetter: boolean
}

// Radar chart dimensions. `higherIsBetter: false` (vacancyRate) is inverted when
// normalising scores so every axis reads "higher is better" on the chart.
export const MARKET_COMPARISON_AXES: MarketComparisonAxis[] = [
  { key: 'growth12m', label: 'Growth', higherIsBetter: true },
  { key: 'rentalYield', label: 'Yield', higherIsBetter: true },
  { key: 'vacancyRate', label: 'Low Vacancy', higherIsBetter: false },
  { key: 'clearanceRate', label: 'Clearance', higherIsBetter: true },
  { key: 'populationGrowth', label: 'Population', higherIsBetter: true },
  { key: 'supplyConstraint', label: 'Supply', higherIsBetter: true },
]

export function getMarketComparisonSuburbs(): Promise<MarketComparisonSuburb[]> {
  return fetchJson('/api/investor/market-comparison')
}
