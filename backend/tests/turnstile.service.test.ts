import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../src/config/env.js', () => ({
    env: {
        turnstile: { secretKey: 'test-turnstile-secret' },
    },
}))

import {
    TurnstileVerificationError,
    verifyTurnstileToken,
} from '../src/services/turnstile.service.js'

const fetchMock = vi.fn()

beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
})

describe('verifyTurnstileToken', () => {
    test('throws immediately (no network call) when no token is given', async () => {
        await expect(verifyTurnstileToken(undefined)).rejects.toThrow(TurnstileVerificationError)
        expect(fetchMock).not.toHaveBeenCalled()
    })

    test('resolves without throwing when Cloudflare reports success', async () => {
        fetchMock.mockResolvedValue({ json: async () => ({ success: true }) })

        await expect(verifyTurnstileToken('good-token', '1.2.3.4')).resolves.toBeUndefined()

        const [url, options] = fetchMock.mock.calls[0]
        expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify')
        expect(options.method).toBe('POST')
        const body = options.body as URLSearchParams
        expect(body.get('secret')).toBe('test-turnstile-secret')
        expect(body.get('response')).toBe('good-token')
        expect(body.get('remoteip')).toBe('1.2.3.4')
    })

    test('omits remoteip from the request body when not provided', async () => {
        fetchMock.mockResolvedValue({ json: async () => ({ success: true }) })
        await verifyTurnstileToken('good-token')
        const body = fetchMock.mock.calls[0][1].body as URLSearchParams
        expect(body.get('remoteip')).toBeNull()
    })

    test('throws when Cloudflare reports success: false', async () => {
        fetchMock.mockResolvedValue({ json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }) })
        await expect(verifyTurnstileToken('bad-token')).rejects.toThrow(TurnstileVerificationError)
    })

    test('throws a TurnstileVerificationError (not a raw network error) when the fetch itself fails', async () => {
        fetchMock.mockRejectedValue(new Error('network down'))
        await expect(verifyTurnstileToken('any-token')).rejects.toThrow(
            'Could not reach the captcha verification service.',
        )
    })
})
