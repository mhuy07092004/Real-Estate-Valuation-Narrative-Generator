import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../src/config/env.js', () => ({
    env: {
        googleMaps: { serverKey: 'test-maps-key' },
    },
}))

import { GeocodeError, geocodeAddress } from '../src/services/geocode.service.js'

const fetchMock = vi.fn()

beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
})

describe('geocodeAddress', () => {
    test('returns formatted address + lat/lng on a successful OK response', async () => {
        fetchMock.mockResolvedValue({
            json: async () => ({
                status: 'OK',
                results: [
                    {
                        formatted_address: '1 Main St, Richmond VIC 3121, Australia',
                        geometry: { location: { lat: -37.82, lng: 145.0 } },
                    },
                ],
            }),
        })

        const result = await geocodeAddress('1 Main St Richmond')

        expect(result).toEqual({
            formattedAddress: '1 Main St, Richmond VIC 3121, Australia',
            lat: -37.82,
            lng: 145.0,
        })
    })

    test('sends the address and key as query params to the Google endpoint', async () => {
        fetchMock.mockResolvedValue({
            json: async () => ({ status: 'OK', results: [{ formatted_address: 'x', geometry: { location: { lat: 0, lng: 0 } } }] }),
        })

        await geocodeAddress('123 Fake St')

        const calledUrl = fetchMock.mock.calls[0][0] as URL
        expect(calledUrl.toString()).toContain('maps.googleapis.com/maps/api/geocode/json')
        expect(calledUrl.searchParams.get('address')).toBe('123 Fake St')
        expect(calledUrl.searchParams.get('key')).toBe('test-maps-key')
    })

    test('throws a 404 GeocodeError on ZERO_RESULTS', async () => {
        fetchMock.mockResolvedValue({ json: async () => ({ status: 'ZERO_RESULTS', results: [] }) })

        await expect(geocodeAddress('nowhere at all')).rejects.toMatchObject({
            status: 404,
            message: 'Address not found',
        } satisfies Partial<GeocodeError>)
    })

    test('throws a 502 GeocodeError with Google\'s own error_message on any other non-OK status', async () => {
        fetchMock.mockResolvedValue({
            json: async () => ({ status: 'REQUEST_DENIED', error_message: 'The provided API key is invalid.' }),
        })

        try {
            await geocodeAddress('1 Main St')
            expect.unreachable('should have thrown')
        } catch (err) {
            expect(err).toBeInstanceOf(GeocodeError)
            expect((err as GeocodeError).status).toBe(502)
            expect((err as GeocodeError).message).toBe('The provided API key is invalid.')
        }
    })

    test('throws a 404 GeocodeError if status is OK but results is unexpectedly empty', async () => {
        fetchMock.mockResolvedValue({ json: async () => ({ status: 'OK', results: [] }) })
        await expect(geocodeAddress('1 Main St')).rejects.toMatchObject({ status: 404 })
    })
})

