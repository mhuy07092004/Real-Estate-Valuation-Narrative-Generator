// Appraisal wizard's step-3 Market Intelligence panel endpoint.
import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { asyncHandler } from '../middleware/async-handler.js'
import { getMarketIntelligenceOverview } from '../controllers/market-intelligence-overview.controller.js'

export const marketIntelligenceOverviewRouter = Router()

marketIntelligenceOverviewRouter.get(
  '/market-intelligence-overview',
  requireAuth,
  asyncHandler(getMarketIntelligenceOverview),
)
