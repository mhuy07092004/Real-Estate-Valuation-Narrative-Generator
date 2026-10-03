import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../src/config/env.js', () => ({
    env: {
        googleMaps: { serverKey: 'test-maps-key' },
    },
}))

import { PlacesError, findNearbyAmenities } from '../src/services/places.service.js'

const fetchMock = vi.fn()

beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
})

describe('findNearbyAmenities', () => {
    test('maps a Google place to an Amenity, categorizing by primaryType', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                places: [
                    {
                        id: 'p1',
                        displayName: { text: 'Richmond Primary School' },
                        location: { latitude: -37.82, longitude: 145.0 },
                        primaryType: 'primary_school',
                        types: ['primary_school', 'school'],
                        rating: 4.5,
                    },
                ],
            }),
        })

        const [amenity] = await findNearbyAmenities(-37.82, 145.0, 1000)

        expect(amenity).toEqual({
            id: 'p1',
            name: 'Richmond Primary School',
            category: 'school',
            primaryType: 'primary_school',
            lat: -37.82,
            lng: 145.0,
            rating: 4.5,
        })
    })

    test('falls back to scanning the types array when primaryType is missing/unrecognized', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                places: [
                    {
                        id: 'p2',
                        location: { latitude: 1, longitude: 2 },
                        types: ['point_of_interest', 'cafe'],
                    },
                ],
            }),
        })

        const [amenity] = await findNearbyAmenities(1, 2, 1000)
        expect(amenity.category).toBe('dining')
        expect(amenity.name).toBe('Unnamed place')
    })

    test('categorizes as "other" when nothing matches any known type', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                places: [{ id: 'p3', location: { latitude: 1, longitude: 2 }, types: ['weird_unknown_type'] }],
            }),
        })

        const [amenity] = await findNearbyAmenities(1, 2, 1000)
        expect(amenity.category).toBe('other')
        expect(amenity.primaryType).toBe('weird_unknown_type')
    })

    test('returns an empty array (not an error) when Google returns no places field', async () => {
        fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
        const result = await findNearbyAmenities(1, 2, 1000)
        expect(result).toEqual([])
    })

    test('throws a PlacesError carrying the upstream status on a non-OK response', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 400,
            json: async () => ({ error: { message: 'Invalid radius' } }),
        })

        try {
            await findNearbyAmenities(1, 2, 999999)
            expect.unreachable('should have thrown')
        } catch (err) {
            expect(err).toBeInstanceOf(PlacesError)
            expect((err as PlacesError).status).toBe(502)
            expect((err as PlacesError).message).toBe('Invalid radius')
        }
    })

    test('sends the search request with the radius, center, and API key header', async () => {
        fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ places: [] }) })

        await findNearbyAmenities(-37.8, 145.0, 2500)

        const [url, options] = fetchMock.mock.calls[0]
        expect(url).toBe('https://places.googleapis.com/v1/places:searchNearby')
        expect(options.headers['X-Goog-Api-Key']).toBe('test-maps-key')
        const body = JSON.parse(options.body)
        expect(body.locationRestriction.circle.center).toEqual({ latitude: -37.8, longitude: 145.0 })
        expect(body.locationRestriction.circle.radius).toBe(2500)
        expect(body.maxResultCount).toBe(20)
    })
})
