import { describe, expect, test, vi } from 'vitest'

vi.mock('../src/config/env.js', () => ({
    env: {
        googleMaps: { serverKey: '' },
    },
}))

import { GeocodeError, geocodeAddress } from '../src/services/geocode.service.js'

describe('geocodeAddress - not configured', () => {
    test('throws a 503 GeocodeError without any network call when no server key is set', async () => {
        const fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)

        await expect(geocodeAddress('1 Main St')).rejects.toBeInstanceOf(GeocodeError)
        await expect(geocodeAddress('1 Main St')).rejects.toMatchObject({ status: 503 })
        expect(fetchMock).not.toHaveBeenCalled()

        vi.unstubAllGlobals()
    })
})
