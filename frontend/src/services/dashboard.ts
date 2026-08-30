// Shared dashboard types + HTTP service — role-parametrized dashboard home.

import type { AiInsight } from '../features/dashboard/components/ai-insights-panel'
import type { QuickActionTone } from '../features/dashboard/components/quick-actions-panel'
import type { RecentReport } from '../features/dashboard/components/recent-reports-panel'
import {
  DASHBOARD_COPY_BY_ROLE,
  type DashboardPipelineCopy,
  type DashboardThisWeekCopy,
} from '../features/dashboard/utils/dashboard-copy'
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
  | 'heart'
  | 'dollar'
export type DashboardActionIconKey =
  | 'sparkle'
  | 'document'
  | 'users'
  | 'userPlus'
  | 'nodes'
  | 'heart'
  | 'calculator'

export type DashboardStat = {
  label: string
  hint?: string
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
  tertiary?: ThisWeekMetric
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
  thisWeekCopy: DashboardThisWeekCopy
  pipelineCopy: DashboardPipelineCopy
  recentReportsTitle: string
  quickActionsTitle: string
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

type DashboardMetrics = {
  generatedReports: number
  generatedThisWeek: number
  activeClients: number
  newClientsThisWeek: number
  avgAppraisal: number
  pendingReports: number
  sentReportsCount: number
  sentThisWeek: number
  pipeline: AgentPipeline
  reports: RecentReport[]
}

async function loadDashboardMetrics(): Promise<DashboardMetrics> {
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

  return {
    generatedReports,
    generatedThisWeek,
    activeClients,
    newClientsThisWeek,
    avgAppraisal,
    pendingReports,
    sentReportsCount: sentReports.length,
    sentThisWeek: countCreatedThisWeek(sentReports),
    pipeline: countPipeline(clients),
    reports: reports
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
      }),
  }
}

function statValuesForRole(role: DashboardRole, metrics: DashboardMetrics): string[] {
  if (role === 'valuer') {
    return [String(metrics.sentReportsCount || 0), formatCompactCurrency(metrics.avgAppraisal || 0)]
  }

  if (role === 'investor') {
    return [String(metrics.generatedReports || 0), '4.3%', '6.8%']
  }

  if (role === 'buyer') {
    return [
      String(metrics.activeClients || 0),
      String(metrics.pipeline.appraisalSent || 0),
      String(metrics.generatedReports || 0),
    ]
  }

  return [
    String(metrics.generatedReports || 0),
    String(metrics.activeClients || 0),
    formatCompactCurrency(metrics.avgAppraisal || 0),
  ]
}

function statTrendsForRole(role: DashboardRole, metrics: DashboardMetrics): string[] {
  if (role === 'valuer') {
    return [`+${metrics.generatedThisWeek || 0} this week`, `+${metrics.sentThisWeek || 0} this week`]
  }

  if (role === 'investor') {
    return [`+${metrics.generatedThisWeek || 0} this week`, '+0.2% this week', '+0.4 this week']
  }

  if (role === 'buyer') {
    return [
      `+${metrics.newClientsThisWeek || 0} this week`,
      `+${metrics.pipeline.appraisalSent || 0} this week`,
      `+${metrics.generatedThisWeek || 0} this week`,
    ]
  }

  return [
    `+${metrics.generatedThisWeek || 0} this week`,
    `+${metrics.newClientsThisWeek || 0} new`,
    '+0 vs. last month',
  ]
}

async function getRoleDashboardPayload(role: DashboardRole): Promise<DashboardMockPayload> {
  const metrics = await loadDashboardMetrics()
  const copy = DASHBOARD_COPY_BY_ROLE[role]
  const values = statValuesForRole(role, metrics)
  const trends = statTrendsForRole(role, metrics)

  return {
    welcomeSubtitle: `${metrics.pendingReports || 0} pending client reports • ${metrics.activeClients || 0} active clients`,
    stats: copy.stats.map((stat, index) => ({
      ...stat,
      value: values[index] ?? '0',
      trend: trends[index] ?? '',
    })),
    reports: metrics.reports,
    insights: [],
    thisWeek:
      role === 'buyer'
        ? {
            reportsGenerated: { current: metrics.activeClients, total: metrics.activeClients },
            appraisalsSent: { current: metrics.generatedReports, total: metrics.generatedReports },
            tertiary: { current: metrics.pipeline.appraisalSent, total: metrics.pipeline.appraisalSent },
          }
        : {
            reportsGenerated: { current: metrics.generatedThisWeek, total: metrics.generatedReports },
            appraisalsSent: { current: metrics.sentThisWeek, total: metrics.sentReportsCount },
          },
    pipeline: metrics.pipeline,
    thisWeekCopy: copy.thisWeek,
    pipelineCopy: copy.pipeline,
    recentReportsTitle: copy.recentReportsTitle,
    quickActionsTitle: copy.quickActionsTitle,
    quickActions: copy.quickActions,
  }
}

export function getDashboardMockData(role: DashboardRole): Promise<DashboardMockPayload> {
  return getRoleDashboardPayload(role)
}
