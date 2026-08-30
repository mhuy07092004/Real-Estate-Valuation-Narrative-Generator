import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
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
import { useUiVersion } from '../../../v2/use-ui-version'
import { getAgentUnreadNotificationCount } from '../../../services/agent'
import { getBuyerUnreadNotificationCount } from '../../../services/buyer'
import { getInvestorUnreadNotificationCount } from '../../../services/investor'
import { getValuerUnreadNotificationCount } from '../../../services/valuer'
import {
  BellIcon,
  BookmarkIcon,
  BotIcon,
  BriefcaseIcon,
  CalculatorIcon,
  ClipboardListIcon,
  CompareIcon,
  CompassIcon,
  DatabaseIcon,
  DocumentIcon,
  HeartIcon,
  HomeIcon,
  InvestorIcon,
  LayersIcon,
  MapPinIcon,
  NavPlaceholderIcon,
  PlusIcon,
  ScaleIcon,
  SparkleIcon,
  TrendingUpIcon,
  UserGroupIcon,
  UsersIcon,
  ClockIcon,
  UserIcon,
  ValuationIcon,
} from './dashboard-navbar-icons'
import type { RoleOption, SidebarNavSection } from './dashboard-navbar.types'

export const ROLES = [
  { label: 'Real-Estate Agent', value: 'agent', icon: BriefcaseIcon },
  { label: 'Property Valuer', value: 'valuer', icon: ValuationIcon },
  { label: 'Investor', value: 'investor', icon: InvestorIcon },
  { label: 'Buyer', value: 'buyer', icon: UserIcon },
] as const satisfies RoleOption[]

export const OVERVIEW_NAV: SidebarNavSection = {
  title: 'Overview',
  items: [{ label: 'Dashboard', icon: HomeIcon }],
}

export const ROLE_NAV_SECTIONS: Record<DashboardRole, SidebarNavSection[]> = {
  agent: [
    {
      title: 'Appraisal Workflow',
      items: [
        { label: 'Generate Report', icon: NavPlaceholderIcon },
        { label: 'Comparable Sales', icon: NavPlaceholderIcon },
        { label: 'Market Intelligence', icon: NavPlaceholderIcon },
        { label: 'Client', icon: NavPlaceholderIcon },
        { label: 'Client Report', icon: NavPlaceholderIcon },
      ],
    },
    {
      title: 'Shared',
      items: [
        { label: 'Team', icon: UserGroupIcon },
        { label: 'Timeline', icon: ClockIcon },
      ],
    },
  ],
  valuer: [
    {
      title: 'Valuation Workflow',
      items: [
        { label: 'New Valuation', icon: NavPlaceholderIcon },
        { label: 'Valuation Cases', icon: NavPlaceholderIcon },
        { label: 'Evidence Center', icon: NavPlaceholderIcon },
        { label: 'Saved Evidence', icon: BookmarkIcon },
        { label: 'Reports', icon: NavPlaceholderIcon },
        { label: 'Audit Trail', icon: ScaleIcon },
        { label: 'Explainable AI', icon: SparkleIcon },
      ],
    },
    {
      title: 'Shared',
      items: [
        { label: 'Team', icon: UserGroupIcon },
        { label: 'Timeline', icon: ClockIcon },
      ],
    },
  ],
  buyer: [
    {
      title: 'Property Discovery',
      items: [
        { label: 'Generate Report', icon: NavPlaceholderIcon },
        { label: 'Search Properties', icon: NavPlaceholderIcon },
        { label: 'Saved', icon: NavPlaceholderIcon },
        { label: 'Compare Properties', icon: NavPlaceholderIcon },
        { label: 'Affordability', icon: NavPlaceholderIcon },
        { label: 'Inspections', icon: NavPlaceholderIcon },
        { label: 'Buyer Report', icon: NavPlaceholderIcon },
        { label: 'Suburb Explorer', icon: NavPlaceholderIcon },
      ],
    },
    {
      title: 'Shared',
      items: [{ label: 'Timeline', icon: ClockIcon }],
    },
  ],
  investor: [
    {
      title: 'Market Intelligence',
      items: [
        { label: 'Generate Report', icon: NavPlaceholderIcon },
        { label: 'Market Comparison', icon: NavPlaceholderIcon },
        { label: 'Suburb Explorer', icon: NavPlaceholderIcon },
        { label: 'ROI Calculator', icon: NavPlaceholderIcon },
        { label: 'Investor Report', icon: NavPlaceholderIcon },
      ],
    },
    {
      title: 'Shared',
      items: [{ label: 'Timeline', icon: ClockIcon }],
    },
  ],
}

export const TRACKING_NAV: SidebarNavSection = {
  title: 'Tracking',
  items: [
    { label: 'Watchlist', icon: BookmarkIcon },
    { label: 'Alert', icon: BellIcon },
  ],
}

export const ASSISTANCE_NAV: SidebarNavSection = {
  title: 'Assistance',
  items: [{ label: 'AI Copilot', icon: BotIcon }],
}

// ---------------------------------------------------------------------------
// v2 sidebar — matches figma-protoype_v2's Sidebar.tsx section-for-section, per
// role. The v1 constants above (ROLE_NAV_SECTIONS/TRACKING_NAV/ASSISTANCE_NAV)
// are untouched and still drive DashboardNavbar/DashboardSidebar exactly as
// before. Deliberate omissions, verified against the prototype source directly:
// - Watchlist is topbar-only in the prototype (DashboardTopBar.tsx:137-148, no
//   role gate, no Sidebar.tsx entry at all) — already a real button in
//   V2Topbar, so it does not belong here.
// - AI Copilot is mobile-nav-only (MobileNavigation.tsx:17) — not in
//   Sidebar.tsx for any role — already in V2MobileNav.
// - Team Workspace / Property Timeline have zero nav path anywhere in the
//   prototype (checked Sidebar.tsx, DashboardTopBar.tsx, MobileNavigation.tsx —
//   only a breadcrumb-label lookup, never a clickable trigger). Same for
//   Valuer's Audit Trail/Explainable AI. These pages stay URL-reachable only,
//   matching their orphaned status in the source design, rather than adding
//   sidebar links the prototype itself never has.
// - Static prototype badge numbers (Valuation Cases 5, Client/Investment/Buyer
//   Reports 3/3/2, Inspections 2) have no real per-role data source, so they're
//   omitted rather than hardcoded — only Notifications carries a real badge
//   (the live unread count already fetched below).

export const V2_ROLE_NAV_SECTIONS: Record<DashboardRole, SidebarNavSection[]> = {
  agent: [
    {
      title: 'Appraisal Workflow',
      items: [
        { label: 'Generate Appraisal', icon: PlusIcon },
        { label: 'Comparable Sales', icon: CompareIcon },
        { label: 'Saved Properties', icon: HeartIcon },
        { label: 'Client Reports', icon: DocumentIcon },
      ],
    },
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
      title: 'Valuation Workflow',
      items: [
        { label: 'Valuation Cases', icon: BriefcaseIcon },
        { label: 'New Valuation', icon: PlusIcon },
        { label: 'Evidence Centre', icon: DatabaseIcon },
        { label: 'Saved Evidence', icon: HeartIcon },
      ],
    },
    {
      title: 'Market',
      items: [{ label: 'Market Insights', icon: TrendingUpIcon }],
    },
  ],
  investor: [
    {
      title: 'Investment Workflow',
      items: [
        { label: 'Generate Report', icon: PlusIcon },
        { label: 'Comparable Sales', icon: CompareIcon },
        { label: 'Saved Properties', icon: HeartIcon },
        { label: 'Investment Reports', icon: DocumentIcon },
      ],
    },
    {
      title: 'Market',
      items: [
        { label: 'Suburb Explorer', icon: MapPinIcon },
        { label: 'Market Comparison', icon: LayersIcon },
      ],
    },
    {
      title: 'Analysis',
      items: [{ label: 'ROI Calculator', icon: CalculatorIcon }],
    },
  ],
  buyer: [
    {
      title: 'Property Workflow',
      items: [
        { label: 'Generate Report', icon: PlusIcon },
        { label: 'Comparable Sales', icon: CompareIcon },
        { label: 'Saved Properties', icon: HeartIcon },
        { label: 'Buyer Reports', icon: DocumentIcon },
      ],
    },
    {
      title: 'Market',
      items: [{ label: 'Suburb Explorer', icon: CompassIcon }],
    },
    {
      title: 'Decision Tools',
      items: [
        { label: 'Affordability', icon: CalculatorIcon },
        { label: 'Inspections', icon: ClipboardListIcon },
      ],
    },
  ],
}

function buildV2NotificationsSection(unreadCount: number): SidebarNavSection {
  return {
    title: 'Notifications',
    items: [{ label: 'Notifications', icon: BellIcon, badge: unreadCount > 0 ? unreadCount : undefined }],
  }
}

const V2_REPORT_LABEL: Record<DashboardRole, string> = {
  agent: 'Client Reports',
  valuer: 'Valuation Cases',
  investor: 'Investment Reports',
  buyer: 'Buyer Reports',
}

export function resolveActiveNavFromPathV2(pathname: string, role: DashboardRole): string {
  if (pathname.endsWith('/valuation-cases')) return 'Valuation Cases'
  if (pathname.endsWith('/comparable-sales')) return 'Comparable Sales'
  if (pathname.endsWith('/market-intelligence')) {
    // figma: "market" and "suburb-explorer" page ids both render <MarketIntelligencePage/>
    // — same destination, labeled per role's own vocabulary (App.tsx lines 221/262).
    return role === 'investor' || role === 'buyer' ? 'Suburb Explorer' : 'Market Insights'
  }
  if (pathname.endsWith('/clients')) return 'Clients'
  if (pathname.endsWith('/report')) return V2_REPORT_LABEL[role]
  if (pathname.endsWith('/evidence-centre')) return 'Evidence Centre'
  if (pathname.endsWith('/saved-evidence')) return 'Saved Evidence'
  if (pathname.endsWith('/saved-properties')) return 'Saved Properties'
  if (pathname.endsWith('/saved')) return 'Saved Properties'
  if (pathname.endsWith('/notifications')) return 'Notifications'
  if (pathname.endsWith('/affortability-calculation')) return 'Affordability'
  if (pathname.endsWith('/roi-calculation')) return 'ROI Calculator'
  if (pathname.endsWith('/market-comparison')) return 'Market Comparison'
  if (pathname.endsWith('/suburb-explorer')) return 'Suburb Explorer'
  if (pathname.endsWith('/inspections')) return 'Inspections'
  if (pathname.endsWith('/generate-report')) {
    if (role === 'valuer') return 'New Valuation'
    if (role === 'agent') return 'Generate Appraisal'
    return 'Generate Report'
  }
  if (/^\/dashboard\/[^/]+\/?$/.test(pathname)) return 'Dashboard'
  return 'Dashboard'
}

export function extractRoleFromPathname(pathname: string): DashboardRole {
  const segment = pathname.split('/')[2]
  return segment && isDashboardRole(segment) ? segment : 'agent'
}

export function resolveActiveNavFromPath(pathname: string): string {
  if (pathname.endsWith('/valuation-cases')) return 'Valuation Cases'
  if (pathname.endsWith('/comparable-sales')) return 'Comparable Sales'
  if (pathname.endsWith('/market-intelligence')) return 'Market Intelligence'
  if (pathname.endsWith('/clients')) return 'Client'
  if (pathname.endsWith('/report')) return REPORT_PAGE_TITLE[extractRoleFromPathname(pathname)]
  if (pathname.endsWith('/evidence-centre')) return 'Evidence Center'
  if (pathname.endsWith('/search-properties')) return 'Search Properties'
  if (pathname.endsWith('/saved')) return 'Saved'
  if (pathname.endsWith('/settings')) return 'Settings'
  if (pathname.endsWith('/copilot')) return 'AI Copilot'
  if (pathname.endsWith('/notifications')) return 'Alert'
  if (pathname.endsWith('/affortability-calculation')) return 'Affordability'
  if (pathname.endsWith('/roi-calculation')) return 'ROI Calculator'
  if (pathname.endsWith('/watchlist')) return 'Watchlist'
  if (pathname.endsWith('/market-comparison')) return 'Market Comparison'
  if (pathname.endsWith('/suburb-explorer')) return 'Suburb Explorer'
  if (pathname.endsWith('/compare-properties')) return 'Compare Properties'
  if (pathname.endsWith('/inspections')) return 'Inspections'
  if (pathname.endsWith('/audit-trail')) return 'Audit Trail'
  if (pathname.endsWith('/explainable-ai')) return 'Explainable AI'
  if (pathname.endsWith('/team')) return 'Team'
  if (pathname.endsWith('/timeline')) return 'Timeline'
  if (pathname.endsWith('/saved-evidence')) return 'Saved Evidence'
  if (pathname.endsWith('/generate-report')) {
    const role = extractRoleFromPathname(pathname)
    if (role === 'valuer') return 'New Valuation'
    if (role === 'investor') return 'Generate Report'
    return 'Generate Report'
  }
  if (/^\/dashboard\/[^/]+\/?$/.test(pathname)) return 'Dashboard'
  return 'Dashboard'
}

export type DashboardNavState = {
  navigate: ReturnType<typeof useNavigate>
  pathname: string
  user: ReturnType<typeof useAuth>['user']
  uiVersion: ReturnType<typeof useUiVersion>
  userMenuRef: RefObject<HTMLDivElement | null>
  availableRoles: RoleOption[]
  collapsed: boolean
  setCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void
  roleOpen: boolean
  setRoleOpen: (value: boolean | ((prev: boolean) => boolean)) => void
  userMenuOpen: boolean
  setUserMenuOpen: (value: boolean | ((prev: boolean) => boolean)) => void
  roleListOpen: boolean
  setRoleListOpen: (value: boolean | ((prev: boolean) => boolean)) => void
  activeNav: string
  setActiveNav: (value: string) => void
  resolvedRole: DashboardRole
  activeRoleMeta: RoleOption | undefined
  ActiveRoleIcon: RoleOption['icon']
  activeRoleLabel: string
  navSections: SidebarNavSection[]
  v2NavSections: SidebarNavSection[]
  displayName: string
  displayEmail: string
  userInitials: string
  unreadNotificationCount: number
  handleRoleChange: (nextRole: DashboardRole) => void
  handleSignOut: () => void
  handleNavigateToSettings: () => void
  handleNavigateToNotifications: () => void
  handleNavigateToWatchlist: () => void
  handleNavigateHome: () => void
  handleNavigatePlatform: () => void
  handleNavChange: (label: string) => void
  handleExpandRole: () => void
  handleToggleUserMenu: () => void
}

/**
 * Headless nav-state hook shared by the v1 `DashboardNavbar` shell and the
 * v2 shell (`v2/components/shell`). Owns everything that is NOT rendering:
 * nav-section data, active-nav resolution from the URL, role resolution,
 * unread-notification fetching, and all the navbar interaction handlers.
 */
export function useDashboardNavState(): DashboardNavState {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { role: roleParam } = useParams<{ role: string }>()
  const { user, logout } = useAuth()
  const uiVersion = useUiVersion()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const availableRoles = useMemo(
    () => ROLES.filter((r) => user?.roles.includes(r.value)),
    [user?.roles],
  )

  const [collapsed, setCollapsed] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [roleListOpen, setRoleListOpen] = useState(false)
  const [activeNav, setActiveNav] = useState(() =>
    uiVersion === 'v2'
      ? resolveActiveNavFromPathV2(pathname, extractRoleFromPathname(pathname))
      : resolveActiveNavFromPath(pathname),
  )

  const resolvedRole: DashboardRole =
    roleParam && isDashboardRole(roleParam) && availableRoles.some((r) => r.value === roleParam)
      ? roleParam
      : (availableRoles[0]?.value ?? 'agent')
  const activeRoleMeta = ROLES.find((item) => item.value === resolvedRole)
  const ActiveRoleIcon = activeRoleMeta?.icon ?? BriefcaseIcon
  const activeRoleLabel = activeRoleMeta?.label ?? 'Real-Estate Agent'
  const navSections = useMemo<SidebarNavSection[]>(
    () => [OVERVIEW_NAV, ...ROLE_NAV_SECTIONS[resolvedRole], TRACKING_NAV, ASSISTANCE_NAV],
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
  const v2NavSections = useMemo<SidebarNavSection[]>(
    () => [
      OVERVIEW_NAV,
      ...V2_ROLE_NAV_SECTIONS[resolvedRole],
      buildV2NotificationsSection(unreadNotificationCount ?? 0),
    ],
    [resolvedRole, unreadNotificationCount],
  )

  useEffect(() => {
    if (uiVersion === 'v2') {
      setActiveNav(resolveActiveNavFromPathV2(pathname, resolvedRole))
      return
    }
    if (pathname.endsWith('/valuation-cases')) {
      setActiveNav('Valuation Cases')
    } else if (pathname.endsWith('/comparable-sales')) {
      setActiveNav('Comparable Sales')
    } else if (pathname.endsWith('/market-intelligence')) {
      setActiveNav('Market Intelligence')
    } else if (pathname.endsWith('/clients')) {
      setActiveNav('Client')
    } else if (pathname.endsWith('/report')) {
      setActiveNav(REPORT_PAGE_TITLE[resolvedRole])
    } else if (pathname.endsWith('/evidence-centre')) {
      setActiveNav('Evidence Center')
    } else if (pathname.endsWith('/search-properties')) {
      setActiveNav('Search Properties')
    } else if (pathname.endsWith('/saved')) {
      setActiveNav('Saved')
    } else if (pathname.endsWith('/settings')) {
      setActiveNav('Settings')
    } else if (pathname.endsWith('/copilot')) {
      setActiveNav('AI Copilot')
    } else if (pathname.endsWith('/notifications')) {
      setActiveNav('Alert')
    } else if (pathname.endsWith('/affortability-calculation')) {
      setActiveNav('Affordability')
    } else if (pathname.endsWith('/roi-calculation')) {
      setActiveNav('ROI Calculator')
    } else if (pathname.endsWith('/watchlist')) {
      setActiveNav('Watchlist')
    } else if (pathname.endsWith('/market-comparison')) {
      setActiveNav('Market Comparison')
    } else if (pathname.endsWith('/suburb-explorer')) {
      setActiveNav('Suburb Explorer')
    } else if (pathname.endsWith('/compare-properties')) {
      setActiveNav('Compare Properties')
    } else if (pathname.endsWith('/inspections')) {
      setActiveNav('Inspections')
    } else if (pathname.endsWith('/audit-trail')) {
      setActiveNav('Audit Trail')
    } else if (pathname.endsWith('/explainable-ai')) {
      setActiveNav('Explainable AI')
    } else if (pathname.endsWith('/team')) {
      setActiveNav('Team')
    } else if (pathname.endsWith('/timeline')) {
      setActiveNav('Timeline')
    } else if (pathname.endsWith('/saved-evidence')) {
      setActiveNav('Saved Evidence')
    } else if (pathname.endsWith('/generate-report')) {
      if (resolvedRole === 'valuer') {
        setActiveNav('New Valuation')
      } else if (resolvedRole === 'investor') {
        setActiveNav('Generate Report')
      } else {
        setActiveNav('Generate Report')
      }
    } else if (/^\/dashboard\/[^/]+\/?$/.test(pathname)) {
      setActiveNav('Dashboard')
    }
  }, [pathname, resolvedRole, uiVersion])

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
    setActiveNav('Alert')
    navigate(`/dashboard/${resolvedRole}/notifications`)
  }

  function handleNavigateToWatchlist() {
    setActiveNav('Watchlist')
    navigate(`/dashboard/${resolvedRole}/watchlist`)
  }

  function handleNavigateHome() {
    navigate('/')
  }

  function handleNavigatePlatform() {
    setActiveNav('Dashboard')
    navigate(`/dashboard/${resolvedRole}`)
  }

  function handleNavChange(label: string) {
    setActiveNav(label)
    if (label === 'Dashboard') {
      navigate(`/dashboard/${resolvedRole}`)
    } else if (label === 'Valuation Cases' && resolvedRole === 'valuer') {
      navigate('/dashboard/valuer/valuation-cases')
    } else if (label === 'Client' && resolvedRole === 'agent') {
      navigate(`/dashboard/${resolvedRole}/clients`)
    } else if (label === REPORT_PAGE_TITLE[resolvedRole]) {
      navigate(`/dashboard/${resolvedRole}/report`)
    } else if (label === 'Evidence Center' && resolvedRole === 'valuer') {
      navigate('/dashboard/valuer/evidence-centre')
    } else if (label === 'Search Properties' && resolvedRole === 'buyer') {
      navigate('/dashboard/buyer/search-properties')
    } else if (label === 'Saved' && resolvedRole === 'buyer') {
      navigate('/dashboard/buyer/saved')
    } else if (label === 'Settings') {
      navigate(`/dashboard/${resolvedRole}/settings`)
    } else if (label === 'AI Copilot') {
      navigate(`/dashboard/${resolvedRole}/copilot`)
    } else if (label === 'Alert') {
      navigate(`/dashboard/${resolvedRole}/notifications`)
    } else if (label === 'ROI Calculator') {
      navigate(`/dashboard/${resolvedRole}/roi-calculation`)
    } else if (label === 'Affordability' && resolvedRole === 'buyer') {
      navigate('/dashboard/buyer/affortability-calculation')
    } else if (label === 'Comparable Sales' && uiVersion === 'v2') {
      // Net-new v2 page, role-agnostic route — no v1 counterpart, so only
      // reachable via nav once v2 is on. See figma-ui-migration-plan.md §9.
      navigate(`/dashboard/${resolvedRole}/comparable-sales`)
    } else if (label === 'Market Intelligence' && resolvedRole === 'agent' && uiVersion === 'v2') {
      navigate('/dashboard/agent/market-intelligence')
    } else if (label === 'Market Insights' && (resolvedRole === 'agent' || resolvedRole === 'valuer') && uiVersion === 'v2') {
      navigate(`/dashboard/${resolvedRole}/market-intelligence`)
    } else if (label === 'Generate Appraisal' && resolvedRole === 'agent') {
      navigate('/dashboard/agent/generate-report')
    } else if (label === 'Clients' && resolvedRole === 'agent') {
      navigate('/dashboard/agent/clients')
    } else if (label === 'Client Reports' && resolvedRole === 'agent') {
      navigate('/dashboard/agent/report')
    } else if (label === 'Evidence Centre' && resolvedRole === 'valuer') {
      navigate('/dashboard/valuer/evidence-centre')
    } else if (label === 'Investment Reports' && resolvedRole === 'investor') {
      navigate('/dashboard/investor/report')
    } else if (label === 'Buyer Reports' && resolvedRole === 'buyer') {
      navigate('/dashboard/buyer/report')
    } else if (label === 'Saved Properties' && resolvedRole === 'buyer') {
      navigate('/dashboard/buyer/saved')
    } else if (label === 'Saved Properties' && (resolvedRole === 'agent' || resolvedRole === 'investor')) {
      navigate(`/dashboard/${resolvedRole}/saved-properties`)
    } else if (label === 'Notifications') {
      navigate(`/dashboard/${resolvedRole}/notifications`)
    } else if (label === 'Generate Report' && resolvedRole === 'agent') {
      navigate('/dashboard/agent/generate-report')
    } else if (label === 'New Valuation' && resolvedRole === 'valuer') {
      navigate('/dashboard/valuer/generate-report')
    } else if (label === 'Generate Report' && resolvedRole === 'investor') {
      navigate('/dashboard/investor/generate-report')
    } else if (label === 'Generate Report' && resolvedRole === 'buyer') {
      navigate('/dashboard/buyer/generate-report')
    } else if (label === 'Watchlist') {
      navigate(`/dashboard/${resolvedRole}/watchlist`)
    } else if (label === 'Market Comparison' && resolvedRole === 'investor') {
      navigate('/dashboard/investor/market-comparison')
    } else if (label === 'Suburb Explorer' && (resolvedRole === 'investor' || resolvedRole === 'buyer')) {
      // figma: App.tsx — "suburb-explorer" and "market" page ids both render the exact
      // same <MarketIntelligencePage/> (SuburbExplorerPage.tsx is imported but never
      // actually routed to by the prototype's own router — dead code). "Suburb Explorer"
      // and "Market Insights" are the same destination under two roles' labels, not two
      // features. Route both to the one shared page.
      navigate(`/dashboard/${resolvedRole}/market-intelligence`)
    } else if (label === 'Compare Properties' && resolvedRole === 'buyer') {
      navigate('/dashboard/buyer/compare-properties')
    } else if (label === 'Inspections' && resolvedRole === 'buyer') {
      navigate('/dashboard/buyer/inspections')
    } else if (label === 'Audit Trail' && resolvedRole === 'valuer') {
      navigate('/dashboard/valuer/audit-trail')
    } else if ((label === 'Explainable AI' || label === 'Confidence Analysis') && resolvedRole === 'valuer') {
      navigate('/dashboard/valuer/explainable-ai')
    } else if (label === 'Team' || label === 'Team Workspace') {
      navigate(`/dashboard/${resolvedRole}/team`)
    } else if (label === 'Timeline' || label === 'Property Timeline') {
      navigate(`/dashboard/${resolvedRole}/timeline`)
    } else if (label === 'Saved Evidence' && resolvedRole === 'valuer') {
      navigate('/dashboard/valuer/saved-evidence')
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

  return {
    navigate,
    pathname,
    user,
    uiVersion,
    userMenuRef,
    availableRoles: availableRoles as RoleOption[],
    collapsed,
    setCollapsed,
    roleOpen,
    setRoleOpen,
    userMenuOpen,
    setUserMenuOpen,
    roleListOpen,
    setRoleListOpen,
    activeNav,
    setActiveNav,
    resolvedRole,
    activeRoleMeta,
    ActiveRoleIcon,
    activeRoleLabel,
    navSections,
    v2NavSections,
    displayName,
    displayEmail,
    userInitials,
    unreadNotificationCount: unreadNotificationCount ?? 0,
    handleRoleChange,
    handleSignOut,
    handleNavigateToSettings,
    handleNavigateToNotifications,
    handleNavigateToWatchlist,
    handleNavigateHome,
    handleNavigatePlatform,
    handleNavChange,
    handleExpandRole,
    handleToggleUserMenu,
  }
}
