// Market Insights / Suburb Explorer endpoint — one handler, mounted at 4
// different full paths in routes/index.ts (agent/valuer "market-insights",
// buyer/investor "suburb-explorer" — all 4 request identical data).
import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { asyncHandler } from '../middleware/async-handler.js'
import { getMarketInsights } from '../controllers/market-insights.controller.js'

export const marketInsightsRouter = Router()

marketInsightsRouter.get('/', requireAuth, asyncHandler(getMarketInsights))
