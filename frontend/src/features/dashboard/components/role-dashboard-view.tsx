import { AiInsightsPanel } from './ai-insights-panel'
import { getActionIcon, getStatIcon } from './dashboard-icons'
import { QuickActionsPanel } from './quick-actions-panel'
import { RecentReportsPanel } from './recent-reports-panel'
import { StatCard } from '../../../components/ui/stat-card/stat-card'
import type { DashboardRole } from '../utils/dashboard-role'
import { getDashboardMockData } from '../../../services/mock-dashboardservice'

type RoleDashboardViewProps = {
  role: DashboardRole
}

export function RoleDashboardView({ role }: RoleDashboardViewProps) {
  const data = getDashboardMockData(role)

  return (
    <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:gap-6">
        <RecentReportsPanel reports={data.reports} />
        <AiInsightsPanel insights={data.insights} />
      </div>

      <QuickActionsPanel
        actions={data.quickActions.map(({ id, title, subtitle, tone, iconKey }) => ({
          id,
          title,
          subtitle,
          tone,
          icon: getActionIcon(iconKey),
        }))}
      />
    </div>
  )
}
