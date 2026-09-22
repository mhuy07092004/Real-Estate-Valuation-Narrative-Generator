// market-intelligence.service.ts exports two async functions that depend on
// Prisma. We test only the pure formatting helpers here by extracting their
// logic directly. The module-level private functions (formatCompactCurrency,
// formatSignedPct, etc.) are tested indirectly through the exported async
// functions by mocking Prisma via vitest.mock.
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock Prisma before importing the service (the service imports prisma at the
// top of the file, so the mock must be registered first).
// ---------------------------------------------------------------------------
vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    marketIntelligence: {
      findMany: vi.fn(),
    },
  },
}))

import { getMarketInsightsForSuburb, getMarketIntelligenceOverviewForSuburb } from '../src/services/market-intelligence.service.js'
import { prisma } from '../src/lib/prisma.js'

// A realistic MarketIntelligence row with all fields populated.
const MOCK_ROW = {
  id: 'row-1',
  suburb: 'Richmond',
  state: 'VIC',
  medianPrice: 1_250_000,
  medianPriceGrowthPct: 4.5,
  monthlyGrowthPct: 0.38,
  monthlyGrowthTrendPp: 0.12,
  daysOnMarket: 28,
  daysOnMarketTrendDays: -3,
  rentalYieldPct: 3.2,
  rentalYieldTrendPct: 0.1,
  priceTrendJson: JSON.stringify([
    { month: '2024-01', priceIndex: 100 },
    { month: '2024-02', priceIndex: 101 },
  ]),
  // additional fields from schema (market comparison page)
  medianHousePrice: null,
  medianUnitPrice: null,
  vacancyRatePct: null,
  auctionClearanceRatePct: null,
  populationGrowthPct: null,
  supplyConstraintDwellingApprovalsPer1000: null,
}

describe('getMarketInsightsForSuburb', () => {
  beforeEach(() => {
    vi.mocked(prisma.marketIntelligence.findMany).mockResolvedValue([MOCK_ROW] as any)
  })

  it('returns null when no matching suburb found', async () => {
    vi.mocked(prisma.marketIntelligence.findMany).mockResolvedValue([])
    const result = await getMarketInsightsForSuburb('Unknown Suburb VIC')
    expect(result).toBeNull()
  })

  it('returns suburb label combining suburb + state', async () => {
    const result = await getMarketInsightsForSuburb('Richmond VIC')
    expect(result!.suburb).toBe('Richmond VIC')
  })

  it('formats medianPrice as compact currency (>= $1M → $X.XXM)', async () => {
    const result = await getMarketInsightsForSuburb('Richmond VIC')
    // 1_250_000 => $1.25M
    expect(result!.stats.medianPrice).toBe('$1.25M')
  })

  it('formats medianPriceGrowthPct with sign (+4.5%)', async () => {
    const result = await getMarketInsightsForSuburb('Richmond VIC')
    expect(result!.stats.medianPriceTrend).toBe('+4.5%')
  })

  it('formats negative daysOnMarketTrendDays with minus sign', async () => {
    const result = await getMarketInsightsForSuburb('Richmond VIC')
    // -3 days => '-3 days'
    expect(result!.stats.daysOnMarketTrend).toBe('-3 days')
  })

  it('formats rentalYield as X.X%', async () => {
    const result = await getMarketInsightsForSuburb('Richmond VIC')
    expect(result!.stats.rentalYield).toBe('3.2%')
  })

  it('renders rentalYield as N/A when null', async () => {
    vi.mocked(prisma.marketIntelligence.findMany).mockResolvedValue([
      { ...MOCK_ROW, rentalYieldPct: null },
    ] as any)
    const result = await getMarketInsightsForSuburb('Richmond VIC')
    expect(result!.stats.rentalYield).toBe('N/A')
  })

  it('parses priceTrendJson and returns array', async () => {
    const result = await getMarketInsightsForSuburb('Richmond VIC')
    expect(Array.isArray(result!.priceTrend)).toBe(true)
    expect(result!.priceTrend).toHaveLength(2)
  })

  it('matches case-insensitively (lower suburb query)', async () => {
    const result = await getMarketInsightsForSuburb('richmond vic')
    expect(result).not.toBeNull()
    expect(result!.suburb).toBe('Richmond VIC')
  })
})

describe('getMarketIntelligenceOverviewForSuburb', () => {
  beforeEach(() => {
    vi.mocked(prisma.marketIntelligence.findMany).mockResolvedValue([MOCK_ROW] as any)
  })

  it('returns empty stats and priceTrend when suburb not found', async () => {
    vi.mocked(prisma.marketIntelligence.findMany).mockResolvedValue([])
    const result = await getMarketIntelligenceOverviewForSuburb('Unknown', 'VIC')
    expect(result.stats).toHaveLength(0)
    expect(result.priceTrend).toHaveLength(0)
    expect(result.suburbLabel).toBe('Unknown')
  })

  it('returns 4 stat items when suburb is found', async () => {
    const result = await getMarketIntelligenceOverviewForSuburb('Richmond', 'VIC')
    expect(result.stats).toHaveLength(4)
  })

  it('stat ids are median-price, monthly-growth, days-on-market, rental-yield', async () => {
    const result = await getMarketIntelligenceOverviewForSuburb('Richmond', 'VIC')
    const ids = result.stats.map((s) => s.id)
    expect(ids).toEqual(['median-price', 'monthly-growth', 'days-on-market', 'rental-yield'])
  })

  it('median-price value matches compact currency format', async () => {
    const result = await getMarketIntelligenceOverviewForSuburb('Richmond', 'VIC')
    const medianPrice = result.stats.find((s) => s.id === 'median-price')!
    expect(medianPrice.value).toBe('$1.25M')
  })

  it('days-on-market value is N/A when null', async () => {
    vi.mocked(prisma.marketIntelligence.findMany).mockResolvedValue([
      { ...MOCK_ROW, daysOnMarket: null },
    ] as any)
    const result = await getMarketIntelligenceOverviewForSuburb('Richmond', 'VIC')
    const dom = result.stats.find((s) => s.id === 'days-on-market')!
    expect(dom.value).toBe('N/A')
  })

  it('suburbLabel is "Suburb STATE"', async () => {
    const result = await getMarketIntelligenceOverviewForSuburb('Richmond', 'VIC')
    expect(result.suburbLabel).toBe('Richmond VIC')
  })

  it('daysOnMarketTrend shows -N days with minus sign for negative trend', async () => {
    const result = await getMarketIntelligenceOverviewForSuburb('Richmond', 'VIC')
    const dom = result.stats.find((s) => s.id === 'days-on-market')!
    expect(dom.trend).toBe('-3 days')
  })

  it('monthly-growth trend shows pp suffix', async () => {
    const result = await getMarketIntelligenceOverviewForSuburb('Richmond', 'VIC')
    const mg = result.stats.find((s) => s.id === 'monthly-growth')!
    expect(mg.trend).toContain('pp')
  })
})

// ---------------------------------------------------------------------------
// Compact currency formatting — unit tests via known breakpoints
// ---------------------------------------------------------------------------
describe('compact currency formatting (via getMarketIntelligenceOverviewForSuburb)', () => {
  it('formats values >= $1M as compact $X.XM (only one trailing zero stripped)', async () => {
    // 1_000_000: toFixed(2) = "1.00", replace(/0$/) = "1.0", replace(/\.$/) = "1.0" → "$1.0M"
    // (The regex only strips a single trailing zero, so 1.00 → 1.0, not 1.)
    vi.mocked(prisma.marketIntelligence.findMany).mockResolvedValue([
      { ...MOCK_ROW, medianPrice: 1_000_000 },
    ] as any)
    const result = await getMarketIntelligenceOverviewForSuburb('Richmond', 'VIC')
    const medianPrice = result.stats.find((s) => s.id === 'median-price')!
    expect(medianPrice.value).toBe('$1.0M')
  })

  it('formats values >= $1K and < $1M as $XXXK', async () => {
    vi.mocked(prisma.marketIntelligence.findMany).mockResolvedValue([
      { ...MOCK_ROW, medianPrice: 750_000 },
    ] as any)
    const result = await getMarketIntelligenceOverviewForSuburb('Richmond', 'VIC')
    const medianPrice = result.stats.find((s) => s.id === 'median-price')!
    expect(medianPrice.value).toBe('$750K')
  })

  it('formats values < $1K as plain dollar amount', async () => {
    vi.mocked(prisma.marketIntelligence.findMany).mockResolvedValue([
      { ...MOCK_ROW, medianPrice: 500 },
    ] as any)
    const result = await getMarketIntelligenceOverviewForSuburb('Richmond', 'VIC')
    const medianPrice = result.stats.find((s) => s.id === 'median-price')!
    expect(medianPrice.value).toBe('$500')
  })
})

// ---------------------------------------------------------------------------
// Signed percentage / day formatting
// ---------------------------------------------------------------------------
describe('signed formatting (via getMarketIntelligenceOverviewForSuburb)', () => {
  it('positive growth has + prefix', async () => {
    vi.mocked(prisma.marketIntelligence.findMany).mockResolvedValue([
      { ...MOCK_ROW, medianPriceGrowthPct: 3.7 },
    ] as any)
    const result = await getMarketIntelligenceOverviewForSuburb('Richmond', 'VIC')
    const mp = result.stats.find((s) => s.id === 'median-price')!
    expect(mp.trend).toMatch(/^\+/)
  })

  it('negative growth has - prefix (no +)', async () => {
    vi.mocked(prisma.marketIntelligence.findMany).mockResolvedValue([
      { ...MOCK_ROW, medianPriceGrowthPct: -2.1 },
    ] as any)
    const result = await getMarketIntelligenceOverviewForSuburb('Richmond', 'VIC')
    const mp = result.stats.find((s) => s.id === 'median-price')!
    expect(mp.trend).toMatch(/^-/)
    expect(mp.trend).not.toMatch(/^\+/)
  })

  it('"1 day" singular when daysOnMarketTrendDays = 1', async () => {
    vi.mocked(prisma.marketIntelligence.findMany).mockResolvedValue([
      { ...MOCK_ROW, daysOnMarketTrendDays: 1 },
    ] as any)
    const result = await getMarketIntelligenceOverviewForSuburb('Richmond', 'VIC')
    const dom = result.stats.find((s) => s.id === 'days-on-market')!
    expect(dom.trend).toBe('+1 day')
  })

  it('"2 days" plural when daysOnMarketTrendDays = 2', async () => {
    vi.mocked(prisma.marketIntelligence.findMany).mockResolvedValue([
      { ...MOCK_ROW, daysOnMarketTrendDays: 2 },
    ] as any)
    const result = await getMarketIntelligenceOverviewForSuburb('Richmond', 'VIC')
    const dom = result.stats.find((s) => s.id === 'days-on-market')!
    expect(dom.trend).toBe('+2 days')
  })
})
