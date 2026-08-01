import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { getPropertyInputMethods, getPropertyTypeOptions } from '../services/appraisal-mock-data.service.js'
import { createDraft } from '../services/appraisal-draft.service.js'
import { propertyInputSchema } from '../validators/appraisal.validator.js'
import { formatZodError } from '../utils/zod-error.js'

export function getMethods(_req: Request, res: Response) {
  res.json(getPropertyInputMethods())
}

export function getPropertyTypes(_req: Request, res: Response) {
  res.json(getPropertyTypeOptions())
}

export function submitPropertyInput(req: Request, res: Response) {
  try {
    const input = propertyInputSchema.parse(req.body)
    const draft = createDraft(input)
    res.status(201).json(draft)
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) })
      return
    }
    throw err
  }
}
