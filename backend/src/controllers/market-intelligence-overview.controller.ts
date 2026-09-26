// HTTP handler for the appraisal wizard's step-3 Market Intelligence panel.
// Subject suburb is derived from the single free-text address query param
// (withAppraisalContext), same limitation and same parsing approach as
// comparable-sale.controller.ts. Returns raw JSON directly, no envelope.
import type { Request, Response } from 'express'
import { getMarketIntelligenceOverviewForSuburb } from '../services/market-intelligence.service.js'
import { parseAuAddress } from '../utils/au-address.js'

function extractSuburbAndState(address: string): { suburb: string; state: string } | null {
  const parsed = parseAuAddress(address)
  if (!parsed) return null
  return { suburb: parsed.suburb, state: parsed.state }
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
