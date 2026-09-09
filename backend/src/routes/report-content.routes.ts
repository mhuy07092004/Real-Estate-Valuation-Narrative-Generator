// Mounted at /api/appraisal alongside the other appraisal-family routes.
import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { asyncHandler } from '../middleware/async-handler.js'
import {
    getAffordabilityOutlookContent,
    getAgentRecommendationsContent,
    getAppraisalDisclaimerContent,
    getExecutiveSummary,
    getGrowthOutlookContent,
    getNarrativePreview,
    getReportTemplate,
} from '../controllers/report-content.controller.js'

export const reportContentRouter = Router()

reportContentRouter.get('/report-templates', requireAuth, asyncHandler(getReportTemplate))
reportContentRouter.get('/executive-summary', requireAuth, asyncHandler(getExecutiveSummary))
reportContentRouter.get('/narrative-preview', requireAuth, asyncHandler(getNarrativePreview))
reportContentRouter.get('/agent-recommendations', requireAuth, asyncHandler(getAgentRecommendationsContent))
reportContentRouter.get('/growth-outlook', requireAuth, asyncHandler(getGrowthOutlookContent))
reportContentRouter.get('/affordability-outlook', requireAuth, asyncHandler(getAffordabilityOutlookContent))
reportContentRouter.get('/appraisal-disclaimer', requireAuth, asyncHandler(getAppraisalDisclaimerContent))
