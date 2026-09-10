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

export type AffordabilityCalculationInput = {
  yourAnnualIncome: number
  partnerAnnualIncome: number
  availableDeposit: number
  existingMonthlyDebt: number
  monthlyLivingExpenses: number
  councilRates: number
  landlordInsurance: number
}

export type AffordabilityCalculationResponse = AffordabilityCalculationMock & {
  estimatedBorrowingCapacity: number
  maxLoanAmount: number
  repaymentToIncomePct: number
}

export function calculateAffordability(
  input: AffordabilityCalculationInput,
): Promise<AffordabilityCalculationResponse> {
  return fetchJson('/api/buyer/affordability-calculation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
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

export type InspectionItemStatus = 'ok' | 'concern' | 'major_issue' | 'not_checked'

export type InspectionChecklistItem = {
  id: string
  label: string
  description: string
  status: InspectionItemStatus
  estimatedCost?: number
}

export type BuyerInspection = {
  id: string
  address: string
  suburb: string
  inspectionDate: string // ISO
  agents: string[]
  overallNotes: string
  checklist: InspectionChecklistItem[]
}

export function getBuyerInspections(): Promise<BuyerInspection[]> {
  return fetchJson('/api/buyer/inspections')
}

// Only called explicitly from the "Save Checklist" button — local edits
// (status, description, cost, notes) stay in component state and never hit
// the network until the user opts in to persist them.
export function saveBuyerInspection(inspection: BuyerInspection): Promise<BuyerInspection> {
  return fetchJson(`/api/buyer/inspections/${inspection.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inspection),
  })
}

export type CreateInspectionInput = {
  addressLine: string
  suburb: string
  inspectionDate: string // ISO
  agents: string[]
}

// The backend attaches the default 10-item checklist and empty notes —
// only the fields collected by the "Add Inspection" form are sent here.
export function createInspection(input: CreateInspectionInput): Promise<BuyerInspection> {
  return fetchJson('/api/buyer/inspections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
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
  return fetchJson(`/api/buyer/suburb-explorer?${params.toString()}`)
}
