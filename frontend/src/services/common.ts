// Shared types + HTTP service for notifications, AI copilot, generate-appraisal wizard.

import { API_BASE_URL, fetchJson } from './api-client'

export type AppraisalInputContext = {
  address: string
  propertyType?: string
  bedrooms?: number
  bathrooms?: number
  parking?: number
  landSizeSqm?: number
}

const APPRAISAL_CONTEXT_STORAGE_KEY = 'relaive_appraisal_input'

let appraisalContext: AppraisalInputContext | null = null

function readStoredAppraisalContext(): AppraisalInputContext | null {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(APPRAISAL_CONTEXT_STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AppraisalInputContext
  } catch {
    return null
  }
}

function getAppraisalContext(): AppraisalInputContext | null {
  if (appraisalContext) return appraisalContext
  appraisalContext = readStoredAppraisalContext()
  return appraisalContext
}

function withAppraisalContext(path: string): string {
  const context = getAppraisalContext()
  if (!context) return path

  const query = new URLSearchParams()
  query.set('address', context.address)
  if (context.propertyType) query.set('propertyType', context.propertyType)
  if (typeof context.bedrooms === 'number') query.set('bedrooms', String(context.bedrooms))
  if (typeof context.bathrooms === 'number') query.set('bathrooms', String(context.bathrooms))
  if (typeof context.parking === 'number') query.set('parking', String(context.parking))
  if (typeof context.landSizeSqm === 'number') query.set('landSizeSqm', String(context.landSizeSqm))

  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}${query.toString()}`
}

export function setAppraisalInputContext(context: AppraisalInputContext): void {
  appraisalContext = context
  if (typeof window === 'undefined') return
  window.localStorage.setItem(APPRAISAL_CONTEXT_STORAGE_KEY, JSON.stringify(context))
}

export function getAppraisalInputContext(): AppraisalInputContext | null {
  return getAppraisalContext()
}

// Last-computed ROI result from the investor's Step 3 calculator — carried
// across to the Generated Report step the same way the appraisal context
// crosses steps, so it can be saved onto the report without re-running the
// calculation. Investor-only; never set for other roles.
export type RoiPersistResult = {
  grossYieldPct: number
  netYieldPct: number
  monthlyCashFlow: number
  cashOnCashReturnPct: number | null
}

const ROI_RESULT_STORAGE_KEY = 'relaive_roi_result'

let roiResult: RoiPersistResult | null = null

export function setRoiResult(result: RoiPersistResult): void {
  roiResult = result
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ROI_RESULT_STORAGE_KEY, JSON.stringify(result))
}

export function getRoiResult(): RoiPersistResult | null {
  if (roiResult) return roiResult
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(ROI_RESULT_STORAGE_KEY)
  if (!raw) return null

  try {
    roiResult = JSON.parse(raw) as RoiPersistResult
    return roiResult
  } catch {
    return null
  }
}

// Last-computed affordability result from the buyer's Step 3 calculator —
// same pattern as RoiPersistResult. Buyer-only; never set for other roles.
export type AffordabilityPersistResult = {
  estimatedBorrowingCapacity: number
  maxLoanAmount: number
  repaymentToIncomePct: number
}

const AFFORDABILITY_RESULT_STORAGE_KEY = 'relaive_affordability_result'

let affordabilityResult: AffordabilityPersistResult | null = null

export function setAffordabilityResult(result: AffordabilityPersistResult): void {
  affordabilityResult = result
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AFFORDABILITY_RESULT_STORAGE_KEY, JSON.stringify(result))
}

export function getAffordabilityResult(): AffordabilityPersistResult | null {
  if (affordabilityResult) return affordabilityResult
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(AFFORDABILITY_RESULT_STORAGE_KEY)
  if (!raw) return null

  try {
    affordabilityResult = JSON.parse(raw) as AffordabilityPersistResult
    return affordabilityResult
  } catch {
    return null
  }
}

function parseAddressContext(address: string): {
  streetLine: string
  suburb: string
  state: string
  postcode: string
} {
  const fallback = {
    streetLine: address,
    suburb: 'Bonnyrigg',
    state: 'NSW',
    postcode: '2177',
  }

  const match = address
    .trim()
    .match(/^(\d+\s+[^,]+),\s*([^,]+)\s+([A-Za-z]{2,3})\s+(\d{4})$/)

  if (!match) return fallback

  return {
    streetLine: match[1].trim(),
    suburb: match[2].trim(),
    state: match[3].trim().toUpperCase(),
    postcode: match[4].trim(),
  }
}

type ApiSuccess<T> = {
  success: true
  data: T
}

type ApiFailure = {
  success: false
  message: string
  errors?: Record<string, string>
}

type ApiResponse<T> = ApiSuccess<T> | ApiFailure

export type PersistedReport = {
  reportId: string
  clientId: string | null
  propertyAddressLine: string
  propertySuburb: string
  propertyState: string
  propertyPostcode: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  parking: number
  landSizeSqm: number
  reportTemplateId: string
  estimatedValue: number
  narrativeText: string
  pdfStoragePath: string | null
  roiGrossYieldPct: number | null
  roiNetYieldPct: number | null
  roiMonthlyCashFlow: number | null
  roiCashOnCashReturnPct: number | null
  affordabilityEstimatedBorrowingCapacity: number | null
  affordabilityMaxLoanAmount: number | null
  affordabilityRepaymentToIncomePct: number | null
}

export async function getPersistedReport(reportId: string): Promise<PersistedReport> {
  const response = await fetchJson<ApiResponse<PersistedReport>>(`/api/reports/${reportId}`)
  if (!response.success) {
    throw new Error(response.message)
  }
  return response.data
}

export type ReportRole = 'agent' | 'valuer' | 'buyer' | 'investor'

export type PersistGeneratedReportInput = {
  role: ReportRole
  clientId?: string
  reportTemplateId: string
  narrativeText: string
  estimatedValue: number
  clientName?: string
  clientEmail?: string
  markAsExported?: boolean
  // Investor-only. Defaults to the last-computed Step 3 result if omitted;
  // pass explicitly (e.g. a reopened report's own saved values) to avoid
  // picking up stale/empty local storage from an unrelated session.
  roi?: RoiPersistResult | null
  // Buyer-only, same override semantics as `roi`.
  affordability?: AffordabilityPersistResult | null
  // Snapshot of exactly what the agent saw at generation time — persisted so
  // a share link (or a later reopen) shows the same figures forever, not a
  // live re-fetch that can drift as comparable/market data changes.
  priceRangeLow?: number
  priceRangeHigh?: number
  sections?: ReportSectionSnapshot[]
  comparables?: ComparableSale[]
  strategyCards?: { id: string; title: string; description: string; iconKey: string }[]
}

// Local shape, not imported from generated-report-panel.tsx (a UI component)
// to keep this a plain data/service module — structurally identical to that
// component's GeneratedReportSection prop type.
export type ReportSectionSnapshot = {
  id: string
  title: string
  paragraphs: ExecutiveSummarySegment[][]
}

export async function persistGeneratedReport(
  input: PersistGeneratedReportInput,
): Promise<{ reportId: string }> {
  const context = getAppraisalContext()
  if (!context?.address) {
    throw new Error('Property details are missing. Complete step 1 before saving report.')
  }

  const address = parseAddressContext(context.address)
  const roi = input.role === 'investor' ? (input.roi !== undefined ? input.roi : getRoiResult()) : null
  const affordability =
    input.role === 'buyer' ? (input.affordability !== undefined ? input.affordability : getAffordabilityResult()) : null
  const body = {
    role: input.role,
    clientId: input.clientId,
    clientName: input.clientName?.trim() || undefined,
    clientEmail: input.clientEmail?.trim() || undefined,
    propertyAddressLine: address.streetLine,
    propertySuburb: address.suburb,
    propertyState: address.state,
    propertyPostcode: address.postcode,
    propertyType: context.propertyType || 'House',
    bedrooms: context.bedrooms ?? 3,
    bathrooms: context.bathrooms ?? 2,
    parking: context.parking ?? 2,
    landSizeSqm: context.landSizeSqm ?? 430,
    reportTemplateId: input.reportTemplateId,
    estimatedValue: input.estimatedValue,
    narrativeText: input.narrativeText,
    pdfStoragePath: input.markAsExported ? `exports/${Date.now()}.pdf` : undefined,
    roiGrossYieldPct: roi?.grossYieldPct,
    roiNetYieldPct: roi?.netYieldPct,
    roiMonthlyCashFlow: roi?.monthlyCashFlow,
    roiCashOnCashReturnPct: roi ? roi.cashOnCashReturnPct : undefined,
    affordabilityEstimatedBorrowingCapacity: affordability?.estimatedBorrowingCapacity,
    affordabilityMaxLoanAmount: affordability?.maxLoanAmount,
    affordabilityRepaymentToIncomePct: affordability?.repaymentToIncomePct,
    priceRangeLow: input.priceRangeLow,
    priceRangeHigh: input.priceRangeHigh,
    sections: input.sections,
    comparables: input.comparables,
    strategyCards: input.strategyCards,
  }

  const response = await fetchJson<ApiResponse<{ reportId: string }>>('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.success) {
    throw new Error(response.message)
  }
  return response.data
}

export async function createShareLink(
  reportId: string,
  recipient?: { clientId?: string; clientName?: string; clientEmail?: string },
): Promise<string> {
  const response = await fetchJson<ApiResponse<{ shareToken: string }>>(`/api/reports/${reportId}/share-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recipient ?? {}),
  })

  if (!response.success) {
    throw new Error(response.message)
  }
  return `${window.location.origin}/shared-report/${response.data.shareToken}`
}

export async function sendReportEmail(
  reportId: string,
  payload: { clientId?: string; clientName: string; clientEmail: string; note?: string },
): Promise<string> {
  const response = await fetchJson<ApiResponse<{ shareUrl: string }>>(`/api/reports/${reportId}/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.success) {
    throw new Error(response.message)
  }
  return response.data.shareUrl
}

export type PublicReport = {
  reportTitle: string
  propertyAddressLine: string
  propertySuburb: string
  propertyState: string
  propertyPostcode: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  parking: number
  landSizeSqm: number
  estimatedValue: number
  priceRangeLow: number | null
  priceRangeHigh: number | null
  sections: ReportSectionSnapshot[] | null
  comparables: ComparableSale[] | null
  strategyCards: { id: string; title: string; description: string; iconKey: string }[] | null
  preparedByName: string
  preparedByRole: ReportRole
  createdAt: string
}

// Deliberately a plain fetch, not fetchJson — this is the one call in the
// app that must NEVER attach the viewer's own Authorization header (there
// may not even be a logged-in viewer at all; a client opening this link has
// no Relaive account).
export async function getPublicReport(token: string): Promise<PublicReport> {
  const response = await fetch(`${API_BASE_URL}/api/public/reports/${token}`)
  const body = (await response.json()) as ApiResponse<PublicReport>

  if (!body.success) {
    throw new Error(body.message)
  }
  return body.data
}

// ---------------------------------------------------------------------------
// Notifications / disclaimers
// ---------------------------------------------------------------------------

export type NotificationPriority = 'high' | 'medium' | 'low'
export type NotificationIconKind = 'ai' | 'market' | 'approval' | 'sale' | 'forecast' | 'report'

export type InboxNotification = {
  id: string
  title: string
  description: string
  priority: NotificationPriority
  timestamp: string
  isRead: boolean
  icon: NotificationIconKind
}

export type NotificationMock = {
  message: string
}

// Static compliance disclaimers — not user-specific/stateful, so no backend
// round-trip (the Notifications domain itself is still unbuilt, BACKEND-106,
// deferred). Previously fetched non-existent `/api/notifications/*`
// endpoints that always 404'd, silently stalling both calculator panels on
// "Loading…" forever since the panels gate rendering on this resolving.
export function getRoiDisclaimerNotification(): Promise<NotificationMock> {
  return Promise.resolve({
    message:
      'These calculations are estimates for indicative purposes only. They do not constitute financial advice. Consult a qualified financial adviser before making investment decisions.',
  })
}

export function getAffordabilityDisclaimerNotification(): Promise<NotificationMock> {
  return Promise.resolve({
    message:
      'These affordability figures are estimates for indicative purposes only. They do not constitute financial or lending advice. Confirm borrowing capacity with your lender before making purchase decisions.',
  })
}

// ---------------------------------------------------------------------------
// AI Copilot
// ---------------------------------------------------------------------------

export type CopilotConversation = {
  id: string
  title: string
  timestamp: string
  snippet: string
  pinned?: boolean
  active?: boolean
}

export type CopilotSuggestion = {
  id: string
  label: string
  icon: 'chart' | 'building' | 'compare' | 'document'
}

export type CopilotMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
}

export function getCopilotConversations(): Promise<CopilotConversation[]> {
  return fetchJson('/api/copilot/conversations')
}

export function getCopilotSuggestions(): Promise<CopilotSuggestion[]> {
  return fetchJson('/api/copilot/suggestions')
}

export function getCopilotMessages(): Promise<CopilotMessage[]> {
  return fetchJson('/api/copilot/messages')
}

// ---------------------------------------------------------------------------
// Stepper (appraisal / payment flows)
// ---------------------------------------------------------------------------

export type StepperStep = {
  id: string
  label: string
}

export function getAppraisalSteps(role?: string): Promise<StepperStep[]> {
  return fetchJson(role ? `/api/appraisal/steps?role=${role}` : '/api/appraisal/steps')
}

// ---------------------------------------------------------------------------
// Property input method (Generate Appraisal — step 1)
// ---------------------------------------------------------------------------

export type PropertyInputMethodIconKey = 'address' | 'search' | 'upload'

export type PropertyInputMethodOption = {
  id: string
  title: string
  description: string
  iconKey: PropertyInputMethodIconKey
}

export function getPropertyInputMethods(): Promise<PropertyInputMethodOption[]> {
  return fetchJson('/api/appraisal/property-input-methods')
}

export function getPropertyTypeOptions(): Promise<readonly string[]> {
  return fetchJson('/api/appraisal/property-types')
}

// ---------------------------------------------------------------------------
// Comparable Sales (Generate Appraisal — step 2)
// ---------------------------------------------------------------------------

export type ComparableSale = {
  id: string
  address: string
  price: number
  soldAgo: string
  beds: number
  baths: number
  parking: number
  areaSqm: number
  matchPercent: number
  distanceKm: number
}

export function getComparableSales(): Promise<ComparableSale[]> {
  return fetchJson(withAppraisalContext('/api/appraisal/comparable-sales'))
}

export type SubjectProperty = {
  address: string
  propertyType: string
  beds: number
  baths: number
  areaSqm: number
}

export type ComparableSalesSearchQuery = {
  address: string
  dateRange: string
  propertyType: string
}

export type ComparableSalesSearchResult = {
  isMatch: boolean
  subjectProperty: SubjectProperty | null
  sales: ComparableSale[]
}

export function searchComparableSales(
  query: ComparableSalesSearchQuery,
): Promise<ComparableSalesSearchResult> {
  const params = new URLSearchParams(query)
  return fetchJson(`/api/appraisal/comparable-sales/search?${params.toString()}`)
}

// ---------------------------------------------------------------------------
// Saved Properties (shared by the Comparable Sales page and, per role,
// Search Properties / Saved Properties / Saved Evidence pages)
// ---------------------------------------------------------------------------

export type SavedPropertyItem = {
  id: string
  address: string
  savedAgo: string
  propertyType: string
  beds: number
  baths: number
  areaSqm: number
}

export type SavePropertyInput = {
  addressLine: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  areaSqm: number
}

export function saveProperty(input: SavePropertyInput): Promise<SavedPropertyItem> {
  return fetchJson('/api/properties/saved', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function deleteSavedProperty(id: string): Promise<void> {
  return fetchJson(`/api/properties/saved/${id}`, { method: 'DELETE' })
}

// ---------------------------------------------------------------------------
// Market Intelligence (Generate Appraisal — step 3)
// ---------------------------------------------------------------------------

export type SuburbOverviewMetric = {
  id: string
  label: string
  value: string
  tone?: 'positive' | 'default'
}

export function getSuburbOverview(): Promise<SuburbOverviewMetric[]> {
  return fetchJson(withAppraisalContext('/api/appraisal/suburb-overview'))
}

export type MarketIntelligenceStat = {
  id: string
  label: string
  value: string
  trend: string
}

export type MarketIntelligenceTrendPoint = {
  month: string
  priceIndex: number
}

export type MarketIntelligenceOverview = {
  suburbLabel: string
  stats: MarketIntelligenceStat[]
  priceTrend: MarketIntelligenceTrendPoint[]
}

export function getMarketIntelligenceOverview(): Promise<MarketIntelligenceOverview> {
  return fetchJson(withAppraisalContext('/api/appraisal/market-intelligence-overview'))
}

// ---------------------------------------------------------------------------
// Report Configuration (Generate Appraisal — step 4)
// ---------------------------------------------------------------------------

export type ReportTemplateIconKey = 'vendor' | 'bank' | 'buyer' | 'investment'

export type ReportTemplateOption = {
  id: string
  title: string
  description: string
  iconKey: ReportTemplateIconKey
  includes: string[]
}

// Templates are locked one-per-role, not freely chosen — this returns the
// single template for the caller's dashboard role, not a list.
export function getReportTemplate(role: ReportRole): Promise<ReportTemplateOption> {
  return fetchJson(`/api/appraisal/report-templates?role=${role}`)
}

export type NarrativePreviewSection = {
  heading: string
  body: string
}

export type NarrativePreview = {
  title: string
  sections: NarrativePreviewSection[]
  disclaimer: string
}

export function getNarrativePreview(reportType?: string): Promise<NarrativePreview> {
  const path = withAppraisalContext('/api/appraisal/narrative-preview')
  if (!reportType) return fetchJson(path)

  const separator = path.includes('?') ? '&' : '?'
  return fetchJson(`${path}${separator}reportType=${encodeURIComponent(reportType)}`)
}

export type AppraisalSummaryStat = {
  id: string
  value: string
  label: string
}

export type AppraisalSummary = {
  eyebrow: string
  date: string
  street: string
  suburbLine: string
  featuresLine: string
  appraisalLabel: string
  priceRange: string
  midpointEstimate: string
  stats: AppraisalSummaryStat[]
}

export function getAppraisalSummary(): Promise<AppraisalSummary> {
  return fetchJson(withAppraisalContext('/api/appraisal/appraisal-summary'))
}

export type ExecutiveSummarySegment = {
  text: string
  highlight?: boolean
}

export type ExecutiveSummary = {
  title: string
  paragraphs: ExecutiveSummarySegment[][]
  observationTitle: string
  observationMessage: string
}

export function getExecutiveSummary(): Promise<ExecutiveSummary> {
  return fetchJson(withAppraisalContext('/api/appraisal/executive-summary'))
}

export type AgentRecommendationIconKey = 'campaign' | 'presentation' | 'marketing'

export type AgentRecommendationItem = {
  id: string
  title: string
  description: string
  iconKey: AgentRecommendationIconKey
  highlighted?: boolean
}

export type AgentRecommendations = {
  title: string
  items: AgentRecommendationItem[]
}

export function getAgentRecommendations(): Promise<AgentRecommendations> {
  return fetchJson(withAppraisalContext('/api/appraisal/agent-recommendations'))
}

export type GrowthOutlook = {
  title: string
  paragraphs: ExecutiveSummarySegment[][]
}

// Investor-only — quotes the real ROI numbers from Step 3 (or a reopened
// report's saved values). Pass null when no ROI calculation exists yet
// (never run, or a non-investor report); the backend returns an honest
// "run the ROI step" message rather than a fabricated figure.
export function getGrowthOutlook(roi: RoiPersistResult | null): Promise<GrowthOutlook> {
  const query = new URLSearchParams()
  if (roi) {
    query.set('roiGrossYieldPct', String(roi.grossYieldPct))
    query.set('roiNetYieldPct', String(roi.netYieldPct))
    query.set('roiMonthlyCashFlow', String(roi.monthlyCashFlow))
    if (roi.cashOnCashReturnPct !== null) {
      query.set('roiCashOnCashReturnPct', String(roi.cashOnCashReturnPct))
    }
  }
  const suffix = query.toString()
  return fetchJson(`/api/appraisal/growth-outlook${suffix ? `?${suffix}` : ''}`)
}

export type AffordabilityOutlook = {
  title: string
  paragraphs: ExecutiveSummarySegment[][]
}

// Buyer-only — quotes the real affordability numbers from Step 3 (or a
// reopened report's saved values). Pass null when no calculation exists yet.
export function getAffordabilityOutlook(
  affordability: AffordabilityPersistResult | null,
): Promise<AffordabilityOutlook> {
  const query = new URLSearchParams()
  if (affordability) {
    query.set('affordabilityEstimatedBorrowingCapacity', String(affordability.estimatedBorrowingCapacity))
    query.set('affordabilityMaxLoanAmount', String(affordability.maxLoanAmount))
    query.set('affordabilityRepaymentToIncomePct', String(affordability.repaymentToIncomePct))
  }
  const suffix = query.toString()
  return fetchJson(`/api/appraisal/affordability-outlook${suffix ? `?${suffix}` : ''}`)
}

export type AppraisalDisclaimer = {
  title: string
  message: string
  footer: string
}

export function getAppraisalDisclaimer(): Promise<AppraisalDisclaimer> {
  return fetchJson(withAppraisalContext('/api/appraisal/appraisal-disclaimer'))
}
