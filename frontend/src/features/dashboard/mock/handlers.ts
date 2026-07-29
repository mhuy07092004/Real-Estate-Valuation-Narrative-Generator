import { agentHandlers } from './agent-handlers'
import { buyerHandlers } from './buyer-handlers'
import { commonHandlers } from './common-handlers'
import { dashboardHandlers as roleDashboardHandlers } from './dashboard-handlers'
import { investorHandlers } from './investor-handlers'
import { valuerHandlers } from './valuer-handlers'

/**
 * All non-auth MSW handlers for dashboard / role / shared feature APIs.
 * Combined with authHandlers in features/auth/mock/browser.ts.
 */
export const dashboardHandlers = [
  ...commonHandlers,
  ...agentHandlers,
  ...buyerHandlers,
  ...investorHandlers,
  ...valuerHandlers,
  ...roleDashboardHandlers,
]
