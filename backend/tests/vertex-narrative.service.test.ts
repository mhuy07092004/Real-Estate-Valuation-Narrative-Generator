import { describe, expect, test, vi } from 'vitest'

describe('generateNarrativeViaVertex - no credentials available', () => {
    test('returns null (never throws) when GoogleAuth cannot resolve default credentials', async () => {
        // This test container has no GOOGLE_APPLICATION_CREDENTIALS / ADC
        // configured, so the real GoogleAuth().getClient() call the module
        // makes at import time genuinely rejects, and the module's own
        // `.catch(() => null)` turns that into a null client — exercising
        // the real "auth unavailable" fallback path end-to-end, not a mock.
        const fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)

        const { generateNarrativeViaVertex } = await import('../src/services/vertex-narrative.service.js')
        const result = await generateNarrativeViaVertex('Write a summary')

        expect(result).toBeNull()
        expect(fetchMock).not.toHaveBeenCalled()

        vi.unstubAllGlobals()
    })
})
