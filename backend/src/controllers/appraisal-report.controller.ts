import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { getReportTemplates } from '../services/appraisal-mock-data.service.js'
import { finalizeDraft, getDraft, DraftNotFoundError } from '../services/appraisal-draft.service.js'
import { finalizeReportSchema } from '../validators/appraisal.validator.js'
import { formatZodError } from '../utils/zod-error.js'

export function getTemplates(_req: Request, res: Response) {
  res.json(getReportTemplates())
}

export function getFullDraft(req: Request, res: Response) {
  try {
    res.json(getDraft(req.params.draftId))
  } catch (err) {
    if (err instanceof DraftNotFoundError) {
      res.status(404).json({ error: err.message })
      return
    }
    throw err
  }
}

export function finalizeReport(req: Request, res: Response) {
  try {
    const { reportTemplateId } = finalizeReportSchema.parse(req.body)
    const draft = finalizeDraft(req.params.draftId, reportTemplateId)
    res.json(draft)
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) })
      return
    }
    if (err instanceof DraftNotFoundError) {
      res.status(404).json({ error: err.message })
      return
    }
    throw err
  }
}
