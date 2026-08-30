import { useNavigate, useParams } from 'react-router-dom'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getDashboardMockData } from '../../../../services/dashboard'
import { getInvestorReportSummary } from '../../../../services/investor'
import { Card } from '../../../../components/ui/card/card'
import { StatCard } from '../../../../components/ui/stat-card/stat-card'
import { RecentReportsPanel } from '../../../../features/dashboard/components/recent-reports-panel'
import { getStatIcon, getActionIcon } from '../../../../features/dashboard/components/dashboard-icons'
import { buildReportViewPath } from '../../../services/report-navigation'
import type { DashboardRole } from '../../../../features/dashboard/utils/dashboard-role'

// Phase 2: Recent Reports panel wired via onOpenReport/onViewAll. TODO(backend): this
// dashboard's `reports` come from GET /api/dashboard/investor, a hardcoded mock array whose
// ids ('1', '2', ...) are not real Report ids — same caveat as investor-reports.tsx. Wired
// through anyway; see backend/V2_BACKEND_TODO.md (Investor section).
//
// v2 reskin of the Investor role home page (figma: InvestorDashboard.tsx). Reuses the same
// real backend data v1 already has for this role (getDashboardMockData('investor') and the
// investor reports summary endpoint) — same "keep current backend usage" approach as the
// Agent role's pilot page. Figma's "Market Signals" and "Portfolio Overview" side panels
// have no backend equivalent at all (hardcoded arrays in figma) — not ported; the Report
// Pipeline panel below uses the real report-status summary instead, same spirit as Agent's
// real Client Pipeline panel. See figma-ui-migration-plan.md §10.
//
// Phase 4: an extra "Investment Intelligence" quick-action tile is appended locally (not
// backend-driven — the mock endpoint only returns 2 quick actions) so the net-new
// investment-intelligence.tsx page has a real entry point. It has no sidebar nav item (that
// file is out of scope for this change), so this tile is currently the only way to reach it
// from within the app besides a direct URL.

function quickActionPath(role: string, title: string): string {
  if (title.toLowerCase().includes('roi')) return `/dashboard/${role}/roi-calculator`
  if (title.toLowerCase().includes('report')) return `/dashboard/${role}/report`
  return `/dashboard/${role}/generate-report`
}

export function InvestorHomeV2() {
  const { role: roleParam } = useParams<{ role: string }>()
  const role = roleParam ?? 'investor'
  const navigate = useNavigate()

  const { data: dashboard } = useAsyncData(() => getDashboardMockData('investor'), [])
  const { data: reportSummary } = useAsyncData(getInvestorReportSummary, [])

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
          />
        ))}
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-relaive-gray">Quick Actions</h3>
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
          <button
            type="button"
            onClick={() => navigate(`/dashboard/${role}/investment-intelligence`)}
            className="flex flex-col items-center gap-2 rounded-2xl border border-black/5 bg-white p-4 text-center transition-all hover:border-relaive-primary/20 hover:shadow-sm"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-relaive-primary/10 text-relaive-primary">
              {getActionIcon('document')}
            </span>
            <span className="text-xs font-medium text-relaive-navy">Investment Intelligence</span>
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <RecentReportsPanel
          reports={dashboard.reports}
          className="lg:col-span-2"
          onOpenReport={(id) => navigate(buildReportViewPath(role as DashboardRole, id))}
          onViewAll={() => navigate(`/dashboard/${role}/report`)}
        />

        <Card>
          <h3 className="text-lg font-semibold text-relaive-navy sm:text-xl">Report Pipeline</h3>
          {reportSummary ? (
            <div className="mt-4 flex flex-col gap-3">
              {[
                { label: 'Total Reports', value: reportSummary.totalReports },
                { label: 'Drafts', value: reportSummary.draftCount },
                { label: 'Shared', value: reportSummary.sharedCount },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-xs text-relaive-gray">{row.label}</span>
                  <span className="text-xs font-semibold text-relaive-navy">{row.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-relaive-gray">Loading…</p>
          )}
          <button
            type="button"
            onClick={() => navigate(`/dashboard/${role}/report`)}
            className="mt-4 text-xs font-medium text-relaive-primary hover:underline"
          >
            View all reports →
          </button>
        </Card>
      </div>
    </div>
  )
}
