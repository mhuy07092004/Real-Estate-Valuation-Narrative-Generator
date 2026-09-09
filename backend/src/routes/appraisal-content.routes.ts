// Static wizard-chrome endpoints — steps and property types — mounted at
// /api/appraisal alongside comparable-sales and market-intelligence-overview.
import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { asyncHandler } from '../middleware/async-handler.js'
import { getAppraisalSteps, getPropertyTypeOptions } from '../controllers/appraisal-content.controller.js'

export const appraisalContentRouter = Router()

appraisalContentRouter.get('/steps', requireAuth, asyncHandler(getAppraisalSteps))
appraisalContentRouter.get('/property-types', requireAuth, asyncHandler(getPropertyTypeOptions))
