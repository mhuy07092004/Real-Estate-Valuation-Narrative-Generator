import { Router } from 'express'
import { registrationRouter } from './registration.routes.js'
import { clientRouter } from './client.routes.js'
import { comparableSaleRouter } from './comparable-sale.routes.js'
import { marketInsightsRouter } from './market-insights.routes.js'
import { marketIntelligenceOverviewRouter } from './market-intelligence-overview.routes.js'
import { savedPropertyReadRouter, savedPropertyWriteRouter } from './saved-property.routes.js'
import { inspectionRouter } from './inspection.routes.js'
import { reportRouter } from './report.routes.js'
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

apiRouter.use('/agent/reports', agentReportsRouter)
apiRouter.use('/buyer/reports', buyerReportsRouter)
apiRouter.use('/investor/reports', investorReportsRouter)
apiRouter.use('/valuer/cases', valuerCasesRouter)
apiRouter.use('/valuer/cases', caseStatusRouter)
apiRouter.use('/investor/roi-calculation', roiCalculationRouter)
apiRouter.use('/investor/market-comparison', marketComparisonRouter)
apiRouter.use('/buyer/affordability-calculation', affordabilityCalculationRouter)

// One shared handler, mounted at each role's exact expected path.
apiRouter.use('/agent/market-insights', marketInsightsRouter)
apiRouter.use('/valuer/market-insights', marketInsightsRouter)
apiRouter.use('/buyer/suburb-explorer', marketInsightsRouter)
apiRouter.use('/investor/suburb-explorer', marketInsightsRouter)

// Same pattern for saved properties — one shared read handler at each
// role's exact expected path, plus one shared write path (not per-role).
apiRouter.use('/agent/properties/saved', savedPropertyReadRouter)
apiRouter.use('/investor/properties/saved', savedPropertyReadRouter)
apiRouter.use('/buyer/properties/saved', savedPropertyReadRouter)
apiRouter.use('/valuer/evidence/saved', savedPropertyReadRouter)
apiRouter.use('/properties/saved', savedPropertyWriteRouter)

apiRouter.use('/buyer/inspections', inspectionRouter)
apiRouter.use('/reports', reportRouter)