import { describe, expect, test } from 'vitest'
import jwt from 'jsonwebtoken'
import {
    signAccessToken,
    signRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    type JwtPayload,
} from '../src/services/jwt.service.js'

const payload: JwtPayload = { userId: 'u1', email: 'jane@example.com', roles: ['agent'] }

describe('access token', () => {
    test('sign then verify round-trips the exact payload', () => {
        const token = signAccessToken(payload)
        const decoded = verifyAccessToken(token)

        expect(decoded.userId).toBe(payload.userId)
        expect(decoded.email).toBe(payload.email)
        expect(decoded.roles).toEqual(payload.roles)
    })

    test('carries a numeric exp claim in the future (expiresIn was applied)', () => {
        const token = signAccessToken(payload)
        const decoded = jwt.decode(token) as jwt.JwtPayload
        expect(typeof decoded.exp).toBe('number')
        expect(decoded.exp! * 1000).toBeGreaterThan(Date.now())
    })

    test('throws on a tampered token', () => {
        const token = signAccessToken(payload)
        const tampered = token.slice(0, -2) + (token.slice(-2) === 'aa' ? 'bb' : 'aa')
        expect(() => verifyAccessToken(tampered)).toThrow()
    })

    test('an access token signed for a different secret fails verification', () => {
        const foreignToken = jwt.sign(payload, 'some-other-secret')
        expect(() => verifyAccessToken(foreignToken)).toThrow()
    })

    test('an expired token fails verification', () => {
        const expired = jwt.sign(payload, 'dev-access-secret-change-me', { expiresIn: -10 })
        expect(() => verifyAccessToken(expired)).toThrow(/expired/i)
    })
})

describe('refresh token', () => {
    test('sign then verify round-trips the exact payload, independent of the access-token secret', () => {
        const token = signRefreshToken(payload)
        const decoded = verifyRefreshToken(token)
        expect(decoded).toMatchObject(payload)
    })

    test('an access token cannot be verified as a refresh token (different secrets)', () => {
        const accessToken = signAccessToken(payload)
        expect(() => verifyRefreshToken(accessToken)).toThrow()
    })

    test('a refresh token cannot be verified as an access token (different secrets)', () => {
        const refreshToken = signRefreshToken(payload)
        expect(() => verifyAccessToken(refreshToken)).toThrow()
    })
})
