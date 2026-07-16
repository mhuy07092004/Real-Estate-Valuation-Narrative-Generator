import type { Request, Response } from 'express'
import { getHomepageContent } from '../services/content.service.js'

export function getHomepage(_req: Request, res: Response) {
  res.json(getHomepageContent())
}
