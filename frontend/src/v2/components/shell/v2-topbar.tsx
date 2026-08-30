import type { RefObject } from 'react'
import type { DashboardRole } from '../../../features/dashboard/utils/dashboard-role'
import type { User } from '../../../types/auth'
import {
  BellIcon,
  BookmarkIcon,
  ChevronRightIcon,
  HomeIcon,
  LogOutIcon,
  NavPlaceholderIcon,
  UserIcon,
} from '../../../components/ui/navbar/dashboard-navbar-icons'

const ROLE_COLOR: Record<DashboardRole, string> = {
  agent: '#5193B3',
  valuer: '#62C4C3',
  investor: '#FBD49B',
  buyer: '#5193B3',
}

const ACCOUNT_MENU_ITEMS = [
  { label: 'Profile', section: 'profile' },
  { label: 'Security', section: 'security' },
  { label: 'Help & Support', section: 'help' },
] as const

type V2TopbarProps = {
  userMenuRef: RefObject<HTMLDivElement | null>
  user: User | null
  userMenuOpen: boolean
  onToggleUserMenu: () => void
  resolvedRole: DashboardRole
  activeRoleLabel: string
  displayName: string
  displayEmail: string
  userInitials: string
  onNavigateToNotifications: () => void
  onNavigateToWatchlist: () => void
  unreadNotificationCount: number
  watchlistCount?: number
  onSignOut: () => void
  activeNavLabel: string
  onNavigateHome: () => void
  onNavigatePlatform: () => void
  onNavigateToSection: (section: 'profile' | 'security' | 'help') => void
}

export function V2Topbar({
  userMenuRef,
  user,
  userMenuOpen,
  onToggleUserMenu,
  resolvedRole,
  activeRoleLabel,
  displayName,
  displayEmail,
  userInitials,
  onNavigateToNotifications,
  onNavigateToWatchlist,
  unreadNotificationCount,
  watchlistCount = 0,
  onSignOut,
  activeNavLabel,
  onNavigateHome,
  onNavigatePlatform,
  onNavigateToSection,
}: V2TopbarProps) {
  const isPlatformHome = activeNavLabel === 'Dashboard'
  const breadcrumbLinkClass =
    'inline-flex items-center gap-1.5 rounded-md text-[#1C2A38]/50 transition-colors hover:text-[#5193B3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5193B3]/40'

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-[#5193B3]/10 bg-white/95 px-6 backdrop-blur-xl">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
        <button type="button" onClick={onNavigateHome} className={breadcrumbLinkClass}>
          <HomeIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Homepage</span>
        </button>
        <ChevronRightIcon />
        {isPlatformHome ? (
          <span className="truncate font-medium text-[#102132]" aria-current="page">
            Dashboard
          </span>
        ) : (
          <>
            <button type="button" onClick={onNavigatePlatform} className={breadcrumbLinkClass}>
              Dashboard
            </button>
            <ChevronRightIcon />
            <span className="truncate font-medium text-[#102132]" aria-current="page">
              {activeNavLabel}
            </span>
          </>
        )}
      </nav>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label="Notifications"
          onClick={onNavigateToNotifications}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[#1C2A38]/60 transition-colors hover:bg-[#EEF3F7]"
          title="Notifications"
        >
          <BellIcon style={{ width: 18, height: 18 }} />
          {unreadNotificationCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#5193B3] text-[9px] font-medium leading-none text-white">
              {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
            </span>
          )}
        </button>

        <button
          type="button"
          aria-label="Watchlist"
          onClick={onNavigateToWatchlist}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[#1C2A38]/60 transition-colors hover:bg-[#EEF3F7]"
          title="Watchlist"
        >
          <BookmarkIcon style={{ width: 17, height: 17 }} />
          {watchlistCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#62C4C3] text-[9px] font-medium leading-none text-white">
              {watchlistCount > 9 ? '9+' : watchlistCount}
            </span>
          )}
        </button>

        <div ref={userMenuRef} className="relative ml-1">
          <button
            type="button"
            aria-label="User profile"
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            onClick={onToggleUserMenu}
            className="flex h-9 items-center gap-2 rounded-xl py-1.5 pl-1 pr-2 text-left transition-colors hover:bg-black/5"
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${ROLE_COLOR[resolvedRole]}, #62C4C3)` }}
            >
              {user ? userInitials : <UserIcon className="text-white" />}
            </span>
            <span className="hidden min-w-0 flex-col text-left leading-tight md:flex">
              <span className="truncate text-xs font-medium text-[#102132]">{displayName}</span>
              <span className="truncate text-[10px] text-[#1C2A38]/50">{activeRoleLabel}</span>
            </span>
          </button>

          {userMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-2xl border border-[#5193B3]/10 bg-white shadow-xl shadow-[#102132]/10"
            >
              <div className="border-b border-[#EEF3F7] px-4 pb-3 pt-4">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
                    style={{ background: `linear-gradient(135deg, ${ROLE_COLOR[resolvedRole]}, #62C4C3)` }}
                  >
                    {userInitials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#102132]">{user?.fullName ?? displayName}</p>
                    <p className="truncate text-xs text-[#1C2A38]/50">{displayEmail}</p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl bg-[#EEF3F7] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-[#1C2A38]/50">Current Role</p>
                  <p className="text-xs font-medium text-[#102132]">{activeRoleLabel}</p>
                </div>
              </div>

              <ul className="border-b border-[#EEF3F7] p-2">
                {ACCOUNT_MENU_ITEMS.map(({ label, section }) => (
                  <li key={label}>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => onNavigateToSection(section)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[#102132] transition-colors hover:bg-[#EEF3F7]"
                    >
                      <NavPlaceholderIcon className="shrink-0 text-[#5193B3]" />
                      <span>{label}</span>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="p-2">
                <button
                  type="button"
                  role="menuitem"
                  onClick={onSignOut}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-red-50"
                >
                  <LogOutIcon className="shrink-0 text-[#1C2A38]/40 group-hover:text-red-500" />
                  <span className="text-sm text-[#1C2A38]/60 group-hover:text-red-500">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
