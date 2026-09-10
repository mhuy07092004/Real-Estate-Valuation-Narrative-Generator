import type { Request, Response } from 'express'
import { getMarketComparisonSuburbs } from '../services/market-comparison.service.js'

export async function getMarketComparison(_req: Request, res: Response) {
  const data = await getMarketComparisonSuburbs()
  res.json(data)
}
