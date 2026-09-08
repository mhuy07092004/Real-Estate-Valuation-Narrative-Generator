// HTTP handler for the named-field market data shape, reused across all 4
// role-specific routes (agent/valuer "Market Insights", buyer/investor
// "Suburb Explorer") — they request identical data under different URLs.
// Returns raw JSON directly (no { success, data } envelope), matching the
// other /api/appraisal-family endpoints' contract.
import type { Request, Response } from 'express'
import { getMarketInsightsForSuburb } from '../services/market-intelligence.service.js'

export async function getMarketInsights(req: Request, res: Response) {
  const suburb = typeof req.query.suburb === 'string' ? req.query.suburb : ''

  if (!suburb.trim()) {
    res.json(null)
    return
  }

  const data = await getMarketInsightsForSuburb(suburb)
  res.json(data)
}
