// These shapes are NOT invented here — they're copied from
// frontend/src/services/MOCK_API_README.md, which the frontend team wrote
// specifically so the backend could match their existing mock contracts
// exactly. Changing a field name here breaks the "drop-in swap" promise
// that README describes.

export type StepperStep = { id: string; label: string }

export type PropertyInputMethodOption = {
  id: string
  title: string
  description: string
  iconKey: 'address' | 'search' | 'upload'
}

export type PropertyInputData = {
  address: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  parking: number
  landSizeSqm: number
}

export type AiAnalysisMetric = {
  id: string
  label: string
  value: number // 0-100
  tone: 'blue' | 'teal' | 'orange' | 'sky'
}

export type AiAnalysisSummaryNotification = { title: string; message: string }

// NOTE: intentionally a different shape from ComparableSale in
// report.types.ts (that one matches the ERD's comparable_sales table).
// This one matches what the wizard's Comparables panel already renders.
export type ComparableSale = {
  id: string
  address: string
  price: number
  soldAgo: string // display string, e.g. "2 weeks ago"
  beds: number
  baths: number
  parking: number
  areaSqm: number
  matchPercent: number // 0-100
  distanceKm: number
}

export type SuburbOverviewMetric = {
  id: string
  label: string
  value: string // pre-formatted, e.g. "$845,000" / "+8.5%"
  tone?: 'positive' | 'default'
}

export type DemandSignal = {
  id: string
  label: string
  level: string // display label, e.g. "High"
  percent: number // 0-100
  tone: 'high' | 'medium' | 'strong'
}

export type ReportTemplateOption = {
  id: string
  title: string
  description: string
  iconKey: 'vendor' | 'bank' | 'buyer' | 'investment'
}

// In-memory draft accumulated across the 5 wizard steps for one
// in-progress appraisal. Temporary storage only, per team decision —
// same non-persistent pattern as the existing demo-session store, not a
// real DB table.
export type AppraisalDraft = {
  draftId: string
  createdAt: string
  updatedAt: string
  status: 'in_progress' | 'completed'
  propertyInput: PropertyInputData | null
  aiAnalysis: { metrics: AiAnalysisMetric[]; summary: AiAnalysisSummaryNotification } | null
  comparables: ComparableSale[] | null
  marketIntelligence: { suburbOverview: SuburbOverviewMetric[]; demandSignals: DemandSignal[] } | null
  reportTemplateId: string | null
}
