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
export type DashboardActionIconKey = 'sparkle' | 'document' | 'users' | 'userPlus' | 'nodes'

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
  to?: string
}

export type ThisWeekMetric = {
  current: number
  total: number
}

export type AgentThisWeek = {
  reportsGenerated: ThisWeekMetric
  appraisalsSent: ThisWeekMetric
}

export type AgentPipeline = {
  prospecting: number
  appraisalSent: number
  listing: number
  sold: number
}

export type DashboardMockPayload = {
  welcomeSubtitle: string
  stats: DashboardStat[]
  reports: RecentReport[]
  insights: AiInsight[]
  quickActions: DashboardQuickActionData[]
  thisWeek?: AgentThisWeek
  pipeline?: AgentPipeline
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
  status?: string
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

function isCreatedThisWeek(isoDate: string): boolean {
  const created = new Date(isoDate).getTime()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  return Number.isFinite(created) && created >= Date.now() - sevenDaysMs
}

function countCreatedThisWeek(rows: Array<{ createdAt: string }>): number {
  return rows.filter((row) => isCreatedThisWeek(row.createdAt)).length
}

function countPipeline(clients: StoredClientRow[]): AgentPipeline {
  const pipeline: AgentPipeline = {
    prospecting: 0,
    appraisalSent: 0,
    listing: 0,
    sold: 0,
  }

  for (const client of clients) {
    if (client.status === 'prospecting') pipeline.prospecting += 1
    else if (client.status === 'appraisal_sent') pipeline.appraisalSent += 1
    else if (client.status === 'listing') pipeline.listing += 1
    else if (client.status === 'sold') pipeline.sold += 1
  }

  return pipeline
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

async function getAgentDashboardPayload(role: DashboardRole): Promise<DashboardMockPayload> {
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
  const sentReports = reports.filter((item) => Boolean(item.pdfStoragePath))
  const sentThisWeek = countCreatedThisWeek(sentReports)

  const stats: DashboardStat[] = [
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
  ]

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
        title: report.propertyAddressLine || `${report.propertyType || 'Report'}`,
        detail: `${formatCurrency(Number.isFinite(report.estimatedValue) ? report.estimatedValue : 0)} • ${status}`,
        timeAgo: getRelativeTimeLabel(report.updatedAt),
        clientName: report.clientName ?? '',
      }
    })

  return {
    welcomeSubtitle: `${pendingReports || 0} pending client reports • ${activeClients || 0} active clients`,
    stats: role === 'valuer' ? stats.slice(0, 2) : stats,
    reports: recentReports,
    insights: [],
    thisWeek: {
      reportsGenerated: { current: generatedThisWeek, total: generatedReports },
      appraisalsSent: { current: sentThisWeek, total: sentReports.length },
    },
    pipeline: countPipeline(clients),
    quickActions: [
      {
        id: 'client-reports',
        title: 'Client Reports',
        subtitle: 'View all reports',
        tone: 'teal',
        iconKey: 'document',
        to: `/dashboard/${role}/report`,
      },
      {
        id: 'add-client',
        title: 'Add Client',
        subtitle: 'Manage clients',
        tone: 'blue',
        iconKey: 'userPlus',
        to: `/dashboard/${role}/clients`,
      },
      {
        id: 'comparables',
        title: 'Comparables',
        subtitle: 'Comparable sales',
        tone: 'teal',
        iconKey: 'nodes',
        to: `/dashboard/${role}/generate-report?step=2`,
      },
    ],
  }
}

export function getDashboardMockData(role: DashboardRole): Promise<DashboardMockPayload> {
  return getAgentDashboardPayload(role)
}
