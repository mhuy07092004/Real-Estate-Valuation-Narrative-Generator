// Valuer types + HTTP service — evidence centre, valuation cases, notifications.

import { fetchJson } from './api-client'
import type { CaseItem } from './dashboard'
import type { InboxNotification } from './common'

export type EvidenceCategory = 'comparable' | 'market' | 'document' | 'history' | 'missing'
export type EvidenceStatus = 'verified' | 'pending' | 'missing'

export type EvidenceItem = {
  id: string
  title: string
  detail: string
  category: EvidenceCategory
  source: string
  status: EvidenceStatus
  confidence: number | null
  updatedAt: string
}

export type EvidenceCentreMockPayload = {
  totalItems: number
  missingCount: number
}

export type ValuationCasesMockPayload = {
  totalCases: number
  returnedForRevision: number
}

export function getEvidenceListMockData(): Promise<EvidenceItem[]> {
  return fetchJson('/api/valuer/evidence')
}

export function getEvidenceCentreMockData(): Promise<EvidenceCentreMockPayload> {
  return fetchJson('/api/valuer/evidence/summary')
}

export function getValuationCasesMockData(): Promise<ValuationCasesMockPayload> {
  return fetchJson('/api/valuer/cases/summary')
}

export function getValuerCaseListMockData(): Promise<CaseItem[]> {
  return fetchJson('/api/valuer/cases')
}

export function getValuerNotifications(): Promise<InboxNotification[]> {
  return fetchJson('/api/valuer/notifications')
}

export function getValuerUnreadNotificationCount(): Promise<number> {
  return fetchJson('/api/valuer/notifications/unread-count')
}

export type ValuerSavedEvidence = {
  id: string
  address: string
  savedAgo: string
  propertyType: string
  beds: number
  baths: number
  areaSqm: number
}

export function getValuerSavedEvidence(): Promise<ValuerSavedEvidence[]> {
  return fetchJson('/api/valuer/evidence/saved')
}
