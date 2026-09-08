// HTTP handler for the appraisal wizard's step-3 Market Intelligence panel.
// Subject suburb is derived from the single free-text address query param
// (withAppraisalContext), same limitation and same parsing approach as
// comparable-sale.controller.ts. Returns raw JSON directly, no envelope.
import type { Request, Response } from 'express'
import { getMarketIntelligenceOverviewForSuburb } from '../services/market-intelligence.service.js'

function extractSuburbAndState(address: string): { suburb: string; state: string } | null {
  const match = address.trim().match(/^(?:\d+\s+[^,]+),\s*([^,]+)\s+([A-Za-z]{2,3})\s+(\d{4})$/)
  return match ? { suburb: match[1].trim(), state: match[2].trim().toUpperCase() } : null
}

export async function getMarketIntelligenceOverview(req: Request, res: Response) {
  const address = String(req.query.address ?? '')
  const parsed = extractSuburbAndState(address)

  if (!parsed) {
    res.json({ suburbLabel: address, stats: [], priceTrend: [] })
    return
  }

  const data = await getMarketIntelligenceOverviewForSuburb(parsed.suburb, parsed.state)
  res.json(data)
}
