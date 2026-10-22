// Author: The Long Tran
// buildExecutiveSummary's narrative-model path: the answer is split into the
// Executive Summary and the extra section, and a buyer/investor report
// without its Step 3 inputs never calls the model.
import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../src/services/comparable-sale.service.js', () => ({
    findComparablesInSuburb: vi.fn(async () => [
        {
            soldPrice: 1800000,
            soldDate: new Date('2026-06-18T00:00:00.000Z'),
            property: { addressLine: '16 Parkview Avenue', bedrooms: 3, bathrooms: 2, parking: 3, areaSqm: 538 },
        },
    ]),
}))
vi.mock('../src/services/market-intelligence.service.js', () => ({
    getMarketIntelligenceOverviewForSuburb: vi.fn(async () => ({ suburbLabel: 'Penshurst NSW', stats: [], priceTrend: [] })),
    findMarketIntelligenceRow: vi.fn(async () => ({
        medianPrice: 2130000,
        medianPriceGrowthPct: 231,
        monthlyGrowthPct: 0,
        daysOnMarket: 15,
        rentalYieldPct: 3.97,
        auctionClearanceRatePct: 61.2,
        vacancyRatePct: 0.72,
    })),
}))
vi.mock('../src/services/price-prediction.service.js', () => ({ predictPropertyPrice: vi.fn(async () => 2047000) }))
vi.mock('../src/services/vertex-narrative.service.js', () => ({ generateNarrativeViaVertex: vi.fn() }))

import { buildExecutiveSummary } from '../src/services/report-content.service.js'
import { generateNarrativeViaVertex } from '../src/services/vertex-narrative.service.js'

const subject = {
    street: '21 Denison Street',
    suburb: 'Penshurst',
    state: 'NSW',
    postcode: '2222',
    propertyType: 'House',
    bedrooms: 3,
    bathrooms: 1,
    parking: 3,
    landSizeSqm: 486,
}

const roi = {
    inputs: { purchasePrice: 2047000, deposit: 300447, interestRate: 6.39, weeklyRent: 1563 },
    grossYieldPct: 3.97,
    netYieldPct: 3.29,
    monthlyCashFlow: -6056,
    cashOnCashReturnPct: -24.19,
}

describe('buildExecutiveSummary with the narrative model', () => {
    beforeEach(() => vi.mocked(generateNarrativeViaVertex).mockReset())

    test('returns the commentary and the extra section without heading paragraphs', async () => {
        vi.mocked(generateNarrativeViaVertex).mockResolvedValue(
            'APPRAISAL COMMENTARY\n\nFirst paragraph.\n\nSecond paragraph.\n\nGROWTH OUTLOOK\n\nOutlook paragraph.',
        )

        const summary = await buildExecutiveSummary(subject, 'investor', { roi })

        expect(summary.title).toBe('1. EXECUTIVE SUMMARY')
        expect(summary.paragraphs).toEqual([[{ text: 'First paragraph.' }], [{ text: 'Second paragraph.' }]])
        expect(summary).toMatchObject({
            extraSection: { title: '5. GROWTH OUTLOOK', paragraphs: [[{ text: 'Outlook paragraph.' }]] },
        })

        const [prompt, maxTokens] = vi.mocked(generateNarrativeViaVertex).mock.calls[0]
        expect(prompt).toContain('Financing assumptions:')
        expect(prompt).toContain('Write the Appraisal Commentary section and the Growth Outlook section')
        expect(maxTokens).toBe(700)
    })

    test('skips the model for an investor report without ROI inputs', async () => {
        const summary = await buildExecutiveSummary(subject, 'investor')

        expect(generateNarrativeViaVertex).not.toHaveBeenCalled()
        expect(summary.title).toBe('1. EXECUTIVE SUMMARY')
        expect(summary).not.toHaveProperty('extraSection')
    })
})
