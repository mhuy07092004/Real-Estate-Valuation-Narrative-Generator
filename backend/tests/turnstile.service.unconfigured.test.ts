import { describe, expect, test, vi } from 'vitest'

vi.mock('../src/config/env.js', () => ({
    env: {
        turnstile: { secretKey: '' },
    },
}))

import { TurnstileVerificationError, verifyTurnstileToken } from '../src/services/turnstile.service.js'

describe('verifyTurnstileToken - not configured', () => {
    test('fails closed with a clear message when TURNSTILE_SECRET_KEY is empty', async () => {
        await expect(verifyTurnstileToken('some-token')).rejects.toThrow(TurnstileVerificationError)
        await expect(verifyTurnstileToken('some-token')).rejects.toThrow(
            'Captcha is not configured on the server.',
        )
    })
})
