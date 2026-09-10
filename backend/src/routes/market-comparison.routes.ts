import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { asyncHandler } from '../middleware/async-handler.js'
import { getMarketComparison } from '../controllers/market-comparison.controller.js'

export const marketComparisonRouter = Router()

marketComparisonRouter.get('/', requireAuth, asyncHandler(getMarketComparison))
