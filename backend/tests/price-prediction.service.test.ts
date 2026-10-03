import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const fetchMock = vi.fn()

beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
})

const input = {
    suburb: 'Richmond',
    state: 'VIC',
    postcode: '3121',
    propertyType: 'house',
    bedrooms: 3,
    bathrooms: 2,
    parking: 1,
    landSizeSqm: 400,
}

describe('predictPropertyPrice - ML_PRICE_PREDICTION_URL not configured', () => {
    test('returns null without any network call (expected placeholder state, not an error)', async () => {
        // No ML_PRICE_PREDICTION_URL is set anywhere in this test environment,
        // so the module-level PREDICTION_URL constant resolves to ''.
        const { predictPropertyPrice } = await import('../src/services/price-prediction.service.js')
        const result = await predictPropertyPrice(input)
        expect(result).toBeNull()
        expect(fetchMock).not.toHaveBeenCalled()
    })
})
