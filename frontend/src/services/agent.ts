// Agent types + HTTP service — CRM client list, reports, notifications.

import { fetchJson } from './api-client'
import type { CaseItem } from './dashboard'
import type { InboxNotification } from './common'

export type ClientStatus =
  | 'prospecting'
  | 'active'
  | 'appraisal_sent'
  | 'listing'
  | 'sold'

export type ClientItem = {
  id: string
  name: string
  initials: string
  isStarred: boolean
  address: string | null
  reportCount: number
  status: ClientStatus
  followUpAt: string
}

export type ClientListSummary = {
  totalClients: number
  followUpsDueSoon: number
}

export function getClientListMockData(): Promise<ClientItem[]> {
  return fetchJson('/api/agent/clients')
}

export function getClientListSummary(): Promise<ClientListSummary> {
  return fetchJson('/api/agent/clients/summary')
}

export function getAgentReportListMockData(): Promise<CaseItem[]> {
  return fetchJson('/api/agent/reports')
}

export function getAgentNotifications(): Promise<InboxNotification[]> {
  return fetchJson('/api/agent/notifications')
}

export function getAgentUnreadNotificationCount(): Promise<number> {
  return fetchJson('/api/agent/notifications/unread-count')
}
