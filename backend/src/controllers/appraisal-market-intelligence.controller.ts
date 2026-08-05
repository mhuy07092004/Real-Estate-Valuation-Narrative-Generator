import type { Request, Response } from 'express'
import { getSuburbOverview, getDemandSignals } from '../services/appraisal-mock-data.service.js'
import { saveMarketIntelligence, DraftNotFoundError } from '../services/appraisal-draft.service.js'

export function getSuburb(_req: Request, res: Response) {
  res.json(getSuburbOverview())
}

export function getDemand(_req: Request, res: Response) {
  res.json(getDemandSignals())
}

export function submitMarketIntelligence(req: Request, res: Response) {
  try {
    const draft = saveMarketIntelligence(req.params.draftId)
    res.json(draft)
  } catch (err) {
    if (err instanceof DraftNotFoundError) {
      res.status(404).json({ error: err.message })
      return
    }
    throw err
  }
}
