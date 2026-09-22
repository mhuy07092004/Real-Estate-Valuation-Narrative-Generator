import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const getAccessTokenMock = vi.fn().mockResolvedValue({ token: 'fake-access-token' })
const getClientMock = vi.fn().mockResolvedValue({ getAccessToken: getAccessTokenMock })

vi.mock('google-auth-library', () => ({
    GoogleAuth: vi.fn().mockImplementation(() => ({
        getClient: getClientMock,
    })),
}))

const fetchMock = vi.fn()

beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
})

describe('generateNarrativeViaVertex - credentials available', () => {
    test('extracts text from the plain "choices[0].message.content" shape', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ choices: [{ message: { content: '  Hello there.  ' } }] }),
        })
        const { generateNarrativeViaVertex } = await import('../src/services/vertex-narrative.service.js')
        expect(await generateNarrativeViaVertex('prompt')).toBe('Hello there.')
    })

    test('extracts text from the "predictions.choices[0].message.content" shape', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ predictions: { choices: [{ message: { content: 'Variant A' } }] } }),
        })
        const { generateNarrativeViaVertex } = await import('../src/services/vertex-narrative.service.js')
        expect(await generateNarrativeViaVertex('prompt')).toBe('Variant A')
    })

    test('extracts text from the "predictions[0].choices[0].message.content" shape', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ predictions: [{ choices: [{ message: { content: 'Variant B' } }] }] }),
        })
        const { generateNarrativeViaVertex } = await import('../src/services/vertex-narrative.service.js')
        expect(await generateNarrativeViaVertex('prompt')).toBe('Variant B')
    })

    test('extracts text from the flattened "predictions[0][0].message.content" shape (plain gcloud endpoint)', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ predictions: [[{ message: { content: 'Variant C' } }]] }),
        })
        const { generateNarrativeViaVertex } = await import('../src/services/vertex-narrative.service.js')
        expect(await generateNarrativeViaVertex('prompt')).toBe('Variant C')
    })

    test('falls back to "predictions[0]" itself when it is a plain string', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ predictions: ['Plain string result'] }) })
        const { generateNarrativeViaVertex } = await import('../src/services/vertex-narrative.service.js')
        expect(await generateNarrativeViaVertex('prompt')).toBe('Plain string result')
    })

    test('returns null when every known shape yields only blank/whitespace content', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: '   ' } }] }) })
        const { generateNarrativeViaVertex } = await import('../src/services/vertex-narrative.service.js')
        expect(await generateNarrativeViaVertex('prompt')).toBeNull()
    })

    test('returns null when the response shape matches none of the known variants', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ totally: 'unrecognized' }) })
        const { generateNarrativeViaVertex } = await import('../src/services/vertex-narrative.service.js')
        expect(await generateNarrativeViaVertex('prompt')).toBeNull()
    })

    test('returns null (not throw) on a non-OK HTTP response', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) })
        const { generateNarrativeViaVertex } = await import('../src/services/vertex-narrative.service.js')
        expect(await generateNarrativeViaVertex('prompt')).toBeNull()
    })

    test('returns null when getAccessToken resolves with no token', async () => {
        getAccessTokenMock.mockResolvedValueOnce({ token: null })
        const { generateNarrativeViaVertex } = await import('../src/services/vertex-narrative.service.js')
        expect(await generateNarrativeViaVertex('prompt')).toBeNull()
        expect(fetchMock).not.toHaveBeenCalled()
    })

    test('sends the prompt and maxTokens in the request, with a Bearer token from the resolved client', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: 'ok' } }] }) })
        const { generateNarrativeViaVertex } = await import('../src/services/vertex-narrative.service.js')

        await generateNarrativeViaVertex('Summarize this property', 250)

        const [url, options] = fetchMock.mock.calls[0]
        expect(url).toContain(':predict')
        expect(options.headers.Authorization).toBe('Bearer fake-access-token')
        const body = JSON.parse(options.body)
        expect(body.instances[0].messages[0].content).toBe('Summarize this property')
        expect(body.instances[0].max_tokens).toBe(250)
    })

    test('returns null (not throw) when the fetch call rejects outright', async () => {
        fetchMock.mockRejectedValue(new Error('aborted'))
        const { generateNarrativeViaVertex } = await import('../src/services/vertex-narrative.service.js')
        expect(await generateNarrativeViaVertex('prompt')).toBeNull()
    })
})
