import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../features/auth/hooks/use-auth'
import { getInitials } from '../../../features/dashboard/utils/dashboard-user'
import {
  type DashboardRole,
  clearActiveDashboardRole,
  isDashboardRole,
  REPORT_PAGE_TITLE,
  setActiveDashboardRole,
} from '../../../features/dashboard/utils/dashboard-role'
import { useAsyncData } from '../../../hooks/use-async-data'
import { useClickOutside } from '../../../hooks/use-click-outside'
import { getAgentUnreadNotificationCount } from '../../../services/agent'
import { getBuyerUnreadNotificationCount } from '../../../services/buyer'
import { getInvestorUnreadNotificationCount } from '../../../services/investor'
import { getValuerUnreadNotificationCount } from '../../../services/valuer'
import {
  BellIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalculatorIcon,
  ComparableSalesIcon,
  CompassIcon,
  DatabaseIcon,
  HeartIcon,
  HomeIcon,
  InvestorIcon,
  LayersIcon,
  MapPinIcon,
  PlusIcon,
  ReportDocIcon,
  TrendingUpIcon,
  UserIcon,
  UsersIcon,
  ValuationIcon,
} from './dashboard-navbar-icons'
import { DashboardSidebar } from './dashboard-sidebar'
import { DashboardTopbar } from './dashboard-topbar'
import type { RoleOption, SidebarNavSection } from './dashboard-navbar.types'

const ROLES = [
  { label: 'Real-Estate Agent', value: 'agent', icon: BriefcaseIcon },
  { label: 'Property Valuer', value: 'valuer', icon: ValuationIcon },
  { label: 'Investor', value: 'investor', icon: InvestorIcon },
  { label: 'Buyer', value: 'buyer', icon: UserIcon },
] as const satisfies RoleOption[]

const OVERVIEW_NAV: SidebarNavSection = {
  title: 'Overview',
  items: [{ label: 'Dashboard', icon: HomeIcon }],
}

const ROLE_NAV_SECTIONS: Record<DashboardRole, SidebarNavSection[]> = {
  agent: [
    {
      title: 'Appraisal Workflow',
      items: [
        { label: 'Generate Appraisal', icon: PlusIcon },
        { label: 'Comparable Sales', icon: ComparableSalesIcon },
        { label: 'Saved Properties', icon: HeartIcon },
        { label: 'Client Report', icon: ReportDocIcon, badge: 3 },
      ],
    },
  ],
  valuer: [
    {
      title: 'Valuation Workflow',
      items: [
        { label: 'Valuation Cases', icon: BriefcaseIcon, badge: 5 },
        { label: 'New Valuation', icon: PlusIcon },
        { label: 'Evidence Centre', icon: DatabaseIcon },
        { label: 'Saved Evidence', icon: HeartIcon },
      ],
    },
  ],
  buyer: [
    {
      title: 'Property Discovery',
      items: [
        { label: 'Generate Report', icon: PlusIcon },
        { label: 'Comparable Sales', icon: ComparableSalesIcon },
        { label: 'Saved Properties', icon: HeartIcon },
        { label: 'Buyer Report', icon: ReportDocIcon },
      ],
    },
  ],
  investor: [
    {
      title: 'Investment Workflow',
      items: [
        { label: 'Generate Report', icon: PlusIcon },
        { label: 'Comparable Sales', icon: ComparableSalesIcon },
        { label: 'Saved Properties', icon: HeartIcon },
        { label: 'Investor Report', icon: ReportDocIcon },
      ],
    },
  ],
}

const TRACKING_NAV: Record<DashboardRole, SidebarNavSection[]> = {
  agent: [
    {
      title: 'Client & Market',
      items: [
        { label: 'Clients', icon: UsersIcon },
        { label: 'Market Insights', icon: TrendingUpIcon },
      ],
    },
  ],
  valuer: [
    {
      title: 'Market',
      items: [{ label: 'Market Insights', icon: TrendingUpIcon }],
    },
  ],
  investor: [
    {
      title: 'Market',
      items: [
        { label: 'Suburb Explorer', icon: MapPinIcon },
        { label: 'Market Comparison', icon: LayersIcon },
      ],
    },
  ],
  buyer: [
    {
      title: 'Market',
      items: [{ label: 'Suburb Explorer', icon: CompassIcon }],
    },
  ],
}

const DECISION_TOOLS_NAV: Record<DashboardRole, SidebarNavSection[]> = {
  agent: [],
  valuer: [],
  investor: [
    {
      title: 'Analysis',
      items: [{ label: 'ROI Calculator', icon: CalculatorIcon }],
    },
  ],
  buyer: [
    {
      title: 'Decision Tools',
      items: [
        {
          label: 'Affordability',
          icon: CalculatorIcon,
          to: '/dashboard/buyer/affortability-calculation',
        },
        { label: 'Inspections', icon: BuildingIcon },
      ],
    },
  ],
}

const ASSISTANCE_NAV: SidebarNavSection = {
  title: 'Notifications',
  items: [{ label: 'Notifications', icon: BellIcon }],
}

type DashboardNavbarProps = {
  children?: ReactNode
}

function extractRoleFromPathname(pathname: string): DashboardRole {
  const segment = pathname.split('/')[2]
  return segment && isDashboardRole(segment) ? segment : 'agent'
}

function resolveActiveNavFromPath(pathname: string): string {
  if (pathname.endsWith('/valuation-cases')) return 'Valuation Cases'
  if (pathname.endsWith('/clients')) return 'Clients'
  if (pathname.endsWith('/market-insights')) return 'Market Insights'
  if (pathname.endsWith('/suburb-explorer')) return 'Suburb Explorer'
  if (pathname.endsWith('/report')) return REPORT_PAGE_TITLE[extractRoleFromPathname(pathname)]
  if (pathname.endsWith('/evidence-centre')) return 'Evidence Centre'
  if (pathname.endsWith('/search-properties')) return 'Search Properties'
  if (pathname.endsWith('/saved-evidence')) return 'Saved Evidence'
  if (pathname.endsWith('/saved') || pathname.endsWith('/saved-properties')) {
    return 'Saved Properties'
  }
  if (pathname.endsWith('/settings')) return 'Settings'
  if (pathname.endsWith('/copilot')) return 'AI Copilot'
  if (pathname.endsWith('/notifications')) return 'Notifications'
  if (pathname.endsWith('/affortability-calculation')) return 'Affordability'
  if (pathname.endsWith('/roi-calculation')) return 'ROI Calculator'
  if (pathname.endsWith('/comparable-sales')) return 'Comparable Sales'
  if (pathname.endsWith('/generate-report')) {
    const role = extractRoleFromPathname(pathname)
    if (role === 'agent') return 'Generate Appraisal'
    if (role === 'valuer') return 'New Valuation'
    if (role === 'investor') return 'Generate Report'
    return 'Generate Report'
  }
  if (/^\/dashboard\/[^/]+\/?$/.test(pathname)) return 'Dashboard'
  return 'Dashboard'
}

export function DashboardNavbar({ children }: DashboardNavbarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { role: roleParam } = useParams<{ role: string }>()
  const { user, logout } = useAuth()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const availableRoles = useMemo(
    () => ROLES.filter((r) => user?.roles.includes(r.value)),
    [user?.roles],
  )

  const [collapsed, setCollapsed] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [roleListOpen, setRoleListOpen] = useState(false)
  const [activeNav, setActiveNav] = useState(() => resolveActiveNavFromPath(pathname))

  const resolvedRole: DashboardRole =
    roleParam && isDashboardRole(roleParam) && availableRoles.some((r) => r.value === roleParam)
      ? roleParam
      : (availableRoles[0]?.value ?? 'agent')
  const activeRoleMeta = ROLES.find((item) => item.value === resolvedRole)
  const ActiveRoleIcon = activeRoleMeta?.icon ?? BriefcaseIcon
  const activeRoleLabel = activeRoleMeta?.label ?? 'Real-Estate Agent'
  const navSections = useMemo<SidebarNavSection[]>(
    () => [
      OVERVIEW_NAV,
      ...ROLE_NAV_SECTIONS[resolvedRole],
      ...TRACKING_NAV[resolvedRole],
      ...DECISION_TOOLS_NAV[resolvedRole],
      ASSISTANCE_NAV,
    ],
    [resolvedRole],
  )
  const displayName = user?.fullName ?? 'User'
  const displayEmail = user?.email ?? ''
  const userInitials = user ? getInitials(user.fullName) : 'U'
  const { data: unreadNotificationCount } = useAsyncData(() => {
    switch (resolvedRole) {
      case 'buyer':
        return getBuyerUnreadNotificationCount()
      case 'investor':
        return getInvestorUnreadNotificationCount()
      case 'valuer':
        return getValuerUnreadNotificationCount()
      case 'agent':
      default:
        return getAgentUnreadNotificationCount()
    }
  }, [resolvedRole])

  useEffect(() => {
    if (pathname.endsWith('/valuation-cases')) {
      setActiveNav('Valuation Cases')
    } else if (pathname.endsWith('/clients')) {
      setActiveNav('Clients')
    } else if (pathname.endsWith('/market-insights')) {
      setActiveNav('Market Insights')
    } else if (pathname.endsWith('/suburb-explorer')) {
      setActiveNav('Suburb Explorer')
    } else if (pathname.endsWith('/report')) {
      setActiveNav(REPORT_PAGE_TITLE[resolvedRole])
    } else if (pathname.endsWith('/evidence-centre')) {
      setActiveNav('Evidence Centre')
    } else if (pathname.endsWith('/search-properties')) {
      setActiveNav('Search Properties')
    } else if (pathname.endsWith('/saved-evidence')) {
      setActiveNav('Saved Evidence')
    } else if (pathname.endsWith('/saved') || pathname.endsWith('/saved-properties')) {
      setActiveNav('Saved Properties')
    } else if (pathname.endsWith('/settings')) {
      setActiveNav('Settings')
    } else if (pathname.endsWith('/copilot')) {
      setActiveNav('AI Copilot')
    } else if (pathname.endsWith('/notifications')) {
      setActiveNav('Notifications')
    } else if (pathname.endsWith('/affortability-calculation')) {
      setActiveNav('Affordability')
    } else if (pathname.endsWith('/roi-calculation')) {
      setActiveNav('ROI Calculator')
    } else if (pathname.endsWith('/comparable-sales')) {
      setActiveNav('Comparable Sales')
    } else if (pathname.endsWith('/generate-report')) {
      if (resolvedRole === 'agent') {
        setActiveNav('Generate Appraisal')
      } else if (resolvedRole === 'valuer') {
        setActiveNav('New Valuation')
      } else if (resolvedRole === 'investor') {
        setActiveNav('Generate Report')
      } else {
        setActiveNav('Generate Report')
      }
    } else if (/^\/dashboard\/[^/]+\/?$/.test(pathname)) {
      setActiveNav('Dashboard')
    }
  }, [pathname, resolvedRole])

  useClickOutside(userMenuRef, userMenuOpen, () => {
    setUserMenuOpen(false)
    setRoleListOpen(false)
  })

  function handleRoleChange(nextRole: DashboardRole) {
    setActiveDashboardRole(nextRole)
    setActiveNav('Dashboard')
    setRoleOpen(false)
    setRoleListOpen(false)
    setUserMenuOpen(false)
    navigate(`/dashboard/${nextRole}`, { replace: true })
  }

  function handleSignOut() {
    clearActiveDashboardRole()
    logout()
    navigate('/signin')
  }

  function handleNavigateToSettings() {
    setUserMenuOpen(false)
    setRoleListOpen(false)
    setActiveNav('Settings')
  }

  function handleNavigateToNotifications() {
    setActiveNav('Notifications')
    navigate(`/dashboard/${resolvedRole}/notifications`)
  }

  function handleNavigateHome() {
    navigate('/')
  }

  function handleNavigatePlatform() {
    setActiveNav('Dashboard')
    navigate(`/dashboard/${resolvedRole}`)
  }

  function handleNavChange(label: string, to?: string) {
    setActiveNav(label)
    if (to) {
      navigate(to)
      return
    }
    if (label === 'Dashboard') {
      navigate(`/dashboard/${resolvedRole}`)
    } else if (label === 'Valuation Cases' && resolvedRole === 'valuer') {
      navigate('/dashboard/valuer/valuation-cases')
    } else if (
      (label === 'Client' || label === 'Clients') &&
      resolvedRole === 'agent'
    ) {
      navigate(`/dashboard/${resolvedRole}/clients`)
    } else if (label === 'Market Insights') {
      navigate(`/dashboard/${resolvedRole}/market-insights`)
    } else if (label === 'Suburb Explorer') {
      navigate(`/dashboard/${resolvedRole}/suburb-explorer`)
    } else if (label === REPORT_PAGE_TITLE[resolvedRole]) {
      navigate(`/dashboard/${resolvedRole}/report`)
    } else if (label === 'Evidence Centre' && resolvedRole === 'valuer') {
      navigate('/dashboard/valuer/evidence-centre')
    } else if (label === 'Search Properties' && resolvedRole === 'buyer') {
      navigate('/dashboard/buyer/search-properties')
    } else if (label === 'Saved Evidence' && resolvedRole === 'valuer') {
      navigate('/dashboard/valuer/saved-evidence')
    } else if (label === 'Saved Properties' || label === 'Saved') {
      if (resolvedRole === 'buyer') {
        navigate('/dashboard/buyer/saved')
      } else {
        navigate(`/dashboard/${resolvedRole}/saved-properties`)
      }
    } else if (label === 'Settings') {
      navigate(`/dashboard/${resolvedRole}/settings`)
    } else if (label === 'AI Copilot') {
      navigate(`/dashboard/${resolvedRole}/copilot`)
    } else if (label === 'Notifications') {
      navigate(`/dashboard/${resolvedRole}/notifications`)
    } else if (label === 'ROI Calculator') {
      navigate(`/dashboard/${resolvedRole}/roi-calculation`)
    } else if (label === 'Affordability' && resolvedRole === 'buyer') {
      navigate('/dashboard/buyer/affortability-calculation')
    } else if (label === 'Comparable Sales') {
      navigate(`/dashboard/${resolvedRole}/comparable-sales`)
    } else if (label === 'Generate Appraisal' && resolvedRole === 'agent') {
      navigate('/dashboard/agent/generate-report')
    } else if (label === 'New Valuation' && resolvedRole === 'valuer') {
      navigate('/dashboard/valuer/generate-report')
    } else if (label === 'Generate Report' && resolvedRole === 'investor') {
      navigate('/dashboard/investor/generate-report')
    } else if (label === 'Generate Report' && resolvedRole === 'buyer') {
      navigate('/dashboard/buyer/generate-report')
    } else {
      navigate(`/dashboard/${resolvedRole}/mock`)
    }
  }

  function handleExpandRole() {
    if (collapsed) setCollapsed(false)
    setRoleOpen((open) => !open)
  }

  function handleToggleUserMenu() {
    setUserMenuOpen((open) => {
      if (open) setRoleListOpen(false)
      return !open
    })
  }

  return (
    <div className="dashboard-shell flex min-h-screen bg-[#F5F6F8]">
      <DashboardSidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
        roleOpen={roleOpen}
        onExpandRole={handleExpandRole}
        availableRoles={availableRoles}
        resolvedRole={resolvedRole}
        activeRoleLabel={activeRoleLabel}
        ActiveRoleIcon={ActiveRoleIcon}
        onRoleChange={handleRoleChange}
        navSections={navSections}
        activeNav={activeNav}
        onNavChange={handleNavChange}
        onSignOut={handleSignOut}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          userMenuRef={userMenuRef}
          user={user}
          userMenuOpen={userMenuOpen}
          onToggleUserMenu={handleToggleUserMenu}
          roleListOpen={roleListOpen}
          onToggleRoleList={() => setRoleListOpen((open) => !open)}
          availableRoles={availableRoles}
          resolvedRole={resolvedRole}
          activeRoleLabel={activeRoleLabel}
          ActiveRoleIcon={ActiveRoleIcon}
          onRoleChange={handleRoleChange}
          displayName={displayName}
          displayEmail={displayEmail}
          userInitials={userInitials}
          onNavigateToSettings={handleNavigateToSettings}
          onNavigateToNotifications={handleNavigateToNotifications}
          unreadNotificationCount={unreadNotificationCount ?? 0}
          onSignOut={handleSignOut}
          activeNavLabel={activeNav}
          onNavigateHome={handleNavigateHome}
          onNavigatePlatform={handleNavigatePlatform}
        />

        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
