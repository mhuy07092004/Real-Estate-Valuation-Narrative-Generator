import type { Request, Response } from 'express'
import { getAppraisalSteps } from '../services/appraisal-mock-data.service.js'

export function getSteps(_req: Request, res: Response) {
  res.json(getAppraisalSteps())
}
