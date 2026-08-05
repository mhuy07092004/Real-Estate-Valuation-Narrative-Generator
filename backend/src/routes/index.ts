import { Router } from 'express'
import { aiAnalysisRouter } from './appraisal-ai-analysis.routes.js'
import { comparablesRouter } from './appraisal-comparables.routes.js'
import { marketIntelligenceRouter } from './appraisal-market-intelligence.routes.js'
import { propertyInputRouter } from './appraisal-property-input.routes.js'
import { appraisalReportRouter } from './appraisal-report.routes.js'
import { appraisalStepsRouter } from './appraisal-steps.routes.js'
import { contentRouter } from './content.routes.js'
import { navigationRouter } from './navigation.routes.js'
import { registrationRouter } from './registration.routes.js'
import { reportRouter } from './report.routes.js'

export const apiRouter = Router()

apiRouter.use('/content', contentRouter)
apiRouter.use('/navigation', navigationRouter)
apiRouter.use('/auth', registrationRouter)
apiRouter.use('/reports', reportRouter)

// Generate Appraisal wizard (5 steps) — one router FILE per step (per
// senior's ask), but all mounted at the same flat /api/appraisal base,
// since that's the exact path shape frontend/src/services/common.ts
// fetches (e.g. /api/appraisal/comparable-sales, not a nested
// /api/appraisal/comparables/... prefix).
apiRouter.use('/appraisal', appraisalStepsRouter)
apiRouter.use('/appraisal', propertyInputRouter)
apiRouter.use('/appraisal', aiAnalysisRouter)
apiRouter.use('/appraisal', comparablesRouter)
apiRouter.use('/appraisal', marketIntelligenceRouter)
apiRouter.use('/appraisal', appraisalReportRouter)