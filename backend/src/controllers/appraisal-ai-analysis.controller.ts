import type { Request, Response } from 'express'
import { getAiAnalysisMetrics, getAiAnalysisSummaryNotification } from '../services/appraisal-mock-data.service.js'
import { saveAiAnalysis, DraftNotFoundError } from '../services/appraisal-draft.service.js'

export function getMetrics(_req: Request, res: Response) {
  res.json(getAiAnalysisMetrics())
}

export function getSummary(_req: Request, res: Response) {
  res.json(getAiAnalysisSummaryNotification())
}

export function submitAiAnalysis(req: Request, res: Response) {
  try {
    const draft = saveAiAnalysis(req.params.draftId)
    res.json(draft)
  } catch (err) {
    if (err instanceof DraftNotFoundError) {
      res.status(404).json({ error: err.message })
      return
    }
    throw err
  }
}
