import { getActionIcon, getStatIcon } from './dashboard-icons'
import { AppraisalPipelinePanel } from './appraisal-pipeline-panel'
import { QuickActionsPanel } from './quick-actions-panel'
import { RecentReportsPanel } from './recent-reports-panel'
import { ThisWeekPanel } from './this-week-panel'
import { StatCard } from '../../../components/ui/stat-card/stat-card'
import { useAsyncData } from '../../../hooks/use-async-data'
import type { DashboardRole } from '../utils/dashboard-role'
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
    return <div className="p-6 text-sm text-relaive-gray sm:p-8">Loading dashboard…</div>
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
            value={stat.value}
            trend={stat.trend}
            tone={stat.tone}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <RecentReportsPanel
          reports={data.reports}
          variant="agent"
          viewAllTo={`/dashboard/${role}/report`}
          generateReportBase={`/dashboard/${role}/generate-report`}
        />
        <div className="flex flex-col gap-4">
          <ThisWeekPanel data={data.thisWeek ?? EMPTY_THIS_WEEK} />
          <AppraisalPipelinePanel data={data.pipeline ?? EMPTY_PIPELINE} />
        </div>
      </div>

      <QuickActionsPanel actions={actions} />
    </div>
  )
}
