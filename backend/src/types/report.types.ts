export type ReportStatus = 'processing' | 'ready' | 'failed'

// Matches the categories the landing page already advertises
// (Vendor Appraisals, Bank Valuations, Buyer Advisory) plus the two
// seen in the dashboard's mock data (investor report, affordability
// check). Ties conceptually to the ERD's `report_templates` table —
// each of these would eventually map to one template row.
export type ReportType =
  | 'vendor-appraisal'
  | 'bank-valuation'
  | 'buyer-advisory'
  | 'investor-report'
  | 'affordability-check'

// Matches the `comparable_sales` table in the team's ERD.
export type ComparableSale = {
  comparableId: string
  comparableAddress: string
  salePrice: number
  saleDate: string
  distanceKm: number
  matchScorePct: number
  dataSource: string
}

// Matches the report-facing columns of the `reports` table in the ERD.
export type ReportStatusResult = {
  reportId: string
  reportType: ReportType
  status: ReportStatus
  estimatedValueLow: number | null
  estimatedValueHigh: number | null
  confidenceScorePct: number | null
  aiNarrativeText: string | null
  comparableSales: ComparableSale[]
  updatedAt: string
}
