import { randomUUID } from 'node:crypto'
import type { NavigationConfig, DemoSession } from '../types/navigation.types.js'

// TODO: swap for a real store (models/) once persistence is wired up.
// In-memory only — resets on restart, won't scale past one process.
const demoSessions = new Map<string, DemoSession>()

export function getNavigationConfig(): NavigationConfig {
  return {
    navItems: [
      { type: 'anchor', label: 'Platform', sectionId: 'platform' },
      { type: 'anchor', label: 'Features', sectionId: 'features' },
      { type: 'anchor', label: 'About', sectionId: 'about' },
      { type: 'anchor', label: 'Resources', sectionId: 'resources' },
    ],
    routeItems: [{ type: 'route', label: 'Plans', href: '/plans' }],
    authButtons: [
      { type: 'route', label: 'Sign in', href: '/signin' },
      { type: 'route', label: 'Sign up', href: '/signup' },
    ],
    heroCtas: [
      { type: 'action', label: 'Start Demo Valuation', action: 'start-demo', variant: 'primary' },
      { type: 'route', label: 'Explore Plans', href: '/plans', variant: 'secondary' },
    ],
  }
}

export function createDemoSession(): DemoSession {
  const sessionId = randomUUID()
  const reportId = randomUUID()
  const session: DemoSession = {
    sessionId,
    reportId,
    status: 'processing',
    createdAt: new Date().toISOString(),
    redirectTo: `/dashboard/demo/${sessionId}`,
  }
  demoSessions.set(sessionId, session)
  return session
}

export function getDemoSession(sessionId: string): DemoSession | undefined {
  return demoSessions.get(sessionId)
}
