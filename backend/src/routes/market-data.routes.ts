import { Router } from 'express'
import { listComparableSales, listMarketIntelligence } from '../controllers/market-data.controller.js'
import { requireAuth } from '../middleware/require-auth.js'
import { asyncHandler } from '../middleware/async-handler.js'

export const marketDataRouter = Router()

// Read-only market/comparable endpoints sourced from real DB tables.
marketDataRouter.use(requireAuth)
marketDataRouter.get('/comparable-sales', asyncHandler(listComparableSales))
marketDataRouter.get('/market-intelligence', asyncHandler(listMarketIntelligence))
