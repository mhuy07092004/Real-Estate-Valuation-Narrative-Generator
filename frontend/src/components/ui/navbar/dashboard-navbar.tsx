import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../features/auth/hooks/use-auth'
import { formatShortName, getInitials } from '../../../features/dashboard/utils/dashboard-user'
import {
  type DashboardRole,
  clearActiveDashboardRole,
  isDashboardRole,
  setActiveDashboardRole,
} from '../../../features/dashboard/utils/dashboard-role'
import { useClickOutside } from '../../../hooks/use-click-outside'
import {
  BellIcon,
  BookmarkIcon,
  BotIcon,
  BriefcaseIcon,
  HomeIcon,
  InvestorIcon,
  NavPlaceholderIcon,
  UserIcon,
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

const NAV_ITEMS_BY_ROLE: Record<DashboardRole, string[]> = {
  agent: ['Generate Appraisal', 'Comparable Sales', 'Client', 'Client Report'],
  valuer: ['Generate Appraisal', 'Valuation Cases', 'Evidence Center'],
  investor: ['Generate Report', 'ROI Calculator', 'Market Comparison', 'Investor Report'],
  buyer: ['Search Properties', 'Generate Report', 'Affordability', 'Buyer Report', 'Suburb Explorer'],
}

const TRACKING_NAV: SidebarNavSection = {
  title: 'Tracking',
  items: [
    { label: 'Watchlist', icon: BookmarkIcon },
    { label: 'Alert', icon: BellIcon },
  ],
}

const ASSISTANCE_NAV: SidebarNavSection = {
  title: 'Assistance',
  items: [{ label: 'AI Copilot', icon: BotIcon }],
}

type DashboardNavbarProps = {
  children?: ReactNode
}

export function DashboardNavbar({ children }: DashboardNavbarProps) {
  const navigate = useNavigate()
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
  const [activeNav, setActiveNav] = useState('Dashboard')

  const resolvedRole: DashboardRole =
    roleParam && isDashboardRole(roleParam) && availableRoles.some((r) => r.value === roleParam)
      ? roleParam
      : (availableRoles[0]?.value ?? 'agent')
  const activeRoleMeta = ROLES.find((item) => item.value === resolvedRole)
  const ActiveRoleIcon = activeRoleMeta?.icon ?? BriefcaseIcon
  const activeRoleLabel = activeRoleMeta?.label ?? 'Real-Estate Agent'
  const navSections = useMemo<SidebarNavSection[]>(
    () => [
      {
        title: 'Overview',
        items: [
          { label: 'Dashboard', icon: HomeIcon },
          ...NAV_ITEMS_BY_ROLE[resolvedRole].map((label) => ({
            label,
            icon: NavPlaceholderIcon,
          })),
        ],
      },
      TRACKING_NAV,
      ASSISTANCE_NAV,
    ],
    [resolvedRole],
  )
  const displayName = user ? formatShortName(user.fullName) : 'User'
  const displayEmail = user?.email ?? ''
  const userInitials = user ? getInitials(user.fullName) : 'U'

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

  function handleNavChange(label: string) {
    setActiveNav(label)
    if (label === 'Dashboard') {
      navigate(`/dashboard/${resolvedRole}`)
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
    <div className="flex min-h-screen bg-[#F5F6F8]">
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
          onSignOut={handleSignOut}
        />

        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
