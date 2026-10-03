import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

process.env.ML_PRICE_PREDICTION_URL = 'https://ml.example.com/predict'
process.env.ML_PRICE_PREDICTION_API_KEY = 'test-ml-key'

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

describe('predictPropertyPrice - configured', () => {
    test('returns the predicted price on a valid positive-number response', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ predictedPrice: 950000 }) })

        const { predictPropertyPrice } = await import('../src/services/price-prediction.service.js')
        const result = await predictPropertyPrice(input)

        expect(result).toBe(950000)
    })

    test('sends a POST with a Bearer auth header and the JSON-encoded input', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ predictedPrice: 950000 }) })

        const { predictPropertyPrice } = await import('../src/services/price-prediction.service.js')
        await predictPropertyPrice(input)

        const [url, options] = fetchMock.mock.calls[0]
        expect(url).toBe('https://ml.example.com/predict')
        expect(options.method).toBe('POST')
        expect(options.headers.Authorization).toBe('Bearer test-ml-key')
        expect(JSON.parse(options.body)).toEqual(input)
    })

    test('returns null (never NaN/negative) when predictedPrice is missing, non-numeric, zero, or negative', async () => {
        const { predictPropertyPrice } = await import('../src/services/price-prediction.service.js')

        for (const response of [{}, { predictedPrice: 'a lot' }, { predictedPrice: 0 }, { predictedPrice: -5 }, { predictedPrice: NaN }]) {
            fetchMock.mockResolvedValue({ ok: true, json: async () => response })
            expect(await predictPropertyPrice(input)).toBeNull()
        }
    })

    test('returns null (not throw) when the upstream responds with a non-OK status', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
        const { predictPropertyPrice } = await import('../src/services/price-prediction.service.js')
        expect(await predictPropertyPrice(input)).toBeNull()
    })

    test('returns null (not throw) when the fetch itself rejects (network/timeout failure)', async () => {
        fetchMock.mockRejectedValue(new Error('timeout'))
        const { predictPropertyPrice } = await import('../src/services/price-prediction.service.js')
        expect(await predictPropertyPrice(input)).toBeNull()
    })
})
