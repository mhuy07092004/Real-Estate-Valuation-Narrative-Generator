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
import { getCaseStatusLabel } from '../components/ui/table/status-badge'
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
  // BACKEND-122 (buyer-only): real upcoming inspections, separate from
  // `reports` — the "Upcoming Inspections" panel used to reuse `reports`
  // directly, showing report objects mislabeled as inspections.
  inspections?: RecentReport[]
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
  clientName: string | null
  status: CaseStatus
  confidence: number | null
  estimatedValue: number
  createdAt: string
  updatedAt: string
}

// BACKEND-120: valuer's real "completed" concept — caseStatus, not
// pdfStoragePath (see the ticket for why that field was structurally wrong:
// it's never written by any current backend path, so it always reads 0).
const COMPLETED_CASE_STATUSES = new Set<CaseStatus>(['approved', 'exported'])

function isThisCalendarMonth(isoDate: string): boolean {
  const d = new Date(isoDate)
  const now = new Date()
  return Number.isFinite(d.getTime()) && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

// Real per-case value distribution across the same 4 buckets already
// labeled in dashboard-copy.ts's valuer.pipeline ('< $800K', '$800K–$1.2M',
// '$1.2M–$2M', '> $2M') — reusing AgentPipeline's 4-slot shape the same way
// the panel component already does generically, just filled with a real
// count-by-price-range instead of client-status counts that never matched
// those labels' meaning at all.
function bucketCasesByValue(cases: CaseItem[]): AgentPipeline {
  const buckets: AgentPipeline = { prospecting: 0, appraisalSent: 0, listing: 0, sold: 0 }
  for (const item of cases) {
    if (item.estimatedValue < 800_000) buckets.prospecting += 1
    else if (item.estimatedValue < 1_200_000) buckets.appraisalSent += 1
    else if (item.estimatedValue < 2_000_000) buckets.listing += 1
    else buckets.sold += 1
  }
  return buckets
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

// BACKEND-119: shape returned by the real role-scoped report endpoints
// (currently only /api/agent/reports is wired up this way — see
// report-list.controller.ts's toRoleReportItem). Deliberately a plain
// array response, no { success, data } envelope, matching that endpoint.
type RoleReportItem = {
  id: string
  address: string
  suburb: string
  clientName: string | null
  status: 'shared' | 'generated'
  estimatedValue: number
  beds: number
  baths: number
  areaSqm: number
  createdAt: string
  updatedAt: string
}

// Common shape both StoredReportRow (legacy, unscoped /api/reports) and
// RoleReportItem (real, role-scoped) get normalized into, so the rest of
// this file's aggregation logic doesn't need to know which source a given
// role's reports came from.
type NormalizedReport = {
  id: string
  addressLine: string
  estimatedValue: number
  wasSent: boolean
  clientName: string | null
  createdAt: string
  updatedAt: string
}

function normalizeLegacyReport(row: StoredReportRow): NormalizedReport {
  return {
    id: row.reportId,
    addressLine: row.propertyAddressLine || row.propertyType || 'Report',
    estimatedValue: Number.isFinite(row.estimatedValue) ? row.estimatedValue : 0,
    wasSent: Boolean(row.pdfStoragePath),
    clientName: row.clientName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function normalizeRoleReport(row: RoleReportItem): NormalizedReport {
  return {
    id: row.id,
    addressLine: row.address,
    estimatedValue: Number.isFinite(row.estimatedValue) ? row.estimatedValue : 0,
    wasSent: row.status === 'shared',
    clientName: row.clientName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
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

// BACKEND-122: for future dates (upcoming inspections) — getRelativeTimeLabel
// only handles the past ("X days ago"), which reads wrong for a scheduled
// future appointment.
function getUpcomingTimeLabel(isoDate: string): string {
  const timestamp = new Date(isoDate).getTime()
  if (!Number.isFinite(timestamp)) return ''

  const deltaMs = timestamp - Date.now()
  const days = Math.floor(deltaMs / (24 * 60 * 60 * 1000))
  if (days <= 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 7) return `In ${days} days`
  const weeks = Math.floor(days / 7)
  return `In ${weeks} week${weeks === 1 ? '' : 's'}`
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
  // BACKEND-120 (valuer-only, real caseStatus counts — 0 for every other role)
  completedThisMonth: number
  completedThisWeek: number
  // BACKEND-121 (investor-only, reused as-is by BACKEND-122/buyer — 0 for agent/valuer)
  savedPropertiesCount: number
  savedPropertiesThisWeek: number
  reportsThisMonth: number
  // BACKEND-122 (buyer-only — 0/empty for every other role)
  inspectionsBookedTotal: number
  upcomingInspections: RecentReport[]
}

// BACKEND-119: only 'agent' uses the real role-scoped endpoint so far —
// valuer/investor/buyer still read the unscoped /api/reports (same
// cross-role leakage as before) until each gets its own dashboard fix.
async function loadNormalizedReports(role: DashboardRole): Promise<NormalizedReport[]> {
  if (role === 'agent') {
    const rows = await fetchJson<RoleReportItem[]>('/api/agent/reports')
    return rows.map(normalizeRoleReport)
  }

  const reportsRes = await fetchJson<ApiSuccess<StoredReportRow[]>>('/api/reports')
  return (reportsRes.data ?? []).map(normalizeLegacyReport)
}

// BACKEND-121: minimal local shapes for the two real investor-only sources
// this dashboard needs — kept local rather than importing services/investor.ts,
// matching this file's existing pattern of self-contained per-role branches.
type InvestorSavedPropertyRow = {
  id: string
  createdAt: string
}

type MarketComparisonSuburbRow = {
  suburb: string
  growth12m: number
  rentalYield: number
  vacancyRate: number
  clearanceRate: number
}

// The one suburb (of the currently 2 with complete real MarketIntelligence
// data — see BACKEND-117) used as investor's "Market Signals" default. Not
// personalized to the investor's own activity — there's no "last viewed
// suburb" tracked anywhere yet.
const MARKET_SIGNALS_DEFAULT_SUBURB = 'Orange'

async function loadInvestorMarketSignals(): Promise<AgentPipeline> {
  const suburbs = await fetchJson<MarketComparisonSuburbRow[]>('/api/investor/market-comparison')
  const match = suburbs.find((s) => s.suburb === MARKET_SIGNALS_DEFAULT_SUBURB)
  if (!match) {
    // Honest empty state if even the default suburb hasn't scraped complete
    // data yet (e.g. right after a DB reset) — never fabricate a number.
    return { prospecting: 0, appraisalSent: 0, listing: 0, sold: 0 }
  }
  const round1 = (n: number) => Math.round(n * 10) / 10
  return {
    prospecting: round1(match.growth12m),
    appraisalSent: round1(match.rentalYield),
    listing: round1(match.vacancyRate),
    sold: round1(match.clearanceRate),
  }
}

// BACKEND-121: real investor-only metrics, using the same role-scoped
// report endpoint pattern as agent (BACKEND-119) plus the two other real,
// already-built, previously-unused investor endpoints (saved properties,
// market comparison). Replaces stat values that were previously scrambled
// onto the wrong labels entirely (see the ticket) — not just contaminated
// by cross-role leakage like agent/valuer were.
async function loadInvestorDashboardMetrics(): Promise<DashboardMetrics> {
  const [reportRows, savedProperties, pipeline] = await Promise.all([
    fetchJson<RoleReportItem[]>('/api/investor/reports'),
    fetchJson<InvestorSavedPropertyRow[]>('/api/investor/properties/saved'),
    loadInvestorMarketSignals(),
  ])

  const reports = reportRows.map(normalizeRoleReport)

  return {
    generatedReports: reports.length,
    generatedThisWeek: countCreatedThisWeek(reports),
    activeClients: 0, // investor has no real "clients" concept — Client is an agent-CRM-only model
    newClientsThisWeek: 0,
    avgAppraisal: reports.length > 0 ? reports.reduce((sum, item) => sum + item.estimatedValue, 0) / reports.length : 0,
    pendingReports: reports.filter((item) => !item.wasSent).length,
    sentReportsCount: reports.filter((item) => item.wasSent).length,
    sentThisWeek: 0,
    pipeline,
    completedThisMonth: 0,
    completedThisWeek: 0,
    savedPropertiesCount: savedProperties.length,
    savedPropertiesThisWeek: countCreatedThisWeek(savedProperties),
    reportsThisMonth: reports.filter((item) => isThisCalendarMonth(item.createdAt)).length,
    inspectionsBookedTotal: 0,
    upcomingInspections: [],
    reports: reports
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((report) => ({
        id: report.id,
        title: report.addressLine,
        detail: `${formatCurrency(report.estimatedValue)} • ${report.wasSent ? 'Shared' : 'Generated'}`,
        timeAgo: getRelativeTimeLabel(report.updatedAt),
        clientName: report.clientName ?? '',
      })),
  }
}

// BACKEND-120: real caseStatus-based metrics for valuer, using the same
// role-scoped /api/valuer/cases endpoint the Valuation Cases page already
// calls. Kept as its own branch rather than forced through the generic
// path below — valuer's real "completed" concept (caseStatus) and value
// distribution have no equivalent in the agent/legacy shape.
async function loadValuerDashboardMetrics(): Promise<DashboardMetrics> {
  const [cases, clientsRes] = await Promise.all([
    fetchJson<CaseItem[]>('/api/valuer/cases'),
    fetchJson<ApiSuccess<StoredClientRow[]>>('/api/clients'),
  ])
  const clients = clientsRes.data ?? []

  // "Completed" ever (any month) — the real definition of "still in
  // progress" for the In Progress metric below. A case approved last month
  // is done, not in progress, even though it won't count toward THIS
  // month's completed total.
  const completedEverCases = cases.filter((item) => COMPLETED_CASE_STATUSES.has(item.status))
  const completedThisMonthCases = completedEverCases.filter((item) => isThisCalendarMonth(item.updatedAt))
  const completedThisWeekCases = completedThisMonthCases.filter((item) => isCreatedThisWeek(item.updatedAt))

  return {
    generatedReports: cases.length,
    generatedThisWeek: countCreatedThisWeek(cases),
    activeClients: clients.length,
    newClientsThisWeek: countCreatedThisWeek(clients),
    avgAppraisal: cases.length > 0 ? cases.reduce((sum, item) => sum + item.estimatedValue, 0) / cases.length : 0,
    pendingReports: cases.length - completedEverCases.length,
    sentReportsCount: completedThisMonthCases.length,
    sentThisWeek: completedThisWeekCases.length,
    pipeline: bucketCasesByValue(cases),
    completedThisMonth: completedThisMonthCases.length,
    completedThisWeek: completedThisWeekCases.length,
    savedPropertiesCount: 0,
    savedPropertiesThisWeek: 0,
    reportsThisMonth: 0,
    inspectionsBookedTotal: 0,
    upcomingInspections: [],
    reports: cases
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((item) => ({
        id: item.id,
        title: item.address,
        detail: `${formatCurrency(item.estimatedValue)} • ${getCaseStatusLabel(item.status)}`,
        timeAgo: getRelativeTimeLabel(item.updatedAt),
        clientName: item.clientName ?? '',
      })),
  }
}

// BACKEND-122: minimal local shapes for buyer's two real, previously-unused
// sources (saved properties, inspections) — kept local, same reasoning as
// the investor types above.
type BuyerSavedPropertyRow = {
  id: string
  createdAt: string
}

type BuyerInspectionRow = {
  id: string
  address: string
  suburb: string
  inspectionDate: string
}

async function loadBuyerDashboardMetrics(): Promise<DashboardMetrics> {
  const [reportRows, savedProperties, inspections] = await Promise.all([
    fetchJson<RoleReportItem[]>('/api/buyer/reports'),
    fetchJson<BuyerSavedPropertyRow[]>('/api/buyer/properties/saved'),
    fetchJson<BuyerInspectionRow[]>('/api/buyer/inspections'),
  ])

  const reports = reportRows.map(normalizeRoleReport)
  const now = Date.now()
  const upcomingInspections = inspections
    .filter((item) => new Date(item.inspectionDate).getTime() >= now)
    .sort((a, b) => new Date(a.inspectionDate).getTime() - new Date(b.inspectionDate).getTime())

  return {
    generatedReports: reports.length,
    generatedThisWeek: countCreatedThisWeek(reports),
    activeClients: 0, // buyer has no real "clients" concept — Client is an agent-CRM-only model
    newClientsThisWeek: 0,
    avgAppraisal: reports.length > 0 ? reports.reduce((sum, item) => sum + item.estimatedValue, 0) / reports.length : 0,
    pendingReports: reports.filter((item) => !item.wasSent).length,
    sentReportsCount: reports.filter((item) => item.wasSent).length,
    sentThisWeek: 0,
    pipeline: { prospecting: 0, appraisalSent: 0, listing: 0, sold: 0 }, // unused for buyer — see loadBuyerMarketSnapshot
    completedThisMonth: 0,
    completedThisWeek: 0,
    savedPropertiesCount: savedProperties.length,
    savedPropertiesThisWeek: countCreatedThisWeek(savedProperties),
    reportsThisMonth: 0,
    inspectionsBookedTotal: inspections.length,
    upcomingInspections: upcomingInspections.map((item) => ({
      id: item.id,
      title: item.address,
      detail: item.suburb,
      timeAgo: getUpcomingTimeLabel(item.inspectionDate),
      clientName: '',
    })),
    reports: reports
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((report) => ({
        id: report.id,
        title: report.addressLine,
        detail: `${formatCurrency(report.estimatedValue)} • ${report.wasSent ? 'Shared' : 'Generated'}`,
        timeAgo: getRelativeTimeLabel(report.updatedAt),
        clientName: report.clientName ?? '',
      })),
  }
}

// BACKEND-122: real suburb data for buyer's "Market Snapshot" panel (was
// "Melbourne Market" — fully hardcoded, never touched any API at all; see
// the ticket). Reuses the real Suburb Explorer endpoint, whose response
// shape already matches exactly the 3 fields this panel needs.
type BuyerMarketSnapshotStats = {
  medianPrice: string
  medianPriceTrend: string
  daysOnMarket: number | null
  daysOnMarketTrend: string
  rentalYield: string
  rentalYieldTrend: string
}

async function loadBuyerMarketSnapshot(): Promise<{
  values: Partial<Record<'prospecting' | 'appraisalSent' | 'listing', string>>
  trends: Partial<Record<'prospecting' | 'appraisalSent' | 'listing', string>>
}> {
  const params = new URLSearchParams({ suburb: `${MARKET_SIGNALS_DEFAULT_SUBURB} NSW` })
  const data = await fetchJson<{ stats: BuyerMarketSnapshotStats } | null>(
    `/api/buyer/suburb-explorer?${params.toString()}`,
  )
  if (!data) {
    return { values: {}, trends: {} }
  }

  return {
    values: {
      prospecting: data.stats.medianPrice,
      appraisalSent: data.stats.daysOnMarket === null ? 'N/A' : `${data.stats.daysOnMarket} days`,
      listing: data.stats.rentalYield,
    },
    trends: {
      prospecting: data.stats.medianPriceTrend,
      appraisalSent: data.stats.daysOnMarketTrend,
      listing: data.stats.rentalYieldTrend,
    },
  }
}

async function loadDashboardMetrics(role: DashboardRole): Promise<DashboardMetrics> {
  if (role === 'valuer') {
    return loadValuerDashboardMetrics()
  }

  if (role === 'investor') {
    return loadInvestorDashboardMetrics()
  }

  if (role === 'buyer') {
    return loadBuyerDashboardMetrics()
  }

  const [reports, clientsRes] = await Promise.all([
    loadNormalizedReports(role),
    fetchJson<ApiSuccess<StoredClientRow[]>>('/api/clients'),
  ])

  const clients = clientsRes.data ?? []

  const generatedReports = reports.length
  const generatedThisWeek = countCreatedThisWeek(reports)
  const activeClients = clients.length
  const newClientsThisWeek = countCreatedThisWeek(clients)
  const avgAppraisal =
    reports.length > 0
      ? reports.reduce((sum, item) => sum + item.estimatedValue, 0) / reports.length
      : 0
  const pendingReports = reports.filter((item) => !item.wasSent).length
  const sentReports = reports.filter((item) => item.wasSent)

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
    completedThisMonth: 0,
    completedThisWeek: 0,
    savedPropertiesCount: 0,
    savedPropertiesThisWeek: 0,
    reportsThisMonth: 0,
    inspectionsBookedTotal: 0,
    upcomingInspections: [],
    reports: reports
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((report) => {
        const status = report.wasSent ? 'Completed & Sent' : report.clientName ? 'In Review' : 'Draft'

        return {
          id: report.id,
          title: report.addressLine,
          detail: `${formatCurrency(report.estimatedValue)} • ${status}`,
          timeAgo: getRelativeTimeLabel(report.updatedAt),
          clientName: report.clientName ?? '',
        }
      }),
  }
}

function statValuesForRole(role: DashboardRole, metrics: DashboardMetrics): string[] {
  if (role === 'valuer') {
    // BACKEND-120: real caseStatus-based count (approved/exported this
    // calendar month), not pdfStoragePath (a field no backend path ever
    // writes, so it was structurally always 0 regardless of real progress).
    return [String(metrics.completedThisMonth || 0), formatCompactCurrency(metrics.avgAppraisal || 0)]
  }

  if (role === 'investor') {
    // BACKEND-121: previously scrambled onto the wrong labels entirely —
    // 'Saved Properties' showed the report count, 'Generated Reports' and
    // 'Avg Investment Report Value' showed two hardcoded percentages.
    return [
      String(metrics.savedPropertiesCount || 0),
      String(metrics.generatedReports || 0),
      formatCompactCurrency(metrics.avgAppraisal || 0),
    ]
  }

  if (role === 'buyer') {
    // BACKEND-122: 'Saved Properties' read the agent-CRM client count;
    // 'Upcoming Inspections' read a client-status count — neither ever
    // touched the real, already-built saved-properties/inspections endpoints.
    return [
      String(metrics.savedPropertiesCount || 0),
      String(metrics.upcomingInspections.length || 0),
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
    // BACKEND-120: trend for "Completed This Month" must be a completions
    // metric, not "any new case created this week" (the previous bug — a
    // self-contradicting "Completed: 0, +N this week" display). No honest
    // week-over-week comparison exists yet for Avg Valuation Value, so
    // that trend is left blank rather than fabricated.
    return [`+${metrics.completedThisWeek || 0} this week`, '']
  }

  if (role === 'investor') {
    // BACKEND-121: two hardcoded percentages replaced with real trends; Avg
    // Investment Report Value's trend dropped (no honest week-over-week
    // average comparison exists yet) rather than fabricated.
    return [`+${metrics.savedPropertiesThisWeek || 0} this week`, `+${metrics.generatedThisWeek || 0} this week`, '']
  }

  if (role === 'buyer') {
    // BACKEND-122: real trend for Saved Properties; Upcoming Inspections has
    // no honest week-over-week comparison yet (dropped rather than fabricated).
    return [`+${metrics.savedPropertiesThisWeek || 0} this week`, '', `+${metrics.generatedThisWeek || 0} this week`]
  }

  // BACKEND-119: Avg Appraisal's trend was a hardcoded '+0 vs. last month'
  // placeholder — no real month-over-month comparison exists yet, so this
  // is left blank (StatCard hides an empty trend) rather than fabricated.
  return [`+${metrics.generatedThisWeek || 0} this week`, `+${metrics.newClientsThisWeek || 0} new`, '']
}

async function getRoleDashboardPayload(role: DashboardRole): Promise<DashboardMockPayload> {
  const [metrics, buyerMarketSnapshot] = await Promise.all([
    loadDashboardMetrics(role),
    role === 'buyer' ? loadBuyerMarketSnapshot() : Promise.resolve(null),
  ])
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
    inspections: role === 'buyer' ? metrics.upcomingInspections : undefined,
    insights: [],
    thisWeek:
      role === 'buyer'
        ? {
            // BACKEND-122: "Watchlist Properties" is the real saved-properties
            // count (was the agent-CRM client count); "Reports This Month" is
            // the real buyer-scoped report count; "Inspections Booked" is the
            // real total inspection count (was a client-status count).
            reportsGenerated: { current: metrics.savedPropertiesCount, total: metrics.savedPropertiesCount },
            appraisalsSent: { current: metrics.generatedReports, total: metrics.generatedReports },
            tertiary: { current: metrics.inspectionsBookedTotal, total: metrics.inspectionsBookedTotal },
          }
        : role === 'valuer'
          ? {
              // BACKEND-120: "Completed" / "In Progress" must reflect real
              // caseStatus, not "any case created this week" / "any case
              // with a pdfStoragePath" (always 0 — see the ticket).
              reportsGenerated: { current: metrics.completedThisMonth, total: metrics.generatedReports },
              appraisalsSent: { current: metrics.pendingReports, total: metrics.generatedReports },
            }
          : role === 'investor'
            ? {
                // BACKEND-121: "Watchlist Properties" is the real saved-properties
                // count, not a weekly report count; "Reports This Month" is a real
                // calendar-month count, not the permanently-broken pdfStoragePath
                // "sent" concept (see BACKEND-120's identical issue).
                reportsGenerated: { current: metrics.savedPropertiesCount, total: metrics.savedPropertiesCount },
                appraisalsSent: { current: metrics.reportsThisMonth, total: metrics.reportsThisMonth },
              }
            : {
                reportsGenerated: { current: metrics.generatedThisWeek, total: metrics.generatedReports },
                appraisalsSent: { current: metrics.sentThisWeek, total: metrics.sentReportsCount },
              },
    pipeline: metrics.pipeline,
    thisWeekCopy: copy.thisWeek,
    // BACKEND-122: buyer's "Market Snapshot" (was "Melbourne Market") gets
    // real values/trends merged in here — the panel component reads
    // copy.values/copy.trends in preference to metrics.pipeline's numbers
    // for the 'metrics' layout, so this is where real data has to enter for
    // this specific role/panel combination.
    pipelineCopy:
      role === 'buyer' && buyerMarketSnapshot
        ? { ...copy.pipeline, values: buyerMarketSnapshot.values, trends: buyerMarketSnapshot.trends }
        : copy.pipeline,
    recentReportsTitle: copy.recentReportsTitle,
    quickActionsTitle: copy.quickActionsTitle,
    quickActions: copy.quickActions,
  }
}

export function getDashboardMockData(role: DashboardRole): Promise<DashboardMockPayload> {
  return getRoleDashboardPayload(role)
}
