import type { RefObject } from 'react'
import { Link } from 'react-router-dom'
import type { DashboardRole } from '../../../features/dashboard/utils/dashboard-role'
import type { User } from '../../../types/auth'
import {
  BellIcon,
  ChevronRightIcon,
  HelpCircleIcon,
  HomeIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from './dashboard-navbar-icons'

const ACCOUNT_MENU_ITEMS = [
  { label: 'Account Settings', icon: SettingsIcon, to: 'settings' },
  { label: 'Help & Support', icon: HelpCircleIcon },
] as const

type DashboardTopbarProps = {
  userMenuRef: RefObject<HTMLDivElement | null>
  user: User | null
  userMenuOpen: boolean
  onToggleUserMenu: () => void
  resolvedRole: DashboardRole
  activeRoleLabel: string
  displayName: string
  displayEmail: string
  userInitials: string
  onNavigateToSettings: () => void
  onNavigateToNotifications: () => void
  unreadNotificationCount: number
  onSignOut: () => void
  activeNavLabel: string
  onNavigateHome: () => void
  onNavigatePlatform: () => void
}

export function DashboardTopbar({
  userMenuRef,
  user,
  userMenuOpen,
  onToggleUserMenu,
  resolvedRole,
  activeRoleLabel,
  displayName,
  displayEmail,
  userInitials,
  onNavigateToSettings,
  onNavigateToNotifications,
  unreadNotificationCount,
  onSignOut,
  activeNavLabel,
  onNavigateHome,
  onNavigatePlatform,
}: DashboardTopbarProps) {
  const isPlatformHome = activeNavLabel === 'Dashboard'
  const breadcrumbLinkClass =
    'inline-flex items-center gap-1.5 rounded-md transition-colors hover:text-relaive-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary/40'

  return (
    <header className="sticky top-0 z-40 flex h-(--dash-topbar) items-center justify-between overflow-visible border-b border-black/5 bg-white px-[clamp(1.25rem,1rem+0.8vw,2rem)]">
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 items-center gap-2 text-[length:var(--dash-nav)] text-relaive-gray 3xl:gap-2.5"
      >
        <button type="button" onClick={onNavigateHome} className={breadcrumbLinkClass}>
          <HomeIcon className="size-(--dash-icon) shrink-0" />
          Homepage
        </button>
        <ChevronRightIcon />
        {isPlatformHome ? (
          <span className="truncate font-medium text-relaive-navy" aria-current="page">
            Dashboard
          </span>
        ) : (
          <>
            <button type="button" onClick={onNavigatePlatform} className={breadcrumbLinkClass}>
              Dashboard
            </button>
            <ChevronRightIcon />
            <span className="truncate font-medium text-relaive-navy" aria-current="page">
              {activeNavLabel}
            </span>
          </>
        )}
      </nav>

      <div className="flex items-center gap-2.5 overflow-visible 3xl:gap-3">
        <button
          type="button"
          aria-label="Notifications"
          onClick={onNavigateToNotifications}
          className="relative flex size-9 items-center justify-center rounded-lg text-relaive-gray transition-colors hover:bg-relaive-navy/5 hover:text-relaive-navy 3xl:size-10"
        >
          <BellIcon className="size-(--dash-icon)" />
          {unreadNotificationCount > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[clamp(0.625rem,0.5rem+0.1vw,0.75rem)] font-semibold text-white">
              {unreadNotificationCount}
            </span>
          ) : null}
        </button>

        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            aria-label="User profile"
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={onToggleUserMenu}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-relaive-navy/5 3xl:gap-3 3xl:px-2.5"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-gradient-to-br from-relaive-secondary to-relaive-primary text-[length:var(--dash-nav)] font-semibold text-white 3xl:size-10">
              {user ? userInitials : <UserIcon className="text-white" />}
            </span>
            <span className="hidden min-w-0 flex-col leading-tight sm:flex">
              <span className="truncate text-[length:var(--dash-nav)] font-semibold text-relaive-navy">
                {displayName}
              </span>
              <span className="truncate text-[clamp(0.6875rem,0.6rem+0.1vw,0.8125rem)] text-relaive-gray">
                {activeRoleLabel}
              </span>
            </span>
          </button>

          {userMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+8px)] z-50 w-[clamp(18.75rem,22vw,22.5rem)] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lg"
            >
              <div className="flex items-center gap-3 border-b border-black/5 px-4 py-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-relaive-secondary to-relaive-primary text-sm font-semibold text-white">
                  {userInitials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-relaive-navy">
                    {user?.fullName ?? displayName}
                  </p>
                  <p className="truncate text-xs text-relaive-gray">{displayEmail}</p>
                </div>
              </div>

              <div className="border-b border-black/5 px-4 py-3">
                <div className="rounded-xl bg-[#F5F6F8] px-3.5 py-3">
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-relaive-gray">
                    Current Role
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-relaive-navy">
                    {activeRoleLabel}
                  </p>
                </div>
              </div>

              <ul className="border-b border-black/5 py-1.5">
                {ACCOUNT_MENU_ITEMS.map(({ label, icon: Icon, ...item }) => {
                  const itemClassName =
                    'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-relaive-navy transition-colors hover:bg-relaive-navy/5'

                  if ('to' in item && item.to === 'settings') {
                    return (
                      <li key={label}>
                        <Link
                          to={`/dashboard/${resolvedRole}/settings`}
                          role="menuitem"
                          onClick={onNavigateToSettings}
                          className={itemClassName}
                        >
                          <Icon className="shrink-0 text-relaive-gray" />
                          <span>{label}</span>
                        </Link>
                      </li>
                    )
                  }

                  return (
                    <li key={label}>
                      <button type="button" role="menuitem" className={itemClassName}>
                        <Icon className="shrink-0 text-relaive-gray" />
                        <span>{label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>

              <div className="py-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={onSignOut}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  <LogOutIcon className="shrink-0 text-red-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
