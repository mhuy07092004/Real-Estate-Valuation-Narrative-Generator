// Shared dashboard types + HTTP service — role-parametrized dashboard home.

import type { AiInsight } from '../features/dashboard/components/ai-insights-panel'
import type { QuickActionTone } from '../features/dashboard/components/quick-actions-panel'
import type { RecentReport } from '../features/dashboard/components/recent-reports-panel'
import type { DashboardRole } from '../features/dashboard/utils/dashboard-role'
import { fetchJson } from './api-client'

export type DashboardStatIconKey =
  | 'document'
  | 'users'
  | 'trend'
  | 'clock'
  | 'checkCircle'
  | 'alertTriangle'
  | 'alertCircle'
export type DashboardActionIconKey = 'sparkle' | 'document' | 'users'

export type DashboardStat = {
  label: string
  value: string
  trend: string
  tone: 'blue' | 'teal' | 'orange' | 'sky'
  iconKey: DashboardStatIconKey
}

export type DashboardQuickActionData = {
  id: string
  title: string
  subtitle: string
  tone: QuickActionTone
  iconKey: DashboardActionIconKey
}

export type DashboardMockPayload = {
  welcomeSubtitle: string
  stats: DashboardStat[]
  reports: RecentReport[]
  insights: AiInsight[]
  quickActions: DashboardQuickActionData[]
}

export type CaseStatus =
  | 'valuer_review'
  | 'evidence_collection'
  | 'reviewer_approval'
  | 'approved'
  | 'exported'
  | 'draft'
  | 'returned_for_revision'

export type CaseItem = {
  id: string
  address: string
  suburb: string
  clientName: string
  status: CaseStatus
  purpose: string
  confidence: number | null
  updatedAt: string
  hasWarning: boolean
}

type ApiSuccess<T> = {
  success: true
  data: T
}

type StoredClientRow = {
  clientId: string
  createdAt: string
}

type StoredReportRow = {
  reportId: string
  propertyAddressLine: string
  propertyType: string
  estimatedValue: number
  clientName: string | null
  clientEmail: string | null
  pdfStoragePath: string | null
  createdAt: string
  updatedAt: string
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatCompactCurrency(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '$0'
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`
  return `$${Math.round(value)}`
}

function countCreatedThisWeek(rows: Array<{ createdAt: string }>): number {
  const now = Date.now()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  return rows.filter((row) => {
    const created = new Date(row.createdAt).getTime()
    return Number.isFinite(created) && created >= now - sevenDaysMs
  }).length
}

function getRelativeTimeLabel(isoDate: string): string {
  const timestamp = new Date(isoDate).getTime()
  if (!Number.isFinite(timestamp)) return '0'

  const deltaMs = Date.now() - timestamp
  const minutes = Math.max(0, Math.floor(deltaMs / (60 * 1000)))
  if (minutes < 60) return `${minutes || 0} minutes ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hours ago`

  const days = Math.floor(hours / 24)
  return `${days} days ago`
}

async function getAgentDashboardPayload(): Promise<DashboardMockPayload> {
  const [reportsRes, clientsRes] = await Promise.all([
    fetchJson<ApiSuccess<StoredReportRow[]>>('/api/reports'),
    fetchJson<ApiSuccess<StoredClientRow[]>>('/api/clients'),
  ])

  const reports = reportsRes.data ?? []
  const clients = clientsRes.data ?? []

  const generatedReports = reports.length
  const generatedThisWeek = countCreatedThisWeek(reports)
  const activeClients = clients.length
  const newClientsThisWeek = countCreatedThisWeek(clients)
  const avgAppraisal =
    reports.length > 0
      ? reports.reduce((sum, item) => sum + (Number.isFinite(item.estimatedValue) ? item.estimatedValue : 0), 0) /
        reports.length
      : 0
  const pendingReports = reports.filter((item) => !item.pdfStoragePath).length

  const recentReports: RecentReport[] = reports
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map((report) => {
      const status = report.pdfStoragePath
        ? 'Completed & Sent'
        : report.clientName || report.clientEmail
          ? 'In Review'
          : 'Draft'

      return {
        id: report.reportId,
        title: `${report.propertyType || 'Report'} - ${report.propertyAddressLine || '0'}`,
        detail: `${formatCurrency(Number.isFinite(report.estimatedValue) ? report.estimatedValue : 0)} • ${status}`,
        timeAgo: getRelativeTimeLabel(report.updatedAt),
      }
    })

  return {
    welcomeSubtitle: `${pendingReports || 0} pending client reports • ${activeClients || 0} active clients`,
    stats: [
      {
        label: 'Generated Reports',
        value: String(generatedReports || 0),
        trend: `+${generatedThisWeek || 0} this week`,
        tone: 'blue',
        iconKey: 'document',
      },
      {
        label: 'Active Clients',
        value: String(activeClients || 0),
        trend: `+${newClientsThisWeek || 0} new`,
        tone: 'teal',
        iconKey: 'users',
      },
      {
        label: 'Avg Appraisal',
        value: formatCompactCurrency(avgAppraisal || 0),
        trend: '+0 vs. last month',
        tone: 'orange',
        iconKey: 'trend',
      },
      {
        label: 'Pending Reports',
        value: String(pendingReports || 0),
        trend: '0 due today',
        tone: 'sky',
        iconKey: 'clock',
      },
    ],
    reports: recentReports,
    insights: [],
    quickActions: [
      { id: '1', title: 'Generate Appraisal', subtitle: 'Create new report', tone: 'blue', iconKey: 'sparkle' },
      { id: '2', title: 'Client Reports', subtitle: 'View all reports', tone: 'teal', iconKey: 'document' },
    ],
  }
}

export function getDashboardMockData(role: DashboardRole): Promise<DashboardMockPayload> {
  if (role === 'agent') {
    return getAgentDashboardPayload()
  }

  return fetchJson(`/api/dashboard/${role}`)
}
