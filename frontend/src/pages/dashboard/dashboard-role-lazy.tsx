import { lazy } from 'react'
import { DASHBOARD_ROLES, type DashboardRole } from '../../features/dashboard/utils/dashboard-role'

/**
 * One dynamic import() per role → each role dashboard becomes its own chunk.
 * Only the active role's chunk is fetched on first paint; the rest are
 * preloaded in the background (see `preloadOtherDashboardRoles`).
 */
const ROLE_LOADERS: Record<DashboardRole, () => Promise<{ default: React.ComponentType }>> = {
  agent: () => import('./real-estate-agent/agent-dashboard').then((m) => ({ default: m.AgentDashboard })),
  valuer: () => import('./property-valuer/valuer-dashboard').then((m) => ({ default: m.ValuerDashboard })),
  investor: () => import('./investor/investor-dashboard').then((m) => ({ default: m.InvestorDashboard })),
  buyer: () => import('./buyer/buyer-dashboard').then((m) => ({ default: m.BuyerDashboard })),
}

/** Lazy, code-split components — safe to render inside <Suspense>. */
export const LAZY_ROLE_VIEWS: Record<DashboardRole, React.LazyExoticComponent<React.ComponentType>> = {
  agent: lazy(ROLE_LOADERS.agent),
  valuer: lazy(ROLE_LOADERS.valuer),
  investor: lazy(ROLE_LOADERS.investor),
  buyer: lazy(ROLE_LOADERS.buyer),
}

const preloaded = new Set<DashboardRole>()

/** Warms a role's chunk in the module cache without rendering it. Idempotent. */
export function preloadDashboardRole(role: DashboardRole): void {
  if (preloaded.has(role)) return
  preloaded.add(role)
  void ROLE_LOADERS[role]()
}

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, opts?: { timeout: number }) => number
}

/**
 * Preloads every role dashboard except `activeRole` once the browser is idle
 * (falls back to a short timeout on browsers without requestIdleCallback,
 * e.g. Safari). Keeps first load lean while making role switches instant.
 */
export function preloadOtherDashboardRoles(activeRole: DashboardRole): void {
  const schedule = (callback: () => void) => {
    const idleWindow = window as IdleWindow
    if (typeof idleWindow.requestIdleCallback === 'function') {
      idleWindow.requestIdleCallback(callback, { timeout: 2000 })
    } else {
      setTimeout(callback, 300)
    }
  }

  schedule(() => {
    DASHBOARD_ROLES.filter((role) => role !== activeRole).forEach((role) => preloadDashboardRole(role))
  })
}
