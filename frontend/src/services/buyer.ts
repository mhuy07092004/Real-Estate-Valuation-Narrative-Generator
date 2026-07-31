// Buyer types + HTTP service — affordability, property search/saved, reports.

import type { PropertyCardData } from '../components/ui/property-card/property-card'
import { fetchJson } from './api-client'
import type { CaseItem } from './dashboard'
import type { InboxNotification } from './common'

export type AffordabilitySummaryTone = 'green' | 'red' | 'navy' | 'net'

export type AffordabilitySummaryRow = {
  label: string
  amount: number
  tone: AffordabilitySummaryTone
}

export type AffordabilityStatMetric = {
  label: string
  value: string
  trend: string
  tone: 'blue' | 'teal' | 'orange' | 'sky'
}

export type AffordabilityReturnTone = 'green' | 'red' | 'navy'

export type AffordabilityReturnRow = {
  label: string
  display: string
  tone: AffordabilityReturnTone
}

export type AffordabilityCalculationMock = {
  annualSummary: AffordabilitySummaryRow[]
  metrics: AffordabilityStatMetric[]
  investmentReturns: AffordabilityReturnRow[]
}

export function getAffordabilityCalculationMockData(): Promise<AffordabilityCalculationMock> {
  return fetchJson('/api/buyer/affordability-calculation')
}

export function getSearchProperties(): Promise<PropertyCardData[]> {
  return fetchJson('/api/buyer/properties/search')
}

export function getSavedProperties(): Promise<PropertyCardData[]> {
  return fetchJson('/api/buyer/properties/saved')
}

export function getBuyerReportListMockData(): Promise<CaseItem[]> {
  return fetchJson('/api/buyer/reports')
}

export function getBuyerNotifications(): Promise<InboxNotification[]> {
  return fetchJson('/api/buyer/notifications')
}

export function getBuyerUnreadNotificationCount(): Promise<number> {
  return fetchJson('/api/buyer/notifications/unread-count')
}
