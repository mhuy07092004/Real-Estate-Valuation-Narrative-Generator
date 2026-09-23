import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('../src/services/user.service.js', () => ({
    findUserByEmail: vi.fn(),
    findUserById: vi.fn(),
    updateUserProfile: vi.fn(),
}))
vi.mock('../src/services/turnstile.service.js', async () => {
    const actual = await vi.importActual<typeof import('../src/services/turnstile.service.js')>(
        '../src/services/turnstile.service.js',
    )
    return { ...actual, verifyTurnstileToken: vi.fn() }
})
vi.mock('../src/services/auth-risk.service.js', () => ({
    isLoginCaptchaRequired: vi.fn(),
    recordLoginAttempt: vi.fn(),
    recordLoginFailure: vi.fn(),
    recordLoginSuccess: vi.fn(),
}))
vi.mock('bcryptjs', () => ({
    default: { compare: vi.fn(), hash: vi.fn() },
}))

import bcrypt from 'bcryptjs'
import { findUserByEmail, findUserById, updateUserProfile } from '../src/services/user.service.js'
import { verifyTurnstileToken, CaptchaRequiredError } from '../src/services/turnstile.service.js'
import {
    isLoginCaptchaRequired,
    recordLoginAttempt,
    recordLoginFailure,
    recordLoginSuccess,
} from '../src/services/auth-risk.service.js'
import { getMe, loginUser, refreshSession, updateProfile } from '../src/services/auth.service.js'
import { InvalidCredentialsError } from '../src/types/auth.types.js'
import { signRefreshToken } from '../src/services/jwt.service.js'

afterEach(() => {
    vi.clearAllMocks()
})

const storedUser = {
    userId: 'u1',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phone: null,
    company: null,
    roleName: 'agent',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    passwordHash: 'hashed-password',
}

describe('loginUser', () => {
    test('rejects invalid credentials without ever recording a "success"', async () => {
        vi.mocked(isLoginCaptchaRequired).mockReturnValue(false)
        vi.mocked(findUserByEmail).mockResolvedValue(storedUser as any)
        vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

        await expect(
            loginUser({ email: 'jane@example.com', password: 'wrong-password' }, '1.2.3.4'),
        ).rejects.toBeInstanceOf(InvalidCredentialsError)

        expect(recordLoginFailure).toHaveBeenCalled()
        expect(recordLoginSuccess).not.toHaveBeenCalled()
        expect(recordLoginAttempt).toHaveBeenCalled()
    })

    test('rejects when no user exists for the email, without leaking whether the email exists (generic error)', async () => {
        vi.mocked(isLoginCaptchaRequired).mockReturnValue(false)
        vi.mocked(findUserByEmail).mockResolvedValue(null)

        const err = await loginUser({ email: 'ghost@example.com', password: 'whatever1' }).catch((e) => e)

        expect(err).toBeInstanceOf(InvalidCredentialsError)
        expect(err.message).toBe('Invalid email or password.')
    })

    test('returns a full auth response (tokens + user) on correct credentials', async () => {
        vi.mocked(isLoginCaptchaRequired).mockReturnValue(false)
        vi.mocked(findUserByEmail).mockResolvedValue(storedUser as any)
        vi.mocked(bcrypt.compare).mockResolvedValue(true as never)

        const result = await loginUser({ email: 'jane@example.com', password: 'correct-password' })

        expect(result.user.email).toBe('jane@example.com')
        expect(typeof result.accessToken).toBe('string')
        expect(typeof result.refreshToken).toBe('string')
        expect(recordLoginSuccess).toHaveBeenCalled()
        expect(recordLoginFailure).not.toHaveBeenCalled()
    })

    test('when risk scoring demands a captcha and none is given, throws CaptchaRequiredError before ever checking the password', async () => {
        vi.mocked(isLoginCaptchaRequired).mockReturnValue(true)

        await expect(loginUser({ email: 'jane@example.com', password: 'x' })).rejects.toBeInstanceOf(
            CaptchaRequiredError,
        )
        expect(findUserByEmail).not.toHaveBeenCalled()
    })

    test('when risk scoring demands a captcha and a token is given, verifies it before proceeding', async () => {
        vi.mocked(isLoginCaptchaRequired).mockReturnValue(true)
        vi.mocked(verifyTurnstileToken).mockResolvedValue(undefined)
        vi.mocked(findUserByEmail).mockResolvedValue(storedUser as any)
        vi.mocked(bcrypt.compare).mockResolvedValue(true as never)

        await loginUser({ email: 'jane@example.com', password: 'x', turnstileToken: 'tok' }, '9.9.9.9')

        expect(verifyTurnstileToken).toHaveBeenCalledWith('tok', '9.9.9.9')
    })

    test('a login without a passwordHash (e.g. OAuth-only account) is rejected, not crashed on', async () => {
        vi.mocked(isLoginCaptchaRequired).mockReturnValue(false)
        vi.mocked(findUserByEmail).mockResolvedValue({ ...storedUser, passwordHash: null } as any)

        await expect(loginUser({ email: 'jane@example.com', password: 'x' })).rejects.toBeInstanceOf(
            InvalidCredentialsError,
        )
        expect(bcrypt.compare).not.toHaveBeenCalled()
    })
})

describe('getMe', () => {
    test('returns null when the user no longer exists', async () => {
        vi.mocked(findUserById).mockResolvedValue(null)
        expect(await getMe('u1')).toBeNull()
    })

    test('returns the frontend-shaped user when found', async () => {
        vi.mocked(findUserById).mockResolvedValue(storedUser as any)
        const result = await getMe('u1')
        expect(result?.email).toBe('jane@example.com')
        expect(result).not.toHaveProperty('passwordHash')
    })
})

describe('updateProfile', () => {
    test('normalizes blank phone/company strings to null before persisting', async () => {
        vi.mocked(updateUserProfile).mockResolvedValue(storedUser as any)

        await updateProfile('u1', { fullName: 'Jane Doe', phone: '', company: '' })

        expect(updateUserProfile).toHaveBeenCalledWith('u1', {
            fullName: 'Jane Doe',
            phone: null,
            company: null,
        })
    })

    test('passes through non-blank phone/company unchanged', async () => {
        vi.mocked(updateUserProfile).mockResolvedValue(storedUser as any)

        await updateProfile('u1', { fullName: 'Jane Doe', phone: '0400000000', company: 'Acme' })

        expect(updateUserProfile).toHaveBeenCalledWith('u1', {
            fullName: 'Jane Doe',
            phone: '0400000000',
            company: 'Acme',
        })
    })

    test('returns null when the target user no longer exists', async () => {
        vi.mocked(updateUserProfile).mockResolvedValue(null)
        expect(await updateProfile('u1', { fullName: 'Jane Doe' })).toBeNull()
    })

    test('rejects invalid input via the Zod schema before ever calling the DB layer', async () => {
        await expect(updateProfile('u1', { fullName: '' })).rejects.toThrow()
        expect(updateUserProfile).not.toHaveBeenCalled()
    })
})

describe('refreshSession', () => {
    test('issues a fresh token pair for a valid refresh token whose user still exists', async () => {
        const refreshToken = signRefreshToken({ userId: 'u1', email: 'jane@example.com', roles: ['agent'] })
        vi.mocked(findUserById).mockResolvedValue(storedUser as any)

        const result = await refreshSession({ refreshToken })

        expect(result.user.userId).toBeUndefined() // frontend user uses `id`, not `userId`
        expect(result.user.id).toBe('u1')
        expect(typeof result.accessToken).toBe('string')
    })

    test('rejects when the refresh token is malformed/invalid', async () => {
        await expect(refreshSession({ refreshToken: 'not-a-real-jwt' })).rejects.toThrow()
    })

    test('rejects when the token is valid but the user no longer exists', async () => {
        const refreshToken = signRefreshToken({ userId: 'ghost', email: 'ghost@example.com', roles: ['agent'] })
        vi.mocked(findUserById).mockResolvedValue(null)

        await expect(refreshSession({ refreshToken })).rejects.toBeInstanceOf(InvalidCredentialsError)
    })
})
