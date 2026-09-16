// Data-access + matching logic for ComparableSale — reference data, not
// owned by a user. Filters to the subject's suburb first, then ranks by
// property-type match and beds/bathrooms/parking closeness.
//
// The suburb match itself is still finished in JS (exact, trimmed,
// case-insensitive) because SQLite + Prisma has no case-insensitive
// `equals` (that's Postgres-only). But the DB query narrows to candidate
// rows first via a `contains` filter — SQLite's LIKE is case-insensitive
// for ASCII by default — so a request only ships the couple hundred
// same-suburb rows across the Prisma boundary, not the entire table. Without
// this, the query was a full-table scan + full join of every comparable
// sale on every request (measured ~1.3s at 33k rows, growing without bound
// as more data is ingested) instead of a few ms.
import { prisma } from '../lib/prisma.js'

export type ComparableSubject = {
    suburb: string
    propertyType?: string
    bedrooms?: number
    bathrooms?: number
    parking?: number
}

function monthsAgo(months: number): Date {
    const date = new Date()
    date.setMonth(date.getMonth() - months)
    return date
}

function similarityScore(
    row: { property: { propertyType: string; bedrooms: number; bathrooms: number; parking: number } },
    subject: ComparableSubject,
): number {
    let score = 0
    if (subject.propertyType && row.property.propertyType.toLowerCase() === subject.propertyType.toLowerCase()) {
        score += 3
    }
    if (typeof subject.bedrooms === 'number') score -= Math.abs(row.property.bedrooms - subject.bedrooms)
    if (typeof subject.bathrooms === 'number') score -= Math.abs(row.property.bathrooms - subject.bathrooms)
    if (typeof subject.parking === 'number') score -= Math.abs(row.property.parking - subject.parking)
    return score
}

export async function findComparablesInSuburb(
    subject: ComparableSubject,
    options: { dateRangeMonths?: number; max?: number } = {},
) {
    const candidates = await prisma.comparableSale.findMany({
        where: {
            property: {
                suburb: { contains: subject.suburb.trim() },
            },
        },
        orderBy: { soldDate: 'desc' },
        include: { property: true },
    })

    const sameSuburb = candidates.filter(
        (row) => row.property.suburb.trim().toLowerCase() === subject.suburb.trim().toLowerCase(),
    )

    const withinRange = options.dateRangeMonths
        ? sameSuburb.filter((row) => row.soldDate >= monthsAgo(options.dateRangeMonths!))
        : sameSuburb

    const ranked = withinRange.slice().sort((a, b) => similarityScore(b, subject) - similarityScore(a, subject))

    // Same suburb can genuinely qualify hundreds of comparable sales — cap to
    // the best-ranked ones rather than returning every match. Uncapped only
    // if the caller explicitly omits `max`.
    return typeof options.max === 'number' ? ranked.slice(0, options.max) : ranked
}
