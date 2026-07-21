import type { ComponentType } from 'react'
import { Navigate, Outlet, useParams } from 'react-router-dom'
import { DashboardNavbar } from '../components/ui/navbar/dashboard-navbar'
import { useAuth } from '../features/auth/hooks/use-auth'
import { AgentDashboard } from '../features/dashboard/components/real-estate-agent/agent-dashboard'
import { ValuerDashboard } from '../features/dashboard/components/property-valuer/valuer-dashboard'
import { InvestorDashboard } from '../features/dashboard/components/investor/investor-dashboard'
import { BuyerDashboard } from '../features/dashboard/components/buyer/buyer-dashboard'
import {
  type DashboardRole,
  getActiveDashboardRole,
  getDefaultDashboardRole,
  isDashboardRole,
  resolveDashboardRole,
  setActiveDashboardRole,
} from '../features/dashboard/utils/dashboard-role'

const ROLE_VIEWS: Record<DashboardRole, ComponentType> = {
  agent: AgentDashboard,
  valuer: ValuerDashboard,
  investor: InvestorDashboard,
  buyer: BuyerDashboard,
}

export function DashboardLayout() {
  return (
    <DashboardNavbar>
      <Outlet />
    </DashboardNavbar>
  )
}

export function DashboardRoleRedirect() {
  const { user } = useAuth()
  const userRoles = user?.roles ?? []
  const role = resolveDashboardRole(userRoles)

  if (!role) {
    return <Navigate to="/" replace />
  }

  setActiveDashboardRole(role)
  return <Navigate to={`/dashboard/${role}`} replace />
}

export function DashboardRoleGuard() {
  const { role: roleParam } = useParams<{ role: string }>()
  const { user } = useAuth()
  const userRoles = user?.roles ?? []

  let active = getActiveDashboardRole()
  if (!active || !userRoles.includes(active)) {
    active = getDefaultDashboardRole(userRoles)
    if (active) setActiveDashboardRole(active)
  }

  if (!active) {
    return <Navigate to="/" replace />
  }

  if (!roleParam || !isDashboardRole(roleParam) || !userRoles.includes(roleParam)) {
    return <Navigate to={`/dashboard/${active}`} replace />
  }

  if (roleParam !== active) {
    return <Navigate to={`/dashboard/${active}`} replace />
  }

  return <Outlet />
}

export function DashboardRoleHome() {
  const { role: roleParam } = useParams<{ role: string }>()
  if (!roleParam || !isDashboardRole(roleParam)) {
    return <Navigate to="/dashboard" replace />
  }

  const View = ROLE_VIEWS[roleParam]
  return <View />
}

export default function Dashboard() {
  return <DashboardLayout />
}
