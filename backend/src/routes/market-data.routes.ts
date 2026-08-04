import { Router } from 'express'
import { listComparableSales, listMarketIntelligence } from '../controllers/market-data.controller.js'
import { requireAuth } from '../middleware/require-auth.js'

export const marketDataRouter = Router()

// Read-only market/comparable endpoints sourced from real DB tables.
marketDataRouter.use(requireAuth)
marketDataRouter.get('/comparable-sales', listComparableSales)
marketDataRouter.get('/market-intelligence', listMarketIntelligence)
