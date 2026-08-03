import { getStatIcon } from './dashboard-icons'
import { RecentReportsPanel } from './recent-reports-panel'
import { StatCard } from '../../../components/ui/stat-card/stat-card'
import { useAsyncData } from '../../../hooks/use-async-data'
import type { DashboardRole } from '../utils/dashboard-role'
import { getDashboardMockData } from '../../../services/dashboard'

type RoleDashboardViewProps = {
  role: DashboardRole
}

export function RoleDashboardView({ role }: RoleDashboardViewProps) {
  const { data } = useAsyncData(() => getDashboardMockData(role), [role])

  if (!data) {
    return <div className="p-6 text-sm text-relaive-gray sm:p-8">Loading dashboard…</div>
  }

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

      <RecentReportsPanel reports={data.reports} />
    </div>
  )
}
