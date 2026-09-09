// Mounted at /api/buyer/affordability-calculation.
import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { asyncHandler } from '../middleware/async-handler.js'
import { postAffordabilityCalculation } from '../controllers/affordability-calculation.controller.js'

export const affordabilityCalculationRouter = Router()

affordabilityCalculationRouter.post('/', requireAuth, asyncHandler(postAffordabilityCalculation))
