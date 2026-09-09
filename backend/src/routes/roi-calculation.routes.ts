// Mounted at /api/investor/roi-calculation.
import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { asyncHandler } from '../middleware/async-handler.js'
import { postRoiCalculation } from '../controllers/roi-calculation.controller.js'

export const roiCalculationRouter = Router()

roiCalculationRouter.post('/', requireAuth, asyncHandler(postRoiCalculation))
