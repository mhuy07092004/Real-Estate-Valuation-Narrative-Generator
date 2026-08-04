// Buyer types + HTTP service — affordability, property search/saved, reports.

import type { PropertyCardData } from '../components/ui/property-card/property-card'
import { fetchJson } from './api-client'
import type { CaseItem } from './dashboard'
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
