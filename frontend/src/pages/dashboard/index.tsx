import { Suspense, useEffect } from 'react'
import { Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button/button'
import { DashboardNavbar } from '../../components/ui/navbar/dashboard-navbar'
import { useAuth } from '../../features/auth/hooks/use-auth'
import { DashboardViewSkeleton } from './dashboard-view-skeleton.tsx'
import {
  getActiveDashboardRole,
  getDefaultDashboardRole,
  isDashboardRole,
  resolveDashboardRole,
  setActiveDashboardRole,
} from '../../features/dashboard/utils/dashboard-role'
import { LAZY_ROLE_VIEWS, preloadOtherDashboardRoles } from './dashboard-role-lazy.tsx'
import { formatUserDisplayDate } from '../../features/dashboard/utils/dashboard-date'
import { VersionSwitch } from '../../v2/VersionSwitch'
import { VersionToggleControl } from '../../v2/VersionToggleControl'
import { AgentHomeV2 } from '../../v2/pages/dashboard/real-estate-agent/agent-home'

function isDashboardRoleHome(pathname: string) {
  return /^\/dashboard\/[^/]+\/?$/.test(pathname)
}

function DashboardWelcomeHeader() {
  const { user } = useAuth()
  const { role: roleParam } = useParams<{ role: string }>()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const displayName = user?.fullName?.trim().split(/\s+/)[0] || 'User'
  const dateLabel = formatUserDisplayDate()

  if (!roleParam || !isDashboardRole(roleParam) || !isDashboardRoleHome(pathname)) return null

  return (
    <header className="font-sans px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
          Welcome Back, {displayName}
        </h1>
        <Button
          size="sm"
          className="shrink-0"
          onClick={() => navigate(`/dashboard/${roleParam}/generate-report`)}
        >
          New Report
        </Button>
      </div>
      <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">{dateLabel}</p>
    </header>
  )
}

export function DashboardLayout() {
  return (
    <DashboardNavbar>
      <DashboardWelcomeHeader />
      <Outlet />
      <VersionToggleControl />
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

  // Once the active role's chunk has painted, warm the other roles in the
  // background so switching roles later (sidebar/topbar accordion) is instant.
  useEffect(() => {
    if (roleParam && isDashboardRole(roleParam)) {
      preloadOtherDashboardRoles(roleParam)
    }
  }, [roleParam])

  if (!roleParam || !isDashboardRole(roleParam)) {
    return <Navigate to="/dashboard" replace />
  }

  const View = LAZY_ROLE_VIEWS[roleParam]
  const v1Element = (
    <Suspense fallback={<DashboardViewSkeleton />}>
      <View />
    </Suspense>
  )

  // Only the agent role has a v2 home page so far — see figma-ui-migration-plan.md §9.
  if (roleParam === 'agent') {
    return <VersionSwitch v1={v1Element} v2={<AgentHomeV2 />} />
  }

  return v1Element
}

export default function Dashboard() {
  return <DashboardLayout />
}
