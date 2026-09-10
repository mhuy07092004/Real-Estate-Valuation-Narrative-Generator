// HTTP handlers for the appraisal wizard's comparable-sales list and the
// standalone comparable-sales search page. Unlike Client/Report, these
// endpoints return raw JSON matching the frontend's type directly — no
// { success, data } envelope, confirmed against common.ts's fetchJson usage.
import type { Request, Response } from 'express'
import { findComparablesInSuburb, type ComparableSubject } from '../services/comparable-sale.service.js'

// Same street/suburb/state/postcode pattern used on the frontend
// (parseAddressContext) — the subject address only ever arrives as one
// raw string, never structured fields.
function extractSuburbFromAddress(address: string): string | null {
    const match = address.trim().match(/^(?:\d+\s+[^,]+),\s*([^,]+)\s+([A-Za-z]{2,3})\s+(\d{4})$/)
    return match ? match[1].trim() : null
}

function parseDateRangeMonths(dateRange: unknown): number | undefined {
    if (typeof dateRange !== 'string') return undefined
    const match = dateRange.match(/^(\d+)m$/)
    return match ? Number(match[1]) : undefined
}

function parseMax(value: unknown, fallback: number): number {
    const n = Number(value)
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}

function soldAgoLabel(soldDate: Date): string {
    const diffDays = Math.floor((Date.now() - soldDate.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    const diffMonths = Math.floor(diffDays / 30)
    if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`
    const diffYears = Math.floor(diffMonths / 12)
    return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`
}

function toComparableSaleResponse(row: {
    comparableId: string
    soldPrice: number
    soldDate: Date
    property: {
        addressLine: string
        bedrooms: number
        bathrooms: number
        parking: number
        areaSqm: number
    }
}) {
    return {
        id: row.comparableId,
        address: row.property.addressLine,
        price: row.soldPrice,
        soldAgo: soldAgoLabel(row.soldDate),
        beds: row.property.bedrooms,
        baths: row.property.bathrooms,
        parking: row.property.parking,
        areaSqm: row.property.areaSqm,
        matchPercent: 0,
        distanceKm: 0,
    }
}

// Default cap for the report wizard's inline comparable-sales step — a
// suburb can genuinely qualify hundreds of sales, but the wizard only ever
// needs a handful of the best matches, not a full list. Overridable via
// ?max= for callers that want a different cap.
const WIZARD_DEFAULT_MAX = 5

export async function listComparableSales(req: Request, res: Response) {
    const address = String(req.query.address ?? '')
    const suburb = extractSuburbFromAddress(address)

    if (!suburb) {
        res.json([])
        return
    }

    const subject: ComparableSubject = {
        suburb,
        propertyType: typeof req.query.propertyType === 'string' ? req.query.propertyType : undefined,
        bedrooms: req.query.bedrooms ? Number(req.query.bedrooms) : undefined,
        bathrooms: req.query.bathrooms ? Number(req.query.bathrooms) : undefined,
        parking: req.query.parking ? Number(req.query.parking) : undefined,
    }

    const max = parseMax(req.query.max, WIZARD_DEFAULT_MAX)
    const rows = await findComparablesInSuburb(subject, { max })
    res.json(rows.map(toComparableSaleResponse))
}

// Default cap for the standalone Comparable Sales search page — same
// suburb-wide qualification issue as the wizard, but this page is meant to
// let a user browse more broadly, so it gets a higher default cap.
const SEARCH_DEFAULT_MAX = 20

export async function searchComparableSales(req: Request, res: Response) {
    const address = String(req.query.address ?? '')
    const propertyTypeParam = typeof req.query.propertyType === 'string' ? req.query.propertyType : undefined
    const dateRangeMonths = parseDateRangeMonths(req.query.dateRange)
    const max = parseMax(req.query.max, SEARCH_DEFAULT_MAX)
    const suburb = extractSuburbFromAddress(address)

    // The frontend never sends beds/baths/areaSqm for a search query, so a
    // fabricated subjectProperty can only echo back what it actually knows —
    // address and propertyType — rather than inventing numbers. Matches the
    // "honest zero over fake data" call already made for matchPercent/distanceKm.
    const fallbackSubjectProperty = {
        address,
        propertyType: propertyTypeParam && propertyTypeParam !== 'all' ? propertyTypeParam : 'House',
        beds: 0,
        baths: 0,
        areaSqm: 0,
    }

    if (!suburb) {
        res.json({ isMatch: false, subjectProperty: fallbackSubjectProperty, sales: [] })
        return
    }

    const rows = await findComparablesInSuburb(
        { suburb, propertyType: propertyTypeParam === 'all' ? undefined : propertyTypeParam },
        { dateRangeMonths, max },
    )

    const isMatch = rows.length > 0

    // subjectProperty always describes what was searched, match or not — the
    // "Save Property" button lives on this card, so nulling it out on a match
    // silently killed the button for every successful search.
    res.json({
        isMatch,
        subjectProperty: fallbackSubjectProperty,
        sales: rows.map(toComparableSaleResponse),
    })
}
