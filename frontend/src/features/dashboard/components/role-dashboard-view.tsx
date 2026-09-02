import { getActionIcon, getStatIcon } from './dashboard-icons'
import { AppraisalPipelinePanel } from './appraisal-pipeline-panel'
import { QuickActionsPanel } from './quick-actions-panel'
import { RecentReportsPanel } from './recent-reports-panel'
import { ThisWeekPanel } from './this-week-panel'
import { StatCard } from '../../../components/ui/stat-card/stat-card'
import { useAsyncData } from '../../../hooks/use-async-data'
import { DashboardViewSkeleton } from '../../../pages/dashboard/dashboard-view-skeleton'
import type { DashboardRole } from '../utils/dashboard-role'
import { DASHBOARD_COPY_BY_ROLE } from '../utils/dashboard-copy'
import { getDashboardMockData, type AgentPipeline, type AgentThisWeek } from '../../../services/dashboard'

const EMPTY_THIS_WEEK: AgentThisWeek = {
  reportsGenerated: { current: 0, total: 0 },
  appraisalsSent: { current: 0, total: 0 },
}

const EMPTY_PIPELINE: AgentPipeline = {
  prospecting: 0,
  appraisalSent: 0,
  listing: 0,
  sold: 0,
}

type RoleDashboardViewProps = {
  role: DashboardRole
}

export function RoleDashboardView({ role }: RoleDashboardViewProps) {
  const { data } = useAsyncData(() => getDashboardMockData(role), [role])

  if (!data) {
    return <DashboardViewSkeleton />
  }

  const actions = data.quickActions.map((action) => ({
    ...action,
    icon: getActionIcon(action.iconKey),
  }))

  const isTwoStatCards = data.stats.length === 2

  return (
    <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
      <div
        className={
          isTwoStatCards
            ? 'grid grid-cols-1 gap-4 sm:grid-cols-2'
            : 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'
        }
      >
        {data.stats.map((stat) => (
          <StatCard
            key={stat.label}
            icon={getStatIcon(stat.iconKey)}
            label={stat.label}
            hint={stat.hint}
            value={stat.value}
            trend={stat.trend}
            tone={stat.tone}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <div className="flex flex-col gap-4">
          <RecentReportsPanel
            reports={data.reports}
            title={data.recentReportsTitle}
            variant="agent"
            viewAllTo={
              role === 'valuer'
                ? `/dashboard/${role}/valuation-cases`
                : `/dashboard/${role}/report`
            }
            generateReportBase={`/dashboard/${role}/generate-report`}
            showGenerateNewLink={role === 'investor'}
          />
          {DASHBOARD_COPY_BY_ROLE[role].inspectionsTitle ? (
            <RecentReportsPanel
              reports={data.reports}
              title={DASHBOARD_COPY_BY_ROLE[role].inspectionsTitle}
              variant="inspection"
              viewAllTo={`/dashboard/${role}/saved`}
            />
          ) : null}
        </div>
        <div className="flex flex-col gap-4">
          <ThisWeekPanel data={data.thisWeek ?? EMPTY_THIS_WEEK} copy={data.thisWeekCopy} />
          <AppraisalPipelinePanel
            data={data.pipeline ?? EMPTY_PIPELINE}
            copy={data.pipelineCopy}
            layout={
              role === 'valuer'
                ? 'legend'
                : role === 'investor'
                  ? 'signals'
                  : role === 'buyer'
                    ? 'metrics'
                    : 'bars'
            }
          />
        </div>
      </div>

      <QuickActionsPanel actions={actions} title={data.quickActionsTitle} />
    </div>
  )
}
