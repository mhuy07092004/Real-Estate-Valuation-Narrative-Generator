// Tests for price-prediction.service.ts.
// The service is an integration seam — no model is deployed yet — so we
// primarily test: (a) null when PREDICTION_URL is not configured, (b) null on
// non-ok HTTP responses, (c) null on bad response shapes, (d) the happy path
// where a valid predictedPrice is returned.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

function mockFetch(status: number, body: unknown) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as any)
}

describe('predictPropertyPrice — not configured (no PREDICTION_URL)', () => {
  it('returns null immediately when ML_PRICE_PREDICTION_URL is not set', async () => {
    // The module reads the env var at load time; since it's not set in the
    // test environment, the guard at the top of the function returns null.
    const { predictPropertyPrice } = await import('../src/services/price-prediction.service.js')
    const result = await predictPropertyPrice({
      suburb: 'Richmond',
      state: 'VIC',
      postcode: '3121',
    })
    expect(result).toBeNull()
  })
})

// The remaining tests override the env var via a fresh module import
// (vi.resetModules) so the service sees a configured URL.
describe('predictPropertyPrice — configured URL', () => {
  beforeEach(async () => {
    vi.resetModules()
    process.env.ML_PRICE_PREDICTION_URL = 'https://ml.example.com/predict'
  })

  afterEach(() => {
    delete process.env.ML_PRICE_PREDICTION_URL
    vi.resetModules()
  })

  it('returns the predicted price on a successful, well-shaped response', async () => {
    mockFetch(200, { predictedPrice: 1_050_000 })
    const { predictPropertyPrice } = await import('../src/services/price-prediction.service.js')
    const result = await predictPropertyPrice({ suburb: 'Richmond', state: 'VIC', postcode: '3121' })
    expect(result).toBe(1_050_000)
  })

  it('returns null when the endpoint returns a non-ok status', async () => {
    mockFetch(503, {})
    const { predictPropertyPrice } = await import('../src/services/price-prediction.service.js')
    const result = await predictPropertyPrice({ suburb: 'Richmond', state: 'VIC', postcode: '3121' })
    expect(result).toBeNull()
  })

  it('returns null when predictedPrice is missing from response', async () => {
    mockFetch(200, { something: 'else' })
    const { predictPropertyPrice } = await import('../src/services/price-prediction.service.js')
    const result = await predictPropertyPrice({ suburb: 'Richmond', state: 'VIC', postcode: '3121' })
    expect(result).toBeNull()
  })

  it('returns null when predictedPrice is not a finite number', async () => {
    mockFetch(200, { predictedPrice: Infinity })
    const { predictPropertyPrice } = await import('../src/services/price-prediction.service.js')
    const result = await predictPropertyPrice({ suburb: 'Richmond', state: 'VIC', postcode: '3121' })
    expect(result).toBeNull()
  })

  it('returns null when predictedPrice is zero or negative', async () => {
    mockFetch(200, { predictedPrice: 0 })
    const { predictPropertyPrice } = await import('../src/services/price-prediction.service.js')
    expect(await predictPropertyPrice({ suburb: 'Richmond', state: 'VIC', postcode: '3121' })).toBeNull()

    mockFetch(200, { predictedPrice: -500_000 })
    const { predictPropertyPrice: p2 } = await import('../src/services/price-prediction.service.js')
    expect(await p2({ suburb: 'Richmond', state: 'VIC', postcode: '3121' })).toBeNull()
  })

  it('returns null on fetch rejection (network error)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('timeout'))
    const { predictPropertyPrice } = await import('../src/services/price-prediction.service.js')
    const result = await predictPropertyPrice({ suburb: 'Richmond', state: 'VIC', postcode: '3121' })
    expect(result).toBeNull()
  })

  it('passes all input fields as JSON body to the endpoint', async () => {
    mockFetch(200, { predictedPrice: 800_000 })
    const { predictPropertyPrice } = await import('../src/services/price-prediction.service.js')
    await predictPropertyPrice({
      suburb: 'Fitzroy',
      state: 'VIC',
      postcode: '3065',
      propertyType: 'house',
      bedrooms: 4,
      bathrooms: 2,
      parking: 2,
      landSizeSqm: 350,
    })
    expect(global.fetch).toHaveBeenCalledOnce()
    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = JSON.parse(options.body)
    expect(body.suburb).toBe('Fitzroy')
    expect(body.bedrooms).toBe(4)
    expect(body.landSizeSqm).toBe(350)
  })
})
