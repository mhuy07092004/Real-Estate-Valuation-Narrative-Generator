import type { ReactNode } from 'react'
import { useDashboardNavState } from '../../../components/ui/navbar/use-dashboard-nav-state'
import { V2Sidebar } from './v2-sidebar'
import { V2Topbar } from './v2-topbar'
import { V2MobileNav } from './v2-mobile-nav'

type V2DashboardShellProps = {
  children?: ReactNode
}

/**
 * v2-only dashboard shell — matches the figma-protoype_v2 Sidebar/DashboardTopBar/
 * MobileNavigation design. Renders only when the v2 UI toggle is active
 * (see frontend/src/pages/dashboard/index.tsx). Owns no nav-state logic of its
 * own — everything comes from `useDashboardNavState`, shared with the v1 shell.
 */
export function V2DashboardShell({ children }: V2DashboardShellProps) {
  const {
    collapsed,
    setCollapsed,
    availableRoles,
    resolvedRole,
    activeRoleLabel,
    v2NavSections,
    activeNav,
    userMenuRef,
    user,
    userMenuOpen,
    displayName,
    displayEmail,
    userInitials,
    unreadNotificationCount,
    handleRoleChange,
    handleSignOut,
    handleNavigateToSettings,
    handleNavigateToNotifications,
    handleNavigateToWatchlist,
    handleNavigateHome,
    handleNavigatePlatform,
    handleNavChange,
    handleToggleUserMenu,
    navigate,
  } = useDashboardNavState()

  function handleNavigateToSection(section: 'profile' | 'security' | 'help') {
    handleToggleUserMenu()
    navigate(`/dashboard/${resolvedRole}/settings?section=${section}`)
  }

  return (
    <div className="min-h-screen bg-[#EEF3F7]/60">
      <V2Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
        availableRoles={availableRoles}
        resolvedRole={resolvedRole}
        activeRoleLabel={activeRoleLabel}
        onRoleChange={handleRoleChange}
        navSections={v2NavSections}
        activeNav={activeNav}
        onNavChange={handleNavChange}
        onNavigateToSettings={handleNavigateToSettings}
        onSignOut={handleSignOut}
      />

      <div className={['flex min-h-screen flex-col transition-[margin] duration-200', collapsed ? 'md:ml-[76px]' : 'md:ml-[260px]'].join(' ')}>
        <V2Topbar
          userMenuRef={userMenuRef}
          user={user}
          userMenuOpen={userMenuOpen}
          onToggleUserMenu={handleToggleUserMenu}
          resolvedRole={resolvedRole}
          activeRoleLabel={activeRoleLabel}
          displayName={displayName}
          displayEmail={displayEmail}
          userInitials={userInitials}
          onNavigateToNotifications={handleNavigateToNotifications}
          onNavigateToWatchlist={handleNavigateToWatchlist}
          unreadNotificationCount={unreadNotificationCount}
          onSignOut={handleSignOut}
          activeNavLabel={activeNav}
          onNavigateHome={handleNavigateHome}
          onNavigatePlatform={handleNavigatePlatform}
          onNavigateToSection={handleNavigateToSection}
        />

        <main className="min-h-0 flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
      </div>

      <V2MobileNav resolvedRole={resolvedRole} activeNav={activeNav} onNavChange={handleNavChange} />
    </div>
  )
}
