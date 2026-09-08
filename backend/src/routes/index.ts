import { Router } from 'express'
import { registrationRouter } from './registration.routes.js'
import { clientRouter } from './client.routes.js'
import { comparableSaleRouter } from './comparable-sale.routes.js'
import { marketInsightsRouter } from './market-insights.routes.js'
import { marketIntelligenceOverviewRouter } from './market-intelligence-overview.routes.js'

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

// One shared handler, mounted at each role's exact expected path.
apiRouter.use('/agent/market-insights', marketInsightsRouter)
apiRouter.use('/valuer/market-insights', marketInsightsRouter)
apiRouter.use('/buyer/suburb-explorer', marketInsightsRouter)
apiRouter.use('/investor/suburb-explorer', marketInsightsRouter)