import { describe, expect, test } from 'vitest'
import { loginSchema, forgotPasswordSchema, refreshTokenSchema, updateProfileSchema } from '../src/validators/auth.validator.js'
import { registrationSchema, sendOtpSchema } from '../src/validators/registration.validator.js'

describe('loginSchema', () => {
    test('trims and lowercases the email', () => {
        const result = loginSchema.parse({ email: '  Jane@Example.com  ', password: 'x' })
        expect(result.email).toBe('jane@example.com')
    })

    test('rejects an invalid email', () => {
        expect(() => loginSchema.parse({ email: 'not-an-email', password: 'x' })).toThrow()
    })

    test('rejects an empty password', () => {
        expect(() => loginSchema.parse({ email: 'jane@example.com', password: '' })).toThrow()
    })

    test('turnstileToken is optional', () => {
        expect(() => loginSchema.parse({ email: 'jane@example.com', password: 'x' })).not.toThrow()
    })

    test('an empty-string turnstileToken is rejected (must be omitted, not blank)', () => {
        expect(() =>
            loginSchema.parse({ email: 'jane@example.com', password: 'x', turnstileToken: '' }),
        ).toThrow()
    })
})

describe('forgotPasswordSchema / refreshTokenSchema', () => {
    test('forgotPasswordSchema requires a valid email', () => {
        expect(() => forgotPasswordSchema.parse({ email: 'bad' })).toThrow()
        expect(forgotPasswordSchema.parse({ email: 'Jane@Example.com' }).email).toBe('jane@example.com')
    })

    test('refreshTokenSchema rejects an empty token', () => {
        expect(() => refreshTokenSchema.parse({ refreshToken: '' })).toThrow()
        expect(refreshTokenSchema.parse({ refreshToken: 'abc' }).refreshToken).toBe('abc')
    })
})

describe('updateProfileSchema', () => {
    test('requires a non-empty fullName', () => {
        expect(() => updateProfileSchema.parse({ fullName: '' })).toThrow()
        expect(() => updateProfileSchema.parse({ fullName: '   ' })).toThrow()
    })

    test('phone and company are optional', () => {
        expect(() => updateProfileSchema.parse({ fullName: 'Jane' })).not.toThrow()
    })

    test('rejects an overly long phone or company', () => {
        expect(() => updateProfileSchema.parse({ fullName: 'Jane', phone: '0'.repeat(31) })).toThrow()
        expect(() => updateProfileSchema.parse({ fullName: 'Jane', company: 'a'.repeat(121) })).toThrow()
    })
})

describe('registrationSchema', () => {
    const valid = {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password1',
        role: 'agent',
        otp: '123456',
    }

    test('accepts a fully valid payload', () => {
        expect(() => registrationSchema.parse(valid)).not.toThrow()
    })

    test('rejects a password under 8 characters', () => {
        expect(() => registrationSchema.parse({ ...valid, password: 'p1' })).toThrow()
    })

    test('rejects a password with no letters', () => {
        expect(() => registrationSchema.parse({ ...valid, password: '12345678' })).toThrow()
    })

    test('rejects a password with no digits', () => {
        expect(() => registrationSchema.parse({ ...valid, password: 'onlyletters' })).toThrow()
    })

    test('rejects a role outside the fixed enum', () => {
        expect(() => registrationSchema.parse({ ...valid, role: 'admin' })).toThrow()
    })

    test('rejects an OTP that is not exactly 6 digits', () => {
        expect(() => registrationSchema.parse({ ...valid, otp: '12345' })).toThrow()
        expect(() => registrationSchema.parse({ ...valid, otp: '1234567' })).toThrow()
        expect(() => registrationSchema.parse({ ...valid, otp: 'abcdef' })).toThrow()
    })

    test('rejects a blank fullName', () => {
        expect(() => registrationSchema.parse({ ...valid, fullName: '  ' })).toThrow()
    })
})

describe('sendOtpSchema', () => {
    test('requires and normalizes a valid email', () => {
        expect(sendOtpSchema.parse({ email: 'Jane@Example.COM' }).email).toBe('jane@example.com')
        expect(() => sendOtpSchema.parse({ email: 'bad' })).toThrow()
    })
})
