// Shared types + HTTP service for notifications, AI copilot, generate-appraisal wizard.

import { fetchJson } from './api-client'

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
  estimatedValue: number
  narrativeText: string
  pdfStoragePath: string | null
}

export async function getPersistedReport(reportId: string): Promise<PersistedReport> {
  const response = await fetchJson<ApiResponse<PersistedReport>>(`/api/reports/${reportId}`)
  if (!response.success) {
    throw new Error(response.message)
  }
  return response.data
}

export type PersistGeneratedReportInput = {
  reportTemplateId: string
  narrativeText: string
  estimatedValue: number
  clientName?: string
  clientEmail?: string
  markAsExported?: boolean
}

export async function persistGeneratedReport(input: PersistGeneratedReportInput): Promise<void> {
  const context = getAppraisalContext()
  if (!context?.address) {
    throw new Error('Property details are missing. Complete step 1 before saving report.')
  }

  const address = parseAddressContext(context.address)
  const body = {
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
    estimatedValue: input.estimatedValue,
    selectedComparableAddress: undefined,
    selectedComparableSoldPrice: undefined,
    selectedComparableSoldDate: undefined,
    marketSuburb: address.suburb,
    marketMeanHousePrice: undefined,
    marketMonthGrowthPct: undefined,
    marketRentalYieldPct: undefined,
    marketBuyerInterestLevel: undefined,
    marketSupplyLevel: undefined,
    marketPriceGrowthLevel: undefined,
    narrativeText: `[${input.reportTemplateId}] ${input.narrativeText}`,
    pdfStoragePath: input.markAsExported ? `exports/${Date.now()}.pdf` : undefined,
  }

  const response = await fetchJson<ApiResponse<{ reportId: string }>>('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.success) {
    throw new Error(response.message)
  }
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

export function getRoiDisclaimerNotification(): Promise<NotificationMock> {
  return fetchJson('/api/notifications/roi-disclaimer')
}

export function getAffordabilityDisclaimerNotification(): Promise<NotificationMock> {
  return fetchJson('/api/notifications/affordability-disclaimer')
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
// Market Intelligence (Generate Appraisal — step 3)
// ---------------------------------------------------------------------------

export type SuburbOverviewMetric = {
  id: string
  label: string
  value: string
  tone?: 'positive' | 'default'
}

export type DemandSignalTone = 'high' | 'medium' | 'strong'

export type DemandSignal = {
  id: string
  label: string
  level: string
  percent: number
  tone: DemandSignalTone
}

export function getSuburbOverview(): Promise<SuburbOverviewMetric[]> {
  return fetchJson(withAppraisalContext('/api/appraisal/suburb-overview'))
}

export function getDemandSignals(): Promise<DemandSignal[]> {
  return fetchJson(withAppraisalContext('/api/appraisal/demand-signals'))
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

export function getReportTemplates(): Promise<ReportTemplateOption[]> {
  return fetchJson(withAppraisalContext('/api/appraisal/report-templates'))
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

export type PropertyFactorItem = {
  id: string
  title: string
  description: string
}

export type PropertySpecificFactors = {
  title: string
  valueAddingTitle: string
  valueAdding: PropertyFactorItem[]
  riskTitle: string
  risk: PropertyFactorItem[]
}

export function getPropertySpecificFactors(): Promise<PropertySpecificFactors> {
  return fetchJson(withAppraisalContext('/api/appraisal/property-specific-factors'))
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

export type AppraisalDisclaimer = {
  title: string
  message: string
  footer: string
}

export function getAppraisalDisclaimer(): Promise<AppraisalDisclaimer> {
  return fetchJson(withAppraisalContext('/api/appraisal/appraisal-disclaimer'))
}
