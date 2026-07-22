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
import { formatUserDisplayDate } from '../features/dashboard/utils/dashboard-date'

const ROLE_VIEWS: Record<DashboardRole, ComponentType> = {
  agent: AgentDashboard,
  valuer: ValuerDashboard,
  investor: InvestorDashboard,
  buyer: BuyerDashboard,
}

function DashboardWelcomeHeader() {
  const { user } = useAuth()
  const { role: roleParam } = useParams<{ role: string }>()
  const displayName = user?.fullName?.trim().split(/\s+/)[0] || 'User'
  const dateLabel = formatUserDisplayDate()

  if (!roleParam || !isDashboardRole(roleParam)) return null

  return (
    <header className="font-sans px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
      <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
        Welcome Back, {displayName}
      </h1>
      <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">{dateLabel}</p>
    </header>
  )
}

export function DashboardLayout() {
  return (
    <DashboardNavbar>
      <DashboardWelcomeHeader />
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
