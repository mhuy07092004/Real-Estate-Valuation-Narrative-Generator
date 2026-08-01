import { Router } from 'express'
import { getTemplates, getFullDraft, finalizeReport } from '../controllers/appraisal-report.controller.js'

export const appraisalReportRouter = Router()

appraisalReportRouter.get('/report-templates', getTemplates)
appraisalReportRouter.get('/report/:draftId', getFullDraft)
appraisalReportRouter.post('/report/:draftId/finalize', finalizeReport)
