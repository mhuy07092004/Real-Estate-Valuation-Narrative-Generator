import { useNavigate, useParams } from 'react-router-dom'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getDashboardMockData } from '../../../../services/dashboard'
import { listSavedProperties } from '../../../services/saved-properties'
import { getMarketMetrics } from '../../../services/common'
import { Card } from '../../../../components/ui/card/card'
import { StatCard } from '../../../../components/ui/stat-card/stat-card'
import { RecentReportsPanel } from '../../../../features/dashboard/components/recent-reports-panel'
import { getStatIcon, getActionIcon } from '../../../../features/dashboard/components/dashboard-icons'
import { buildReportViewPath } from '../../../services/report-navigation'
import { MarketIntelligenceView } from '../../../features/dashboard/components/market-intelligence/market-intelligence-view'
import type { DashboardRole } from '../../../../features/dashboard/utils/dashboard-role'

// Phase 2: Recent Reports panel wired via onOpenReport/onViewAll. TODO(backend): this
// dashboard's `reports` come from GET /api/dashboard/buyer, a hardcoded mock array whose
// ids ('1', '2', ...) are not real Report ids — same caveat as buyer-reports.tsx. Wired
// through anyway; see backend/V2_BACKEND_TODO.md (Buyer section).
//
// v2 reskin of the Buyer role home page (figma: BuyerDashboard.tsx). Reuses
// getDashboardMockData('buyer') like the other roles' pilot pages. The side panel shows
// the real saved-properties count via /api/saved-properties (real SavedPropertySearch
// model) rather than a mock "Portfolio"-style widget — see figma-ui-migration-plan.md §10.
//
// Phase 4 fixes:
// - KPI cards are now clickable (StatCard's onClick prop). GET /api/dashboard/buyer (read-only
//   mock endpoint) returns 'Shortlist'/'Budget Cap'/'Suburb Matches'/'Pending Checks', not
//   figma's Saved Properties/Inspections/Reports concept — the endpoint's shape can't be
//   changed here, so each real returned stat is mapped to the closest real destination
//   instead of inventing new KPI values (see `statPath` below).
// - `quickActionPath()` previously only special-cased titles containing "afford"/"report" —
//   any other title (the mock endpoint's actual "Search Property" quick action included)
//   silently fell through to /generate-report. Fixed to route every title the backend
//   actually returns (`Search Property`, `Affordability`, and defensively any future
//   "report"-titled action) to its real destination.
// - A locally-added "Comparable Sales" quick-action tile (not backend-driven — the mock
//   endpoint only returns 2 actions) fills out the 4-tile set figma expects, pointing at the
//   real (role-agnostic) Comparable Sales page — see routes/index.tsx, which mounts
//   ComparableSalesPageV2 under `/dashboard/:role/comparable-sales` for any role, not just
//   agent. "Inspections" is NOT added: there is no buyer-facing inspections route anywhere in
//   this app (confirmed via routes/index.tsx) and backend/V2_BACKEND_TODO.md already flags
//   Inspections as a full net-new feature — a tile pointing nowhere would be fabricated nav.
// - Right column now also shows a compact real market-intelligence snippet (median price/
//   growth/days-on-market/rental-yield for the user's last-viewed comparable-search address,
//   via the same real GET /api/appraisal/market-metrics the Agent/Investor market-intelligence
//   pages use) instead of nothing, when an address context is available.

function quickActionPath(role: string, title: string): string {
  const normalized = title.toLowerCase()
  if (normalized.includes('afford')) return `/dashboard/${role}/affortability-calculation`
  if (normalized.includes('search propert')) return `/dashboard/${role}/search-properties`
  if (normalized.includes('report')) return `/dashboard/${role}/report`
  return `/dashboard/${role}/generate-report`
}

function statPath(role: string, label: string): string | undefined {
  const normalized = label.toLowerCase()
  if (normalized.includes('shortlist')) return `/dashboard/${role}/saved`
  if (normalized.includes('pending check') || normalized.includes('afford')) return `/dashboard/${role}/affortability-calculation`
  if (normalized.includes('suburb')) return `/dashboard/${role}/search-properties`
  return undefined
}

export function BuyerHomeV2() {
  const { role: roleParam } = useParams<{ role: string }>()
  const role = roleParam ?? 'buyer'
  const navigate = useNavigate()

  const { data: dashboard } = useAsyncData(() => getDashboardMockData('buyer'), [])
  const { data: savedProperties } = useAsyncData(listSavedProperties, [])
  const { data: marketMetrics } = useAsyncData(getMarketMetrics, [])

  if (!dashboard) {
    return <div className="p-6 text-sm text-relaive-gray sm:p-8">Loading dashboard…</div>
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboard.stats.map((stat) => {
          const path = statPath(role, stat.label)
          return (
            <StatCard
              key={stat.label}
              icon={getStatIcon(stat.iconKey)}
              label={stat.label}
              value={stat.value}
              trend={stat.trend}
              tone={stat.tone}
              onClick={path ? () => navigate(path) : undefined}
            />
          )
        })}
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
            onClick={() => navigate(`/dashboard/${role}/comparable-sales`)}
            className="flex flex-col items-center gap-2 rounded-2xl border border-black/5 bg-white p-4 text-center transition-all hover:border-relaive-primary/20 hover:shadow-sm"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-relaive-primary/10 text-relaive-primary">
              {getActionIcon('document')}
            </span>
            <span className="text-xs font-medium text-relaive-navy">Comparable Sales</span>
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

        <div className="flex flex-col gap-5">
          <Card>
            <h3 className="text-lg font-semibold text-relaive-navy sm:text-xl">Saved Properties</h3>
            <p className="mt-2 text-3xl font-bold text-relaive-navy">{savedProperties ? savedProperties.length : '—'}</p>
            <p className="mt-1 text-xs text-relaive-gray">properties saved from Comparable Sales</p>
            <button
              type="button"
              onClick={() => navigate(`/dashboard/${role}/saved`)}
              className="mt-4 text-xs font-medium text-relaive-primary hover:underline"
            >
              View saved properties →
            </button>
          </Card>

          {marketMetrics && marketMetrics.metrics.length > 0 ? (
            <Card>
              <h3 className="text-lg font-semibold text-relaive-navy sm:text-xl">Market Snapshot</h3>
              <div className="mt-3">
                <MarketIntelligenceView metrics={marketMetrics.metrics} priceTrend={marketMetrics.priceTrend} variant="compact" />
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
