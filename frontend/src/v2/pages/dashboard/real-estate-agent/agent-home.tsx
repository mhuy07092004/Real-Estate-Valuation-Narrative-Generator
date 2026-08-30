import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getDashboardMockData } from '../../../../services/dashboard'
import {
  getClientListMockData,
  getAgentReportListMockData,
  type ClientItem,
  type ClientStatus,
} from '../../../../services/agent'
import { Card } from '../../../../components/ui/card/card'
import { StatCard } from '../../../../components/ui/stat-card/stat-card'
import { RecentReportsPanel } from '../../../../features/dashboard/components/recent-reports-panel'
import { getStatIcon, getActionIcon } from '../../../../features/dashboard/components/dashboard-icons'
import { buildReportViewPath } from '../../../services/report-navigation'
import type { DashboardRole } from '../../../../features/dashboard/utils/dashboard-role'

// Fixed weekly quotas for the "This Week" progress widget (figma: AgentDashboard.tsx ~153-176).
// These denominators are UI-configured targets, not sourced data — only the numerators
// (reportsGenerated / appraisalsSent) are computed from real /api/reports rows below.
const WEEKLY_REPORT_GOAL = 20
const WEEKLY_APPRAISAL_GOAL = 8

// v2 reskin of the Agent role home page (figma: AgentDashboard.tsx).
// Data is 100% real — same services the v1 dashboard already uses — no local mock state.
// See figma-ui-migration-plan.md §9.4 step 1 (pilot page).
//
// Phase 2: Recent Reports panel is now wired via RecentReportsPanel's onOpenReport/
// onViewAll props. Agent's dashboard.reports ids come from the real /api/reports rows
// (see services/dashboard.ts getAgentDashboardPayload), so these ids DO resolve via
// getPersistedReport — unlike the other three roles' mock dashboard reports below.

const PIPELINE_STAGES: { status: ClientStatus; label: string }[] = [
  { status: 'prospecting', label: 'Prospecting' },
  { status: 'active', label: 'Active' },
  { status: 'appraisal_sent', label: 'Appraisal Sent' },
  { status: 'listing', label: 'Listing' },
  { status: 'sold', label: 'Sold' },
]

function buildPipeline(clients: ClientItem[]) {
  const counts = new Map<ClientStatus, number>()
  for (const client of clients) {
    counts.set(client.status, (counts.get(client.status) ?? 0) + 1)
  }
  const max = Math.max(1, ...PIPELINE_STAGES.map((stage) => counts.get(stage.status) ?? 0))

  return PIPELINE_STAGES.map((stage) => {
    const count = counts.get(stage.status) ?? 0
    return { ...stage, count, percent: Math.round((count / max) * 100) }
  })
}

function quickActionPath(role: string, title: string): string {
  return title.toLowerCase().includes('report')
    ? `/dashboard/${role}/report`
    : `/dashboard/${role}/generate-report`
}

// KPI card destination (figma: AgentDashboard.tsx ~60-67) — Active Clients drills into the
// client list, every other stat drills into the reports list.
function statCardPath(role: string, label: string): string {
  return label === 'Active Clients' ? `/dashboard/${role}/clients` : `/dashboard/${role}/report`
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function isWithinLastSevenDays(isoDate: string): boolean {
  const timestamp = new Date(isoDate).getTime()
  return Number.isFinite(timestamp) && Date.now() - timestamp <= SEVEN_DAYS_MS
}

export function AgentHomeV2() {
  const { role: roleParam } = useParams<{ role: string }>()
  const role = roleParam ?? 'agent'
  const navigate = useNavigate()

  const { data: dashboard } = useAsyncData(() => getDashboardMockData('agent'), [])
  const { data: clients } = useAsyncData(getClientListMockData, [])
  const { data: reports } = useAsyncData(getAgentReportListMockData, [])

  const pipeline = useMemo(() => buildPipeline(clients ?? []), [clients])

  // "This Week" widget (figma: AgentDashboard.tsx ~153-176). CaseItem only carries `updatedAt`
  // (no separate createdAt), so "generated this week" uses updatedAt as a real-data proxy for
  // recency — an approximation, not a fabricated number. "Sent" = exported reports in that window.
  const weeklyProgress = useMemo(() => {
    const recent = (reports ?? []).filter((report) => isWithinLastSevenDays(report.updatedAt))
    return {
      reportsGenerated: recent.length,
      appraisalsSent: recent.filter((report) => report.status === 'exported').length,
    }
  }, [reports])

  if (!dashboard) {
    return <div className="p-6 text-sm text-relaive-gray sm:p-8">Loading dashboard…</div>
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboard.stats.map((stat) => (
          <StatCard
            key={stat.label}
            icon={getStatIcon(stat.iconKey)}
            label={stat.label}
            value={stat.value}
            trend={stat.trend}
            tone={stat.tone}
            onClick={() => navigate(statCardPath(role, stat.label))}
          />
        ))}
      </div>

      {dashboard.quickActions.length > 0 ? (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-relaive-gray">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {dashboard.quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => navigate(quickActionPath(role, action.title))}
                className="flex flex-col items-center gap-2 rounded-2xl border border-black/5 bg-white p-4 text-center transition-all hover:border-relaive-primary/20 hover:shadow-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-relaive-primary/10 text-relaive-primary">
                  {getActionIcon(action.iconKey)}
                </span>
                <span className="text-xs font-medium text-relaive-navy">{action.title}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <RecentReportsPanel
          reports={dashboard.reports}
          className="lg:col-span-2"
          onOpenReport={(id) => navigate(buildReportViewPath(role as DashboardRole, id))}
          onViewAll={() => navigate(`/dashboard/${role}/report`)}
        />

        <div className="flex flex-col gap-5">
        <Card>
          <h3 className="text-lg font-semibold text-relaive-navy sm:text-xl">This Week</h3>
          <div className="mt-4 flex flex-col gap-3">
            {[
              { label: 'Reports Generated', value: weeklyProgress.reportsGenerated, max: WEEKLY_REPORT_GOAL },
              { label: 'Appraisals Sent', value: weeklyProgress.appraisalsSent, max: WEEKLY_APPRAISAL_GOAL },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-relaive-gray">{item.label}</span>
                  <span className="text-xs font-semibold text-relaive-navy">
                    {item.value}/{item.max}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-black/5">
                  <div
                    className="h-full rounded-full bg-relaive-primary transition-all"
                    style={{ width: `${Math.min(100, Math.round((item.value / item.max) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-relaive-navy sm:text-xl">Client Pipeline</h3>
          <div className="mt-4 flex flex-col gap-3">
            {pipeline.map((stage) => (
              <div key={stage.status}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-relaive-gray">{stage.label}</span>
                  <span className="text-xs font-semibold text-relaive-navy">{stage.count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-black/5">
                  <div
                    className="h-full rounded-full bg-relaive-primary transition-all"
                    style={{ width: `${stage.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate(`/dashboard/${role}/clients`)}
            className="mt-4 text-xs font-medium text-relaive-primary hover:underline"
          >
            View all clients →
          </button>
        </Card>
        </div>
      </div>
    </div>
  )
}
