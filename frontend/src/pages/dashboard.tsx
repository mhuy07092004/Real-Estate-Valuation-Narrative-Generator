import { DashboardNavbar } from '../components/ui/navbar/dashboard-navbar'
import { DashboardPage } from '../features/dashboard/dashboard-page'

export default function Dashboard() {
  return (
    <DashboardNavbar>
      <DashboardPage />
    </DashboardNavbar>
  )
}
