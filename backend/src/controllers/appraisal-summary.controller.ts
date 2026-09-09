// HTTP handler for the wizard's step-5 appraisal summary — the real
// estimatedValue/priceRange computation, replacing the old independent
// mock formula. Reuses comparable-sale.service's findComparablesInSuburb
// (same set Step 1 shows) and market-intelligence.service's suburb lookup
// (for the two real market stats) — no new service needed. Returns raw
// JSON directly, no envelope, matching the other /api/appraisal-family
// endpoints' contract.
import type { Request, Response } from 'express'
import { findComparablesInSuburb } from '../services/comparable-sale.service.js'
import { getMarketIntelligenceOverviewForSuburb } from '../services/market-intelligence.service.js'

function parseAddress(address: string): { street: string; suburb: string; state: string; postcode: string } | null {
    const match = address.trim().match(/^(\d+\s+[^,]+),\s*([^,]+)\s+([A-Za-z]{2,3})\s+(\d{4})$/)
    if (!match) return null
    return { street: match[1].trim(), suburb: match[2].trim(), state: match[3].trim().toUpperCase(), postcode: match[4].trim() }
}

function formatCurrency(value: number): string {
    return `$${Math.round(value).toLocaleString('en-AU')}`
}

export async function getAppraisalSummary(req: Request, res: Response) {
    const address = String(req.query.address ?? '')
    const propertyType = typeof req.query.propertyType === 'string' ? req.query.propertyType : undefined
    const bedrooms = req.query.bedrooms ? Number(req.query.bedrooms) : undefined
    const bathrooms = req.query.bathrooms ? Number(req.query.bathrooms) : undefined
    const parking = req.query.parking ? Number(req.query.parking) : undefined
    const landSizeSqm = req.query.landSizeSqm ? Number(req.query.landSizeSqm) : undefined

    const parsed = parseAddress(address)

    const emptyResponse = {
        eyebrow: 'RELAIVE · APPRAISAL REPORT',
        date: new Date().toLocaleDateString('en-AU'),
        street: parsed?.street ?? address,
        suburbLine: parsed ? `${parsed.suburb} ${parsed.state} ${parsed.postcode}` : '',
        featuresLine: `${propertyType ?? 'House'} · ${bedrooms ?? 0} bed · ${bathrooms ?? 0} bath${landSizeSqm ? ` · ${landSizeSqm}m²` : ''}`,
        appraisalLabel: 'Market Appraisal',
        priceRange: 'N/A',
        midpointEstimate: '$0',
        stats: [{ id: 'comparables', value: '0', label: 'Comparables' }],
    }

    if (!parsed) {
        res.json(emptyResponse)
        return
    }

    const comparables = await findComparablesInSuburb({ suburb: parsed.suburb, propertyType, bedrooms, bathrooms, parking })

    if (comparables.length === 0) {
        res.json(emptyResponse)
        return
    }

    const prices = comparables.map((row) => row.soldPrice)
    const midpoint = prices.reduce((sum, price) => sum + price, 0) / prices.length
    const min = Math.min(...prices)
    const max = Math.max(...prices)

    const marketOverview = await getMarketIntelligenceOverviewForSuburb(parsed.suburb, parsed.state)
    const stats = [{ id: 'comparables', value: String(comparables.length), label: 'Comparables' }]

    const daysOnMarketStat = marketOverview.stats.find((stat) => stat.id === 'days-on-market')
    if (daysOnMarketStat) stats.push({ id: 'days-on-mkt', value: daysOnMarketStat.value, label: 'Days on Mkt' })

    const growthStat = marketOverview.stats.find((stat) => stat.id === 'median-price')
    if (growthStat) stats.push({ id: 'annual-growth', value: growthStat.trend, label: 'Annual Growth' })

    res.json({
        eyebrow: 'RELAIVE · APPRAISAL REPORT',
        date: new Date().toLocaleDateString('en-AU'),
        street: parsed.street,
        suburbLine: `${parsed.suburb} ${parsed.state} ${parsed.postcode}`,
        featuresLine: `${propertyType ?? 'House'} · ${bedrooms ?? 0} bed · ${bathrooms ?? 0} bath${landSizeSqm ? ` · ${landSizeSqm}m²` : ''}`,
        appraisalLabel: 'Market Appraisal',
        priceRange: `${formatCurrency(min)} – ${formatCurrency(max)}`,
        midpointEstimate: formatCurrency(midpoint),
        stats,
    })
}
