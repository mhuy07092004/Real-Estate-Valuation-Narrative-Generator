import { http, HttpResponse } from 'msw'
import type { DashboardRole } from '../utils/dashboard-role'
import { DATA_BY_ROLE } from './dashboard-mock-data'
import { simulateLatency } from './mock-utils'

function isDashboardRole(value: string): value is DashboardRole {
  return value === 'agent' || value === 'valuer' || value === 'buyer' || value === 'investor'
}

export const dashboardHandlers = [
  http.get('/api/dashboard/:role', async ({ params }) => {
    await simulateLatency()

    const role = String(params.role)
    if (!isDashboardRole(role)) {
      return HttpResponse.json({ message: `Unknown dashboard role: ${role}` }, { status: 404 })
    }

    return HttpResponse.json(DATA_BY_ROLE[role])
  }),
]
