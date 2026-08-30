import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getDashboardMockData } from '../../../../services/dashboard'
import { getValuationCasesMockData, getValuerCaseListMockData } from '../../../../services/valuer'
import type { CaseItem } from '../../../../services/dashboard'
import { Card } from '../../../../components/ui/card/card'
import { StatCard } from '../../../../components/ui/stat-card/stat-card'
import { RecentReportsPanel } from '../../../../features/dashboard/components/recent-reports-panel'
import { getStatIcon, getActionIcon } from '../../../../features/dashboard/components/dashboard-icons'
import { buildReportViewPath } from '../../../services/report-navigation'
import type { DashboardRole } from '../../../../features/dashboard/utils/dashboard-role'

// v2 reskin of the Valuer role home page (figma: ValuerDashboard.tsx). Same real-data
// approach as Agent/Investor's pilot pages: reuses getDashboardMockData('valuer') and the
// existing valuation-cases summary endpoint. See figma-ui-migration-plan.md §10.
//
// Phase 2: Recent Reports panel wired via onOpenReport/onViewAll. TODO(backend): this
// dashboard's `reports` come from GET /api/dashboard/valuer, a hardcoded mock array whose
// ids ('1', '2', ...) are not real Report ids — same caveat as valuation-cases.tsx. Wired
// through anyway; see backend/V2_BACKEND_TODO.md (Valuer section).
//
// Phase 4: the KPI row + Monthly Progress widget below no longer read `dashboard.stats`
// (GET /api/dashboard/valuer — a hardcoded, non-real 4-metric backend mock: "Valuations in
// Review / Approved Reports / Low Confidence Cases / Pending Reports", none of it clickable).
// They're now computed client-side from the real /api/valuer/cases list instead — see
// backend/V2_BACKEND_TODO.md (Valuer section) for what's still missing (a valuation
// amount/value field), which is why "Avg Valuation Value" from the figma prototype isn't
// reproduced here; "Avg Confidence Score" is used as the real substitute.

const COMPLETED_STATUSES: CaseItem['status'][] = ['approved', 'exported']

function isThisMonth(isoDate: string): boolean {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return false
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

function quickActionPath(role: string, title: string): string {
  if (title.toLowerCase().includes('evidence')) return `/dashboard/${role}/evidence-centre`
  if (title.toLowerCase().includes('case')) return `/dashboard/${role}/valuation-cases`
  return `/dashboard/${role}/generate-report`
}

// Quick Actions (figma: ValuerDashboard.tsx ~132-150 has 4: New Valuation, Valuation Cases,
// Saved Evidence, Evidence Centre). Defined locally rather than from dashboard.quickActions
// because the live backend mock (GET /api/dashboard/valuer) only has 2 ("Generate Appraisal",
// "Evidence Center") — see frontend/src/features/dashboard/mock/dashboard-mock-data.ts
// VALUER_DATA.quickActions, updated to match for MSW/demo-mode consistency, though that file
// isn't the live data source when VITE_ENABLE_MOCKS=false (the default; see MOCK_API_README.md).
// "Saved Evidence" is omitted: this repo has no dedicated saved-evidence page for Valuer
// (only evidence-centre.tsx and valuation-cases.tsx exist under v2/pages/dashboard/property-valuer/),
// so pointing it anywhere would either dead-end or duplicate Evidence Centre.
const QUICK_ACTIONS = [
  { id: 'new-valuation', title: 'New Valuation' },
  { id: 'valuation-cases', title: 'Valuation Cases' },
  { id: 'evidence-centre', title: 'Evidence Centre' },
]

export function ValuerHomeV2() {
  const { role: roleParam } = useParams<{ role: string }>()
  const role = roleParam ?? 'valuer'
  const navigate = useNavigate()

  const { data: dashboard } = useAsyncData(() => getDashboardMockData('valuer'), [])
  const { data: casesSummary } = useAsyncData(getValuationCasesMockData, [])
  const { data: caseList } = useAsyncData(getValuerCaseListMockData, [])

  const kpis = useMemo(() => {
    const cases = caseList ?? []
    const completedThisMonth = cases.filter(
      (item) => COMPLETED_STATUSES.includes(item.status) && isThisMonth(item.updatedAt),
    ).length

    const scored = cases.filter((item) => item.confidence !== null)
    const avgConfidence =
      scored.length > 0
        ? Math.round(scored.reduce((sum, item) => sum + (item.confidence ?? 0), 0) / scored.length)
        : null

    return {
      completedThisMonth,
      avgConfidence,
    }
  }, [caseList])

  const monthlyProgress = useMemo(() => {
    const cases = (caseList ?? []).filter((item) => isThisMonth(item.updatedAt))
    const completed = cases.filter((item) => COMPLETED_STATUSES.includes(item.status)).length
    const inProgress = cases.length - completed
    return { completed, inProgress, total: Math.max(1, cases.length) }
  }, [caseList])

  if (!dashboard) {
    return <div className="p-6 text-sm text-relaive-gray sm:p-8">Loading dashboard…</div>
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          icon={getStatIcon('checkCircle')}
          label="Completed This Month"
          value={String(kpis.completedThisMonth)}
          trend={caseList ? 'finalised cases' : undefined}
          tone="teal"
          onClick={() => navigate(`/dashboard/${role}/valuation-cases`)}
        />
        <StatCard
          icon={getStatIcon('trend')}
          label="Avg Confidence Score"
          value={kpis.avgConfidence !== null ? `${kpis.avgConfidence}%` : '—'}
          trend={caseList ? 'across active cases' : undefined}
          tone="blue"
          onClick={() => navigate(`/dashboard/${role}/valuation-cases`)}
        />
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-relaive-gray">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => navigate(quickActionPath(role, action.title))}
              className="flex flex-col items-center gap-2 rounded-2xl border border-black/5 bg-white p-4 text-center transition-all hover:border-relaive-primary/20 hover:shadow-sm"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-relaive-primary/10 text-relaive-primary">
                {getActionIcon(action.id === 'evidence-centre' ? 'document' : action.id === 'valuation-cases' ? 'users' : 'sparkle')}
              </span>
              <span className="text-xs font-medium text-relaive-navy">{action.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <RecentReportsPanel
          reports={dashboard.reports}
          className="lg:col-span-2"
          onOpenReport={(id) => navigate(buildReportViewPath(role as DashboardRole, id))}
          onViewAll={() => navigate(`/dashboard/${role}/report`)}
        />

        <div className="flex flex-col gap-5">
        <Card>
          <h3 className="text-lg font-semibold text-relaive-navy sm:text-xl">Monthly Progress</h3>
          {caseList ? (
            <div className="mt-4 flex flex-col gap-3">
              {[
                { label: 'Completed', value: monthlyProgress.completed },
                { label: 'In Progress', value: monthlyProgress.inProgress },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-relaive-gray">{item.label}</span>
                    <span className="text-xs font-semibold text-relaive-navy">{item.value}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-black/5">
                    <div
                      className="h-full rounded-full bg-relaive-primary transition-all"
                      style={{ width: `${Math.round((item.value / monthlyProgress.total) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-relaive-gray">Loading…</p>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-relaive-navy sm:text-xl">Case Pipeline</h3>
          {casesSummary ? (
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-relaive-gray">Total Cases</span>
                <span className="text-xs font-semibold text-relaive-navy">{casesSummary.totalCases}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-relaive-gray">Returned for Revision</span>
                <span className="text-xs font-semibold text-relaive-navy">{casesSummary.returnedForRevision}</span>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-relaive-gray">Loading…</p>
          )}
          <button
            type="button"
            onClick={() => navigate(`/dashboard/${role}/valuation-cases`)}
            className="mt-4 text-xs font-medium text-relaive-primary hover:underline"
          >
            View all cases →
          </button>
        </Card>
        </div>
      </div>
    </div>
  )
}
