import { Router } from 'express'
import { registrationRouter } from './registration.routes.js'
import { clientRouter } from './client.routes.js'
import { comparableSaleRouter } from './comparable-sale.routes.js'
import { marketInsightsRouter } from './market-insights.routes.js'
import { marketIntelligenceOverviewRouter } from './market-intelligence-overview.routes.js'
import { savedPropertyReadRouter, savedPropertyWriteRouter } from './saved-property.routes.js'
import { inspectionRouter } from './inspection.routes.js'
import { reportRouter } from './report.routes.js'
import { publicReportRouter } from './public-report.routes.js'
import { appraisalContentRouter } from './appraisal-content.routes.js'
import { appraisalSummaryRouter } from './appraisal-summary.routes.js'
import { reportContentRouter } from './report-content.routes.js'
import {
    agentReportsRouter,
    buyerReportsRouter,
    investorReportsRouter,
    valuerCasesRouter,
} from './report-list.routes.js'
import { caseStatusRouter } from './case-status.routes.js'
import { roiCalculationRouter } from './roi-calculation.routes.js'
import { affordabilityCalculationRouter } from './affordability-calculation.routes.js'
import { marketComparisonRouter } from './market-comparison.routes.js'
import { requireAuth } from '../middleware/require-auth.js'
import { requireRole } from '../middleware/require-role.js'

// Central /api router: auth, clients, comparable sales, and market
// intelligence are wired so far — other domains are being rebuilt one at
// a time on top of them.
export const apiRouter = Router()

// Unauthenticated liveness check — used as Render's health check path.
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

apiRouter.use('/auth', registrationRouter)
apiRouter.use('/clients', clientRouter)
apiRouter.use('/appraisal', comparableSaleRouter)
apiRouter.use('/appraisal', marketIntelligenceOverviewRouter)
apiRouter.use('/appraisal', appraisalContentRouter)
apiRouter.use('/appraisal', appraisalSummaryRouter)
apiRouter.use('/appraisal', reportContentRouter)

apiRouter.use('/agent/reports', requireAuth, requireRole('agent'), agentReportsRouter)
apiRouter.use('/buyer/reports', requireAuth, requireRole('buyer'), buyerReportsRouter)
apiRouter.use('/investor/reports', requireAuth, requireRole('investor'), investorReportsRouter)
apiRouter.use('/valuer/cases', requireAuth, requireRole('valuer'), valuerCasesRouter)
apiRouter.use('/valuer/cases', requireAuth, requireRole('valuer'), caseStatusRouter)
apiRouter.use('/investor/roi-calculation', requireAuth, requireRole('investor'), roiCalculationRouter)
apiRouter.use('/investor/market-comparison', requireAuth, requireRole('investor'), marketComparisonRouter)
apiRouter.use('/buyer/affordability-calculation', requireAuth, requireRole('buyer'), affordabilityCalculationRouter)

// One shared handler, mounted at each role's exact expected path — role
// enforced here at the mount point (not inside the shared router itself,
// since the same router serves all four roles depending on which path it's
// reached through).
apiRouter.use('/agent/market-insights', requireAuth, requireRole('agent'), marketInsightsRouter)
apiRouter.use('/valuer/market-insights', requireAuth, requireRole('valuer'), marketInsightsRouter)
apiRouter.use('/buyer/suburb-explorer', requireAuth, requireRole('buyer'), marketInsightsRouter)
apiRouter.use('/investor/suburb-explorer', requireAuth, requireRole('investor'), marketInsightsRouter)

// Same pattern for saved properties — one shared read handler at each
// role's exact expected path, plus one shared write path (not per-role,
// intentionally not role-restricted).
apiRouter.use('/agent/properties/saved', requireAuth, requireRole('agent'), savedPropertyReadRouter)
apiRouter.use('/investor/properties/saved', requireAuth, requireRole('investor'), savedPropertyReadRouter)
apiRouter.use('/buyer/properties/saved', requireAuth, requireRole('buyer'), savedPropertyReadRouter)
apiRouter.use('/valuer/evidence/saved', requireAuth, requireRole('valuer'), savedPropertyReadRouter)
apiRouter.use('/properties/saved', savedPropertyWriteRouter)

apiRouter.use('/buyer/inspections', requireAuth, requireRole('buyer'), inspectionRouter)
apiRouter.use('/reports', reportRouter)
apiRouter.use('/public/reports', publicReportRouter)