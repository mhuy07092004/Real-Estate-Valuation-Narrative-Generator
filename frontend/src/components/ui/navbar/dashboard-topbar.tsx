import type { RefObject } from 'react'
import { Link } from 'react-router-dom'
import type { DashboardRole } from '../../../features/dashboard/utils/dashboard-role'
import type { User } from '../../../types/auth'
import {
  BellIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  HomeIcon,
  LogOutIcon,
  NavPlaceholderIcon,
  UserIcon,
} from './dashboard-navbar-icons'
import { RoleOptionsList } from './role-options-list'
import type { RoleOption } from './dashboard-navbar.types'

const ACCOUNT_MENU_ITEMS = ['Profile', 'Account Settings', 'Security', 'Help & Support'] as const

type DashboardTopbarProps = {
  userMenuRef: RefObject<HTMLDivElement | null>
  user: User | null
  userMenuOpen: boolean
  onToggleUserMenu: () => void
  roleListOpen: boolean
  onToggleRoleList: () => void
  availableRoles: readonly RoleOption[]
  resolvedRole: DashboardRole
  activeRoleLabel: string
  ActiveRoleIcon: RoleOption['icon']
  onRoleChange: (role: DashboardRole) => void
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
  roleListOpen,
  onToggleRoleList,
  availableRoles,
  resolvedRole,
  activeRoleLabel,
  ActiveRoleIcon,
  onRoleChange,
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
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-black/5 bg-white px-5">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm text-relaive-gray">
        <button type="button" onClick={onNavigateHome} className={breadcrumbLinkClass}>
          <HomeIcon className="h-3.5 w-3.5 shrink-0" />
          Homepage
        </button>
        <ChevronRightIcon />
        {isPlatformHome ? (
          <span className="truncate font-medium text-relaive-navy" aria-current="page">
            Platform
          </span>
        ) : (
          <>
            <button type="button" onClick={onNavigatePlatform} className={breadcrumbLinkClass}>
              Platform
            </button>
            <ChevronRightIcon />
            <span className="truncate font-medium text-relaive-navy" aria-current="page">
              {activeNavLabel}
            </span>
          </>
        )}
      </nav>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label="Notifications"
          onClick={onNavigateToNotifications}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-relaive-gray transition-colors hover:bg-relaive-navy/5 hover:text-relaive-navy"
        >
          <BellIcon />
          {unreadNotificationCount > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-semibold text-white">
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
            onClick={onToggleUserMenu}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-black/40"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-gradient-to-br from-relaive-secondary to-relaive-primary text-xs font-semibold text-white">
              {user ? userInitials : <UserIcon className="text-white" />}
            </span>
            <span className="hidden min-w-0 flex-col leading-tight sm:flex">
              <span className="truncate text-sm font-semibold text-relaive-navy">{displayName}</span>
              <span className="truncate text-xs text-relaive-gray">{activeRoleLabel}</span>
            </span>
          </button>

          {userMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+8px)] z-50 w-[300px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lg"
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
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    aria-expanded={roleListOpen}
                    aria-controls="user-menu-role-accordion"
                    onClick={onToggleRoleList}
                    className="flex w-full items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-left text-sm font-medium text-relaive-navy transition-colors hover:bg-[#F8F9FB]"
                  >
                    <ActiveRoleIcon className="shrink-0 text-relaive-primary" />
                    <span className="min-w-0 flex-1 truncate">{activeRoleLabel}</span>
                    <ChevronDownIcon
                      className={[
                        'shrink-0 text-relaive-gray transition-transform',
                        roleListOpen ? 'rotate-180' : '',
                      ].join(' ')}
                    />
                  </button>

                  {roleListOpen && (
                    <RoleOptionsList
                      id="user-menu-role-accordion"
                      roles={availableRoles}
                      resolvedRole={resolvedRole}
                      onSelect={onRoleChange}
                    />
                  )}
                </div>
              </div>

              <ul className="border-b border-black/5 py-1.5">
                {ACCOUNT_MENU_ITEMS.map((label) => {
                  const itemClassName =
                    'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-relaive-navy transition-colors hover:bg-relaive-navy/5'

                  if (label === 'Account Settings') {
                    return (
                      <li key={label}>
                        <Link
                          to={`/dashboard/${resolvedRole}/settings`}
                          role="menuitem"
                          onClick={onNavigateToSettings}
                          className={itemClassName}
                        >
                          <NavPlaceholderIcon className="shrink-0 text-relaive-gray" />
                          <span>{label}</span>
                        </Link>
                      </li>
                    )
                  }

                  return (
                    <li key={label}>
                      <button type="button" role="menuitem" className={itemClassName}>
                        <NavPlaceholderIcon className="shrink-0 text-relaive-gray" />
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
