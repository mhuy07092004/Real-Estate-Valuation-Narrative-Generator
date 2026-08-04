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
  email: string
  phone: string
  notes: string
  reportCount: number
  status: ClientStatus
  followUpAt: string
}

export type ClientListSummary = {
  totalClients: number
  followUpsDueSoon: number
}

type ApiSuccess<T> = {
  success: true
  data: T
}

type StoredClientRow = {
  clientId: string
  fullName: string
  email: string
  phone: string
  status: string
  notes: string | null
  addressLine: string
  suburb: string
  state: string
  postcode: string
  reportCount?: number
  createdAt: string
  updatedAt: string
}

type StoredReportRow = {
  reportId: string
  clientId: string | null
  propertyAddressLine: string
  propertySuburb: string
  propertyState: string
  propertyPostcode: string
  propertyType: string
  narrativeText: string
  pdfStoragePath: string | null
  updatedAt: string
  clientName: string | null
  clientEmail: string | null
}

type StoredReportResponse = {
  success: boolean
  data: StoredReportRow[]
}

function toInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return 'CL'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

function toClientStatus(status: string): ClientStatus {
  if (
    status === 'prospecting' ||
    status === 'active' ||
    status === 'appraisal_sent' ||
    status === 'listing' ||
    status === 'sold'
  ) {
    return status
  }
  return 'prospecting'
}

function toClientItem(row: StoredClientRow, reportCount: number): ClientItem {
  return {
    id: row.clientId,
    name: row.fullName,
    initials: toInitials(row.fullName),
    isStarred: false,
    address: `${row.addressLine}, ${row.suburb} ${row.state} ${row.postcode}`,
    email: row.email,
    phone: row.phone,
    notes: row.notes ?? '',
    reportCount,
    status: toClientStatus(row.status),
    followUpAt: row.updatedAt,
  }
}

export function getClientListMockData(): Promise<ClientItem[]> {
  return Promise.all([
    fetchJson<ApiSuccess<StoredClientRow[]>>('/api/clients'),
    fetchJson<StoredReportResponse>('/api/reports'),
  ]).then(([clientsResponse, reportsResponse]) => {
    const countByClientId = new Map<string, number>()
    const countByClientEmail = new Map<string, number>()

    for (const report of reportsResponse.data ?? []) {
      if (report.clientId) {
        countByClientId.set(report.clientId, (countByClientId.get(report.clientId) ?? 0) + 1)
      }

      const reportClientEmail = report.clientEmail?.trim().toLowerCase()
      if (reportClientEmail) {
        countByClientEmail.set(
          reportClientEmail,
          (countByClientEmail.get(reportClientEmail) ?? 0) + 1,
        )
      }
    }

    return clientsResponse.data.map((row) => {
      const emailKey = row.email.trim().toLowerCase()
      const reportCount =
        countByClientId.get(row.clientId) ?? countByClientEmail.get(emailKey) ?? row.reportCount ?? 0

      return toClientItem(row, reportCount)
    })
  })
}

export function getClientListSummary(): Promise<ClientListSummary> {
  return getClientListMockData().then((clients) => {
    const oneDayMs = 24 * 60 * 60 * 1000
    const now = Date.now()
    const followUpsDueSoon = clients.filter((item) => {
      const followUpTime = new Date(item.followUpAt).getTime()
      return Number.isFinite(followUpTime) && followUpTime <= now + oneDayMs
    }).length

    return {
      totalClients: clients.length,
      followUpsDueSoon,
    }
  })
}

export function updateClientNotes(id: string, notes: string): Promise<ClientItem> {
  return fetchJson<ApiSuccess<StoredClientRow>>(`/api/clients/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  }).then((response) => toClientItem(response.data, response.data.reportCount ?? 0))
}

export function getAgentReportListMockData(): Promise<CaseItem[]> {
  return fetchJson<StoredReportResponse>('/api/reports').then((response) =>
    (response.data ?? []).map((row) => {
      const clientParts = [row.clientName, row.clientEmail].filter(Boolean)
      return {
        id: row.reportId,
        address: row.propertyAddressLine,
        suburb: `${row.propertySuburb} ${row.propertyState} ${row.propertyPostcode}`,
        clientName: clientParts.length ? clientParts.join(' · ') : '',
        status: row.pdfStoragePath || row.clientEmail || row.clientName ? 'exported' : 'draft',
        purpose: `${row.propertyType} Appraisal`,
        confidence: null,
        updatedAt: row.updatedAt,
        hasWarning: false,
      } satisfies CaseItem
    }),
  )
}

export function getAgentNotifications(): Promise<InboxNotification[]> {
  return fetchJson('/api/agent/notifications')
}

export function getAgentUnreadNotificationCount(): Promise<number> {
  return fetchJson('/api/agent/notifications/unread-count')
}
