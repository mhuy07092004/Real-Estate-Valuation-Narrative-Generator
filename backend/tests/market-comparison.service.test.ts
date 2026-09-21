import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('../src/lib/prisma.js', () => ({
    prisma: {
        marketIntelligence: {
            findMany: vi.fn(),
        },
        property: {
            findMany: vi.fn(),
        },
    },
}))

import { prisma } from '../src/lib/prisma.js'
import { getMarketComparisonSuburbs } from '../src/services/market-comparison.service.js'

afterEach(() => {
    vi.clearAllMocks()
})

const completeRow = {
    suburb: 'Richmond',
    state: 'VIC',
    medianHousePrice: 1200000,
    medianUnitPrice: 650000,
    medianPriceGrowthPct: 4.2,
    rentalYieldPct: 3.1,
    vacancyRatePct: 1.5,
    auctionClearanceRatePct: 72,
    populationGrowthPct: 1.8,
    supplyConstraintDwellingApprovalsPer1000: 5.2,
}

describe('getMarketComparisonSuburbs', () => {
    test('only queries rows with every required field present (enforced via the Prisma where clause)', async () => {
        vi.mocked(prisma.marketIntelligence.findMany).mockResolvedValue([])
        vi.mocked(prisma.property.findMany).mockResolvedValue([])

        await getMarketComparisonSuburbs()

        expect(prisma.marketIntelligence.findMany).toHaveBeenCalledWith({
            where: {
                medianHousePrice: { not: null },
                medianUnitPrice: { not: null },
                rentalYieldPct: { not: null },
                vacancyRatePct: { not: null },
                auctionClearanceRatePct: { not: null },
                populationGrowthPct: { not: null },
                supplyConstraintDwellingApprovalsPer1000: { not: null },
            },
        })
    })

    test('joins in the postcode from Property by suburb+state, case-insensitively', async () => {
        vi.mocked(prisma.marketIntelligence.findMany).mockResolvedValue([completeRow] as any)
        vi.mocked(prisma.property.findMany).mockResolvedValue([
            { suburb: 'RICHMOND', state: 'vic', postcode: '3121' },
        ] as any)

        const [result] = await getMarketComparisonSuburbs()

        expect(result.postcode).toBe('3121')
        expect(result.id).toBe('richmond-vic-3121')
        expect(result.medianHousePrice).toBe(1200000)
        expect(result.growth12m).toBe(4.2)
    })

    test('falls back to an empty postcode (never throws) when no matching Property row exists', async () => {
        vi.mocked(prisma.marketIntelligence.findMany).mockResolvedValue([completeRow] as any)
        vi.mocked(prisma.property.findMany).mockResolvedValue([])

        const [result] = await getMarketComparisonSuburbs()

        expect(result.postcode).toBe('')
        expect(result.id).toBe('richmond-vic-')
    })

    test('slugifies suburb names with spaces/punctuation into a clean id', async () => {
        vi.mocked(prisma.marketIntelligence.findMany).mockResolvedValue([
            { ...completeRow, suburb: "St Kilda East!" },
        ] as any)
        vi.mocked(prisma.property.findMany).mockResolvedValue([])

        const [result] = await getMarketComparisonSuburbs()

        expect(result.id).toBe('st-kilda-east-vic-')
    })
})
