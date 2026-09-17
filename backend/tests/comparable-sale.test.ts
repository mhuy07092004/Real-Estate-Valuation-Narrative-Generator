// Tests for the comparable-sale service's similarity-ranking logic.
// The similarityScore function is private, so we test it indirectly through
// findComparablesInSuburb by controlling what Prisma returns.
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    comparableSale: {
      findMany: vi.fn(),
    },
  },
}))

import { findComparablesInSuburb } from '../src/services/comparable-sale.service.js'
import { prisma } from '../src/lib/prisma.js'

// ---------------------------------------------------------------------------
// Helpers to build mock ComparableSale rows
// ---------------------------------------------------------------------------
function makeSale(overrides: {
  id?: string
  suburb?: string
  propertyType?: string
  bedrooms?: number
  bathrooms?: number
  parking?: number
  soldDate?: Date
  soldPrice?: number
}) {
  return {
    id: overrides.id ?? 'sale-1',
    soldPrice: overrides.soldPrice ?? 750_000,
    soldDate: overrides.soldDate ?? new Date('2026-01-15'),
    property: {
      suburb: overrides.suburb ?? 'Richmond',
      propertyType: overrides.propertyType ?? 'house',
      bedrooms: overrides.bedrooms ?? 3,
      bathrooms: overrides.bathrooms ?? 2,
      parking: overrides.parking ?? 1,
    },
  }
}

describe('findComparablesInSuburb — suburb filtering', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns only sales from the exact suburb (case-insensitive)', async () => {
    vi.mocked(prisma.comparableSale.findMany).mockResolvedValue([
      makeSale({ id: 'a', suburb: 'Richmond' }),
      makeSale({ id: 'b', suburb: 'richmond' }),  // same suburb, different case
      makeSale({ id: 'c', suburb: 'Richmond North' }), // different suburb, filtered out
    ] as any)

    const result = await findComparablesInSuburb({ suburb: 'Richmond' })
    const ids = result.map((r) => r.id)
    expect(ids).toContain('a')
    expect(ids).toContain('b')
    expect(ids).not.toContain('c')
  })

  it('returns empty array when no sales exist in the suburb', async () => {
    vi.mocked(prisma.comparableSale.findMany).mockResolvedValue([])
    const result = await findComparablesInSuburb({ suburb: 'NoSuchSuburb' })
    expect(result).toHaveLength(0)
  })
})

describe('findComparablesInSuburb — similarity ranking (propertyType)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('ranks property-type match first (+3 score bonus)', async () => {
    // Subject: house with 3 bed/2 bath/1 parking
    // Sale A: house (exact type match) 2 bed/2 bath/1 parking → score = 3 - 1 = 2
    // Sale B: unit  (type mismatch)   3 bed/2 bath/1 parking → score = 0
    vi.mocked(prisma.comparableSale.findMany).mockResolvedValue([
      makeSale({ id: 'B', propertyType: 'unit', bedrooms: 3, bathrooms: 2, parking: 1 }),
      makeSale({ id: 'A', propertyType: 'house', bedrooms: 2, bathrooms: 2, parking: 1 }),
    ] as any)

    const result = await findComparablesInSuburb({
      suburb: 'Richmond',
      propertyType: 'house',
      bedrooms: 3,
      bathrooms: 2,
      parking: 1,
    })

    expect(result[0].id).toBe('A')
    expect(result[1].id).toBe('B')
  })

  it('penalises by absolute difference in bedrooms', async () => {
    // Both units; A has same beds (0 penalty), B is 2 beds away (-2 penalty).
    vi.mocked(prisma.comparableSale.findMany).mockResolvedValue([
      makeSale({ id: 'B', propertyType: 'unit', bedrooms: 1, bathrooms: 2, parking: 1 }),
      makeSale({ id: 'A', propertyType: 'unit', bedrooms: 3, bathrooms: 2, parking: 1 }),
    ] as any)

    const result = await findComparablesInSuburb({
      suburb: 'Richmond',
      bedrooms: 3,
      bathrooms: 2,
      parking: 1,
    })

    expect(result[0].id).toBe('A')
    expect(result[1].id).toBe('B')
  })
})

describe('findComparablesInSuburb — dateRangeMonths filtering', () => {
  it('excludes sales outside the date window', async () => {
    const old = makeSale({ id: 'old', soldDate: new Date('2020-01-01') })
    const recent = makeSale({ id: 'recent', soldDate: new Date() })
    vi.mocked(prisma.comparableSale.findMany).mockResolvedValue([old, recent] as any)

    const result = await findComparablesInSuburb({ suburb: 'Richmond' }, { dateRangeMonths: 12 })
    const ids = result.map((r) => r.id)
    expect(ids).toContain('recent')
    expect(ids).not.toContain('old')
  })

  it('includes all sales when dateRangeMonths is omitted', async () => {
    const old = makeSale({ id: 'old', soldDate: new Date('2015-01-01') })
    const recent = makeSale({ id: 'recent', soldDate: new Date() })
    vi.mocked(prisma.comparableSale.findMany).mockResolvedValue([old, recent] as any)

    const result = await findComparablesInSuburb({ suburb: 'Richmond' })
    expect(result).toHaveLength(2)
  })
})

describe('findComparablesInSuburb — max option', () => {
  it('returns at most max entries when option is set', async () => {
    const sales = Array.from({ length: 10 }, (_, i) =>
      makeSale({ id: `sale-${i}`, bedrooms: 3 }),
    )
    vi.mocked(prisma.comparableSale.findMany).mockResolvedValue(sales as any)

    const result = await findComparablesInSuburb({ suburb: 'Richmond' }, { max: 3 })
    expect(result).toHaveLength(3)
  })

  it('returns all entries when max is not set', async () => {
    const sales = Array.from({ length: 10 }, (_, i) =>
      makeSale({ id: `sale-${i}`, bedrooms: 3 }),
    )
    vi.mocked(prisma.comparableSale.findMany).mockResolvedValue(sales as any)

    const result = await findComparablesInSuburb({ suburb: 'Richmond' })
    expect(result).toHaveLength(10)
  })
})

describe('findComparablesInSuburb — no subject attributes (no crash)', () => {
  it('does not crash when only suburb is provided (no type, beds, baths, parking)', async () => {
    vi.mocked(prisma.comparableSale.findMany).mockResolvedValue([
      makeSale({ id: 'a' }),
      makeSale({ id: 'b' }),
    ] as any)

    const result = await findComparablesInSuburb({ suburb: 'Richmond' })
    expect(result).toHaveLength(2)
  })
})
