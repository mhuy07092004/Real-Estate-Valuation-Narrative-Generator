// Mounted at /api/appraisal alongside the other appraisal-family routes.
import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { asyncHandler } from '../middleware/async-handler.js'
import { getAppraisalSummary } from '../controllers/appraisal-summary.controller.js'

export const appraisalSummaryRouter = Router()

appraisalSummaryRouter.get('/appraisal-summary', requireAuth, asyncHandler(getAppraisalSummary))
