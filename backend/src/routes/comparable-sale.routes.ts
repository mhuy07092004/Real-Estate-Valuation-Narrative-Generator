// Comparable Sale endpoints for the appraisal wizard and the standalone
// search page. Read-only reference data — no create/update/delete — but
// still behind requireAuth since it's only ever reached from inside the
// authenticated dashboard.
import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { asyncHandler } from '../middleware/async-handler.js'
import { listComparableSales, searchComparableSales } from '../controllers/comparable-sale.controller.js'

export const comparableSaleRouter = Router()

comparableSaleRouter.get('/comparable-sales', requireAuth, asyncHandler(listComparableSales))
comparableSaleRouter.get('/comparable-sales/search', requireAuth, asyncHandler(searchComparableSales))
