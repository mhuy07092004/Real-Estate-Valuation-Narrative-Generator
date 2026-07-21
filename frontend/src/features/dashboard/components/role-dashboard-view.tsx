import { AiInsightsPanel } from './ai-insights-panel'
import { getActionIcon, getStatIcon } from './dashboard-icons'
import { QuickActionsPanel } from './quick-actions-panel'
import { RecentReportsPanel } from './recent-reports-panel'
import { AddressSearch } from '../../../components/ui/search-bar/address-search'
import { StatCard } from '../../../components/ui/stat-card/stat-card'
import { WelcomeCard } from '../../../components/ui/welcome-card/welcome-card'
import { useAuth } from '../../auth/hooks/use-auth'
import type { DashboardRole } from '../utils/dashboard-role'
import { getDashboardMockData } from '../../../services/mock-dashboardservice'

type RoleDashboardViewProps = {
  role: DashboardRole
}

export function RoleDashboardView({ role }: RoleDashboardViewProps) {
  const { user } = useAuth()
  const data = getDashboardMockData(role)
  const displayName = user?.fullName?.trim().split(/\s+/)[0] || 'User'

  return (
    <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
      <AddressSearch
        placeholder="Search by address, suburb, postcode or report ID..."
        className="max-w-none"
      />

      <WelcomeCard name={displayName} subtitle={data.welcomeSubtitle} />

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
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
