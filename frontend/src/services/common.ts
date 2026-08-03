// Shared types + HTTP service for notifications, AI copilot, generate-appraisal wizard.

import { fetchJson } from './api-client'

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

export function getAppraisalSteps(): Promise<StepperStep[]> {
  return fetchJson('/api/appraisal/steps')
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
// AI Analysis Summary (used by Market Intelligence)
// ---------------------------------------------------------------------------

export type AiAnalysisSummaryNotification = {
  title: string
  message: string
}

export function getAiAnalysisSummaryNotification(): Promise<AiAnalysisSummaryNotification> {
  return fetchJson('/api/appraisal/ai-analysis-summary')
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
  return fetchJson('/api/appraisal/comparable-sales')
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
  return fetchJson('/api/appraisal/suburb-overview')
}

export function getDemandSignals(): Promise<DemandSignal[]> {
  return fetchJson('/api/appraisal/demand-signals')
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
}

export function getReportTemplates(): Promise<ReportTemplateOption[]> {
  return fetchJson('/api/appraisal/report-templates')
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

export function getNarrativePreview(): Promise<NarrativePreview> {
  return fetchJson('/api/appraisal/narrative-preview')
}
