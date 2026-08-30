import type { ReactNode } from 'react'
import { useDashboardNavState } from './use-dashboard-nav-state'
import { DashboardSidebar } from './dashboard-sidebar'
import { DashboardTopbar } from './dashboard-topbar'

type DashboardNavbarProps = {
  children?: ReactNode
}

export function DashboardNavbar({ children }: DashboardNavbarProps) {
  const {
    userMenuRef,
    availableRoles,
    collapsed,
    setCollapsed,
    roleOpen,
    userMenuOpen,
    roleListOpen,
    setRoleListOpen,
    activeNav,
    resolvedRole,
    ActiveRoleIcon,
    activeRoleLabel,
    navSections,
    user,
    displayName,
    displayEmail,
    userInitials,
    unreadNotificationCount,
    handleRoleChange,
    handleSignOut,
    handleNavigateToSettings,
    handleNavigateToNotifications,
    handleNavigateHome,
    handleNavigatePlatform,
    handleNavChange,
    handleExpandRole,
    handleToggleUserMenu,
  } = useDashboardNavState()

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
          unreadNotificationCount={unreadNotificationCount}
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
