import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('../src/lib/prisma.js', () => ({
    prisma: {
        comparableSale: {
            findMany: vi.fn(),
        },
    },
}))

import { prisma } from '../src/lib/prisma.js'
import { findComparablesInSuburb } from '../src/services/comparable-sale.service.js'

afterEach(() => {
    vi.clearAllMocks()
})

function row(overrides: Partial<{
    soldDate: Date
    propertyType: string
    bedrooms: number
    bathrooms: number
    parking: number
    suburb: string
}>) {
    return {
        soldDate: overrides.soldDate ?? new Date('2026-01-01'),
        property: {
            propertyType: overrides.propertyType ?? 'house',
            bedrooms: overrides.bedrooms ?? 3,
            bathrooms: overrides.bathrooms ?? 2,
            parking: overrides.parking ?? 1,
            suburb: overrides.suburb ?? 'Richmond',
        },
    }
}

describe('findComparablesInSuburb', () => {
    test('re-filters to an exact case-insensitive suburb match after the DB "contains" pre-filter', async () => {
        vi.mocked(prisma.comparableSale.findMany).mockResolvedValue([
            row({ suburb: 'Richmond' }),
            row({ suburb: 'RICHMOND' }),
            row({ suburb: 'North Richmond' }), // "contains" would match this, exact match must not
        ] as any)

        const result = await findComparablesInSuburb({ suburb: 'Richmond' })

        expect(result).toHaveLength(2)
        expect(result.every((r) => r.property.suburb.toLowerCase() === 'richmond')).toBe(true)
    })

    test('passes a trimmed "contains" filter to Prisma to narrow candidates before the JS re-filter', async () => {
        vi.mocked(prisma.comparableSale.findMany).mockResolvedValue([])
        await findComparablesInSuburb({ suburb: '  Richmond  ' })

        expect(prisma.comparableSale.findMany).toHaveBeenCalledWith({
            where: { property: { suburb: { contains: 'Richmond' } } },
            orderBy: { soldDate: 'desc' },
            include: { property: true },
        })
    })

    test('ranks matching property type above a closer-but-mismatched-type comparable', async () => {
        // exact bed/bath/parking match but wrong type (score 0) vs matching
        // type but off by 1 bedroom (score 3 - 1 = 2) -> the type match wins.
        vi.mocked(prisma.comparableSale.findMany).mockResolvedValue([
            row({ propertyType: 'unit', bedrooms: 3, bathrooms: 2, parking: 1 }),
            row({ propertyType: 'house', bedrooms: 4, bathrooms: 2, parking: 1 }),
        ] as any)

        const result = await findComparablesInSuburb({
            suburb: 'Richmond',
            propertyType: 'house',
            bedrooms: 3,
            bathrooms: 2,
            parking: 1,
        })

        expect(result[0].property.propertyType).toBe('house')
    })

    test('filters out sales older than dateRangeMonths when given', async () => {
        const recent = row({ soldDate: new Date() })
        const old = row({ soldDate: new Date('2000-01-01') })
        vi.mocked(prisma.comparableSale.findMany).mockResolvedValue([recent, old] as any)

        const result = await findComparablesInSuburb({ suburb: 'Richmond' }, { dateRangeMonths: 12 })

        expect(result).toHaveLength(1)
        expect(result[0]).toBe(recent)
    })

    test('caps results to max when given, but returns everything when max is omitted', async () => {
        const rows = Array.from({ length: 5 }, () => row({}))
        vi.mocked(prisma.comparableSale.findMany).mockResolvedValue(rows as any)

        const capped = await findComparablesInSuburb({ suburb: 'Richmond' }, { max: 2 })
        expect(capped).toHaveLength(2)

        const uncapped = await findComparablesInSuburb({ suburb: 'Richmond' })
        expect(uncapped).toHaveLength(5)
    })
})
