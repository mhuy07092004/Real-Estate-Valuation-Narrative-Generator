import { Router } from 'express'
import { getMetrics, getSummary, submitAiAnalysis } from '../controllers/appraisal-ai-analysis.controller.js'

export const aiAnalysisRouter = Router()

aiAnalysisRouter.get('/ai-analysis-metrics', getMetrics)
aiAnalysisRouter.get('/ai-analysis-summary', getSummary)
aiAnalysisRouter.post('/ai-analysis/:draftId', submitAiAnalysis)
