import logoIcon from '../../../assets/icon.svg'
import { useMediaQuery } from '../../../hooks/use-media-query'
import type { DashboardRole } from '../../../features/dashboard/utils/dashboard-role'
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  LogOutIcon,
  SettingsIcon,
} from './dashboard-navbar-icons'
import { RoleOptionsList } from './role-options-list'
import type { RoleOption, SidebarNavSection } from './dashboard-navbar.types'

const BOTTOM_NAV_ITEMS = ['Settings'] as const

type DashboardSidebarProps = {
  collapsed: boolean
  onToggleCollapsed: () => void
  roleOpen: boolean
  onExpandRole: () => void
  availableRoles: readonly RoleOption[]
  resolvedRole: DashboardRole
  activeRoleLabel: string
  ActiveRoleIcon: RoleOption['icon']
  onRoleChange: (role: DashboardRole) => void
  navSections: SidebarNavSection[]
  activeNav: string
  onNavChange: (label: string, to?: string) => void
  onSignOut: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function DashboardSidebar({
  collapsed: collapsedProp,
  onToggleCollapsed,
  roleOpen,
  onExpandRole,
  availableRoles,
  resolvedRole,
  activeRoleLabel,
  ActiveRoleIcon,
  onRoleChange,
  navSections,
  activeNav,
  onNavChange,
  onSignOut,
  mobileOpen,
  onCloseMobile,
}: DashboardSidebarProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  // The drawer (below lg) is always rendered expanded.
  const collapsed = collapsedProp && isDesktop

  function handleNav(label: string, to?: string) {
    onNavChange(label, to)
    onCloseMobile()
  }

  function handleRole(role: DashboardRole) {
    onRoleChange(role)
    onCloseMobile()
  }

  function handleSignOut() {
    onCloseMobile()
    onSignOut()
  }

  return (
    <>
    {mobileOpen && (
      <div
        className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        aria-hidden="true"
        onClick={onCloseMobile}
      />
    )}
    <aside
      aria-label="Dashboard navigation"
      className={[
        'fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(85vw,20rem)] shrink-0 flex-col border-r border-black/5 bg-white transition-[transform,width] duration-200',
        'lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0',
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
        collapsed ? 'lg:w-(--dash-sidebar-collapsed)' : 'lg:w-(--dash-sidebar)',
      ].join(' ')}
    >
      <div
        className={[
          'flex border-b border-black/5',
          collapsed
            ? 'flex-col items-center gap-2 px-2 py-[var(--dash-pad-y)]'
            : 'items-start gap-2 px-[var(--dash-pad-x)] py-[var(--dash-pad-y)]',
        ].join(' ')}
      >
        <a
          href="/"
          className={['flex min-w-0 items-center gap-2.5', collapsed ? 'justify-center' : 'flex-1'].join(' ')}
        >
          <img
            src={logoIcon}
            alt="Relaive icon"
            className="h-(--dash-logo) w-(--dash-logo) shrink-0"
          />
          {!collapsed && (
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="font-logo text-lg font-bold tracking-tight text-relaive-navy 3xl:text-xl">
                Relaive
              </span>
              <span className="truncate text-[clamp(0.625rem,0.5rem+0.12vw,0.75rem)] text-relaive-gray">
                Real-estate AI Evaluation
              </span>
            </div>
          )}
        </a>
        <button
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggleCollapsed}
          className="hidden size-8 shrink-0 items-center justify-center rounded-md text-relaive-gray transition-colors hover:bg-relaive-navy/5 hover:text-relaive-navy lg:flex 3xl:size-9"
        >
          <ChevronLeftIcon className={collapsed ? 'rotate-180' : ''} />
        </button>
        <button
          type="button"
          aria-label="Close menu"
          onClick={onCloseMobile}
          className="flex size-10 shrink-0 items-center justify-center rounded-md text-relaive-gray transition-colors hover:bg-relaive-navy/5 hover:text-relaive-navy lg:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div
        className={[
          'border-b border-black/5 py-[var(--dash-pad-y)]',
          collapsed ? 'px-2' : 'px-[var(--dash-pad-x)]',
        ].join(' ')}
      >
        <div className="flex flex-col gap-2">
          <button
            type="button"
            aria-expanded={roleOpen}
            aria-controls="dashboard-role-accordion"
            onClick={onExpandRole}
            className={[
              'flex w-full items-center gap-2 rounded-xl border border-black/10 bg-white text-left text-[length:var(--dash-nav)] font-medium text-relaive-navy transition-colors hover:bg-[#F8F9FB]',
              collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5 3xl:py-3',
            ].join(' ')}
          >
            <ActiveRoleIcon className="size-(--dash-icon) shrink-0 text-relaive-primary" />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 truncate">{activeRoleLabel}</span>
                <ChevronDownIcon
                  className={[
                    'shrink-0 text-relaive-gray transition-transform',
                    roleOpen ? 'rotate-180' : '',
                  ].join(' ')}
                />
              </>
            )}
          </button>

          {roleOpen && !collapsed && (
            <RoleOptionsList
              id="dashboard-role-accordion"
              roles={availableRoles}
              resolvedRole={resolvedRole}
              onSelect={handleRole}
            />
          )}
        </div>
      </div>

      <nav
        className={[
          'flex-1 overflow-y-auto py-[var(--dash-pad-y)]',
          collapsed ? 'px-2' : 'px-[var(--dash-pad-x)]',
        ].join(' ')}
      >
        {navSections.map((section, sectionIndex) => (
          <div
            key={section.title}
            className={sectionIndex > 0 ? (collapsed ? 'mt-2' : 'mt-4 3xl:mt-5') : undefined}
          >
            {!collapsed && (
              <p className="px-3 pb-1.5 pt-1 text-[clamp(0.6875rem,0.6rem+0.12vw,0.8125rem)] font-semibold uppercase tracking-wide text-relaive-gray/60">
                {section.title}
              </p>
            )}
            <ul className="flex flex-col gap-0.5 3xl:gap-1">
              {section.items.map((item) => {
                const active = item.label === activeNav
                const Icon = item.icon
                return (
                  <li key={item.label}>
                    <a
                      href="#"
                      onClick={(event) => {
                        event.preventDefault()
                        handleNav(item.label, item.to)
                      }}
                      aria-current={active ? 'page' : undefined}
                      title={collapsed ? item.label : undefined}
                      className={[
                        'flex items-center gap-2.5 text-[length:var(--dash-nav)] transition-all 3xl:gap-3',
                        collapsed ? 'justify-center px-2 py-2' : 'px-3.5 py-2.5 3xl:py-3',
                        active
                          ? 'rounded-full bg-gradient-to-r from-[#5D8CAE] to-[#86C5C9] font-medium text-white shadow-[0_4px_14px_rgba(93,140,174,0.35)]'
                          : 'rounded-xl font-medium text-relaive-gray hover:bg-relaive-navy/[0.04] hover:text-relaive-navy',
                      ].join(' ')}
                    >
                      <Icon className="size-(--dash-icon) shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div
        className={[
          'shrink-0 border-t border-black/5 py-[var(--dash-pad-y)]',
          collapsed ? 'px-2' : 'px-[var(--dash-pad-x)]',
        ].join(' ')}
      >
        <ul className="flex flex-col gap-0.5 3xl:gap-1">
          {BOTTOM_NAV_ITEMS.map((label) => {
            const active = label === activeNav
            return (
              <li key={label}>
                <a
                  href="#"
                  onClick={(event) => {
                    event.preventDefault()
                    handleNav(label)
                  }}
                  aria-current={active ? 'page' : undefined}
                  title={collapsed ? label : undefined}
                  className={[
                    'flex items-center gap-2.5 text-[length:var(--dash-nav)] transition-all 3xl:gap-3',
                    collapsed ? 'justify-center px-2 py-2' : 'px-3.5 py-2.5 3xl:py-3',
                    active
                      ? 'rounded-full bg-gradient-to-r from-[#5D8CAE] to-[#86C5C9] font-medium text-white shadow-[0_4px_14px_rgba(93,140,174,0.35)]'
                      : 'rounded-xl font-medium text-relaive-gray hover:bg-relaive-navy/[0.04] hover:text-relaive-navy',
                  ].join(' ')}
                >
                  <SettingsIcon className="size-(--dash-icon) shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </a>
              </li>
            )
          })}
          <li>
            <button
              type="button"
              onClick={handleSignOut}
              title={collapsed ? 'Sign Out' : undefined}
              className={[
                'flex w-full items-center gap-2.5 text-[length:var(--dash-nav)] font-semibold text-red-600 transition-all hover:bg-red-50 hover:text-red-700 3xl:gap-3',
                collapsed ? 'justify-center rounded-xl px-2 py-2' : 'rounded-xl px-3.5 py-2.5 3xl:py-3',
              ].join(' ')}
            >
              <LogOutIcon className="size-(--dash-icon) shrink-0 text-red-600" />
              {!collapsed && <span className="truncate">Sign Out</span>}
            </button>
          </li>
        </ul>
      </div>
    </aside>
    </>
  )
}
