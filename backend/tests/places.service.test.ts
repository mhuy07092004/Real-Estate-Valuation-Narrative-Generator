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

    // Category is no longer guessed from the place's own `types` field — each
    // category now runs its own scoped search (includedTypes: CATEGORY_TYPES[category]),
    // so a place's category is simply whichever search found it.
    test('assigns category based on which per-category search found the place, not the place\'s own type fields', async () => {
        fetchMock.mockImplementation(async (_url: string, options: { body: string }) => {
            const body = JSON.parse(options.body)
            const isCafeSearch = body.includedTypes.includes('cafe')
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    places: isCafeSearch
                        ? [{ id: 'p2', location: { latitude: 1, longitude: 2 }, types: ['point_of_interest', 'cafe'] }]
                        : [],
                }),
            }
        })

        const [amenity] = await findNearbyAmenities(1, 2, 1000)
        expect(amenity.category).toBe('dining')
        expect(amenity.name).toBe('Unnamed place')
    })

    test('falls back to the category name for primaryType when Google gives neither primaryType nor types', async () => {
        fetchMock.mockImplementation(async (_url: string, options: { body: string }) => {
            const body = JSON.parse(options.body)
            const isSchoolSearch = body.includedTypes.includes('school')
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    places: isSchoolSearch ? [{ id: 'p3', location: { latitude: 1, longitude: 2 } }] : [],
                }),
            }
        })

        const [amenity] = await findNearbyAmenities(1, 2, 1000)
        expect(amenity.category).toBe('school')
        expect(amenity.primaryType).toBe('school')
    })

    test('degrades gracefully: a single category failing does not blank out amenities from categories that succeeded', async () => {
        fetchMock.mockImplementation(async (_url: string, options: { body: string }) => {
            const body = JSON.parse(options.body)
            if (body.includedTypes.includes('hospital')) {
                return { ok: false, status: 500, json: async () => ({ error: { message: 'upstream hiccup' } }) }
            }
            if (body.includedTypes.includes('school')) {
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({
                        places: [{ id: 'p4', displayName: { text: 'Richmond Primary School' }, location: { latitude: 1, longitude: 2 }, primaryType: 'primary_school' }],
                    }),
                }
            }
            return { ok: true, status: 200, json: async () => ({ places: [] }) }
        })

        const amenities = await findNearbyAmenities(1, 2, 1000)
        expect(amenities).toHaveLength(1)
        expect(amenities[0]).toMatchObject({ id: 'p4', category: 'school' })
    })

    test('returns an empty array (not an error) when Google returns no places field', async () => {
        fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
        const result = await findNearbyAmenities(1, 2, 1000)
        expect(result).toEqual([])
    })

    test('throws a PlacesError when every category search fails', async () => {
        // One request per category now (searchNearbyByCategory), fanned out via
        // Promise.allSettled — since this mock applies to every call, all of them
        // fail, so findNearbyAmenities surfaces its own aggregate error rather than
        // passing through any single category's upstream message.
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
            expect((err as PlacesError).message).toBe('Nearby amenities lookup failed')
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
