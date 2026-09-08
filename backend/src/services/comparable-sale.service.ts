// Data-access + matching logic for ComparableSale — reference data, not
// owned by a user. Filters to the subject's suburb first, then ranks by
// property-type match and beds/bathrooms/parking closeness. Filtering is
// done in JS after a full fetch rather than in the query, since SQLite +
// Prisma has no case-insensitive string comparison (that's Postgres-only) —
// fine at this table's small reference-data scale.
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
    row: { propertyType: string; bedrooms: number; bathrooms: number; parking: number },
    subject: ComparableSubject,
): number {
    let score = 0
    if (subject.propertyType && row.propertyType.toLowerCase() === subject.propertyType.toLowerCase()) {
        score += 3
    }
    if (typeof subject.bedrooms === 'number') score -= Math.abs(row.bedrooms - subject.bedrooms)
    if (typeof subject.bathrooms === 'number') score -= Math.abs(row.bathrooms - subject.bathrooms)
    if (typeof subject.parking === 'number') score -= Math.abs(row.parking - subject.parking)
    return score
}

export async function findComparablesInSuburb(
    subject: ComparableSubject,
    options: { dateRangeMonths?: number } = {},
) {
    const all = await prisma.comparableSale.findMany({ orderBy: { soldDate: 'desc' } })

    const sameSuburb = all.filter(
        (row) => row.suburb.trim().toLowerCase() === subject.suburb.trim().toLowerCase(),
    )

    const withinRange = options.dateRangeMonths
        ? sameSuburb.filter((row) => row.soldDate >= monthsAgo(options.dateRangeMonths!))
        : sameSuburb

    return withinRange.slice().sort((a, b) => similarityScore(b, subject) - similarityScore(a, subject))
}
