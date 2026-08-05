import type { Request, Response } from 'express'
import { getComparableSales } from '../services/appraisal-mock-data.service.js'
import { saveComparables, DraftNotFoundError } from '../services/appraisal-draft.service.js'

export function getComparables(_req: Request, res: Response) {
  res.json(getComparableSales())
}

export function submitComparables(req: Request, res: Response) {
  try {
    const draft = saveComparables(req.params.draftId)
    res.json(draft)
  } catch (err) {
    if (err instanceof DraftNotFoundError) {
      res.status(404).json({ error: err.message })
      return
    }
    throw err
  }
}
