import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('../src/lib/prisma.js', () => ({
    prisma: {
        marketIntelligence: {
            findMany: vi.fn(),
        },
    },
}))

import { prisma } from '../src/lib/prisma.js'
import {
    getMarketInsightsForSuburb,
    getMarketIntelligenceOverviewForSuburb,
} from '../src/services/market-intelligence.service.js'

afterEach(() => {
    vi.clearAllMocks()
})

const row = {
    suburb: 'Richmond',
    state: 'VIC',
    medianPrice: 1234000,
    medianPriceGrowthPct: 4.567,
    monthlyGrowthPct: 0.891,
    monthlyGrowthTrendPp: -0.12,
    daysOnMarket: 28,
    daysOnMarketTrendDays: -3,
    rentalYieldPct: 3.14,
    rentalYieldTrendPct: 0.2,
    priceTrendJson: JSON.stringify([{ month: '2026-01', priceIndex: 100 }]),
}

describe('getMarketInsightsForSuburb', () => {
    test('splits "Suburb STATE" into suburb + state and returns null when no match is found', async () => {
        vi.mocked(prisma.marketIntelligence.findMany).mockResolvedValue([])

        const result = await getMarketInsightsForSuburb('Nowhere VIC')

        expect(result).toBeNull()
        expect(prisma.marketIntelligence.findMany).toHaveBeenCalledWith({
            where: { suburb: { contains: 'Nowhere' } },
        })
    })

    test('formats compact currency, signed percentages, and parses the price-trend JSON', async () => {
        vi.mocked(prisma.marketIntelligence.findMany).mockResolvedValue([row] as any)

        const result = await getMarketInsightsForSuburb('Richmond VIC')

        expect(result?.suburb).toBe('Richmond VIC')
        expect(result?.stats.medianPrice).toBe('$1.23M')
        expect(result?.stats.medianPriceTrend).toBe('+4.6%')
        expect(result?.stats.monthlyGrowth).toBe('+0.89%')
        expect(result?.stats.monthlyGrowthTrend).toBe('-0.12pp')
        expect(result?.stats.daysOnMarketTrend).toBe('-3 days')
        expect(result?.stats.rentalYield).toBe('3.1%')
        expect(result?.priceTrend).toEqual([{ month: '2026-01', priceIndex: 100 }])
    })

    test('renders null rentalYieldPct/daysOnMarketTrend as an honest "N/A", never a fabricated number', async () => {
        vi.mocked(prisma.marketIntelligence.findMany).mockResolvedValue([
            { ...row, rentalYieldPct: null, rentalYieldTrendPct: null, daysOnMarketTrendDays: null },
        ] as any)

        const result = await getMarketInsightsForSuburb('Richmond VIC')

        expect(result?.stats.rentalYield).toBe('N/A')
        expect(result?.stats.rentalYieldTrend).toBe('N/A')
        expect(result?.stats.daysOnMarketTrend).toBe('N/A')
    })

    test('a single-word query (no state token) still looks up by suburb alone', async () => {
        vi.mocked(prisma.marketIntelligence.findMany).mockResolvedValue([row] as any)
        const result = await getMarketInsightsForSuburb('Richmond')
        expect(result?.suburb).toBe('Richmond VIC')
    })
})

describe('getMarketIntelligenceOverviewForSuburb', () => {
    test('returns an empty-but-well-shaped result (not null/throw) when no suburb matches', async () => {
        vi.mocked(prisma.marketIntelligence.findMany).mockResolvedValue([])

        const result = await getMarketIntelligenceOverviewForSuburb('Nowhere', 'VIC')

        expect(result).toEqual({ suburbLabel: 'Nowhere', stats: [], priceTrend: [] })
    })

    test('shapes matched data as a generic labelled stat array with the 4 fixed ids', async () => {
        vi.mocked(prisma.marketIntelligence.findMany).mockResolvedValue([row] as any)

        const result = await getMarketIntelligenceOverviewForSuburb('Richmond', 'VIC')

        expect(result.suburbLabel).toBe('Richmond VIC')
        expect(result.stats.map((s) => s.id)).toEqual([
            'median-price',
            'monthly-growth',
            'days-on-market',
            'rental-yield',
        ])
        const daysStat = result.stats.find((s) => s.id === 'days-on-market')
        expect(daysStat?.value).toBe('28')
    })
})
