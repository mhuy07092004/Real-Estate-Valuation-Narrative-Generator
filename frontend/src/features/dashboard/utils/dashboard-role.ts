import type { UserRole } from '../../../types/auth'

const STORAGE_KEY = 'relaive_dashboard_role'

export const DASHBOARD_ROLES = ['agent', 'valuer', 'investor', 'buyer'] as const

export type DashboardRole = (typeof DASHBOARD_ROLES)[number]

export function isDashboardRole(value: string): value is DashboardRole {
  return (DASHBOARD_ROLES as readonly string[]).includes(value)
}

/**
 * Page header title for the shared `/dashboard/:role/report` page. Kept in
 * sync with (but separate from) the sidebar labels in
 * `ui/navbar/dashboard-navbar.tsx` — this map does not drive the sidebar.
 */
export const REPORT_PAGE_TITLE: Record<DashboardRole, string> = {
  agent: 'Client Report',
  valuer: 'Reports',
  investor: 'Investor Report',
  buyer: 'Buyer Report',
}

export function getActiveDashboardRole(): DashboardRole | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw || !isDashboardRole(raw)) return null
  return raw
}

/** Only call from the navbar role switcher (or first-time redirect init). */
export function setActiveDashboardRole(role: DashboardRole): void {
  sessionStorage.setItem(STORAGE_KEY, role)
}

export function clearActiveDashboardRole(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function getDefaultDashboardRole(userRoles: UserRole[]): DashboardRole | null {
  return DASHBOARD_ROLES.find((role) => userRoles.includes(role)) ?? null
}

export function resolveDashboardRole(
  userRoles: UserRole[],
  requested?: string | null,
): DashboardRole | null {
  const active = getActiveDashboardRole()
  if (active && userRoles.includes(active)) return active

  if (requested && isDashboardRole(requested) && userRoles.includes(requested)) {
    return requested
  }

  return getDefaultDashboardRole(userRoles)
}
