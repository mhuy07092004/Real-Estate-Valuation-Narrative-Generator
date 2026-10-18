import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const tx = vi.hoisted(() => ({
    passwordResetToken: { updateMany: vi.fn() },
    user: { update: vi.fn() },
}))

vi.mock('../src/lib/prisma.js', () => ({
    prisma: {
        user: { findUnique: vi.fn() },
        passwordResetToken: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            count: vi.fn(),
            create: vi.fn(),
            updateMany: vi.fn(),
        },
        $transaction: vi.fn(async (fn: (t: typeof tx) => Promise<void>) => fn(tx)),
    },
}))
vi.mock('../src/services/email.service.js', () => ({ sendPasswordResetEmail: vi.fn() }))
vi.mock('bcryptjs', () => ({ default: { hash: vi.fn(async () => 'new-hash') } }))

import { prisma } from '../src/lib/prisma.js'
import { sendPasswordResetEmail } from '../src/services/email.service.js'
import {
    hashResetToken,
    InvalidResetTokenError,
    requestPasswordReset,
    resetPassword,
} from '../src/services/password-reset.service.js'

const activeUser = { userId: 'u1', email: 'jane@example.com', isActive: true, passwordHash: 'h' }

beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.passwordResetToken.count).mockResolvedValue(0)
    tx.passwordResetToken.updateMany.mockResolvedValue({ count: 1 })
})
afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
})

describe('requestPasswordReset', () => {
    test('stores only a hash of the token and emails the raw token link', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue(activeUser as any)

        await requestPasswordReset('jane@example.com')

        const stored = vi.mocked(prisma.passwordResetToken.create).mock.calls[0][0].data
        const { resetUrl } = vi.mocked(sendPasswordResetEmail).mock.calls[0][0]
        const token = new URL(resetUrl).searchParams.get('token')!
        expect(stored.tokenHash).toBe(hashResetToken(token))
        expect(stored.tokenHash).not.toBe(token)
    })

    test.each([
        ['unknown email', null],
        ['Google-only account', { ...activeUser, passwordHash: null }],
        ['deactivated account', { ...activeUser, isActive: false }],
    ])('sends nothing for %s', async (_label, user) => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any)

        await expect(requestPasswordReset('x@example.com')).resolves.toBeUndefined()

        expect(sendPasswordResetEmail).not.toHaveBeenCalled()
        expect(prisma.passwordResetToken.create).not.toHaveBeenCalled()
    })

    test('silently throttles a second request inside the cooldown', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue(activeUser as any)
        vi.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue({ createdAt: new Date() } as any)

        await requestPasswordReset('jane@example.com')

        expect(sendPasswordResetEmail).not.toHaveBeenCalled()
    })
})

describe('resetPassword', () => {
    const liveRecord = {
        id: 't1',
        userId: 'u1',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user: { isActive: true },
    }

    test('sets the new password, burns open links and stamps passwordChangedAt', async () => {
        vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(liveRecord as any)

        await resetPassword('raw-token', 'Newpass123')

        expect(prisma.passwordResetToken.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({ where: { tokenHash: hashResetToken('raw-token') } }),
        )
        const update = tx.user.update.mock.calls[0][0]
        expect(update.data.passwordHash).toBe('new-hash')
        expect(update.data.passwordChangedAt).toBeInstanceOf(Date)
    })

    test.each([
        ['unknown token', null],
        ['used token', { ...liveRecord, usedAt: new Date() }],
        ['expired token', { ...liveRecord, expiresAt: new Date(Date.now() - 1) }],
        ['deactivated user', { ...liveRecord, user: { isActive: false } }],
    ])('rejects an %s', async (_label, record) => {
        vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(record as any)

        await expect(resetPassword('t', 'Newpass123')).rejects.toBeInstanceOf(InvalidResetTokenError)
        expect(tx.user.update).not.toHaveBeenCalled()
    })

    test('loses cleanly when a concurrent request already used the link', async () => {
        vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(liveRecord as any)
        tx.passwordResetToken.updateMany.mockResolvedValueOnce({ count: 0 })

        await expect(resetPassword('t', 'Newpass123')).rejects.toBeInstanceOf(InvalidResetTokenError)
        expect(tx.user.update).not.toHaveBeenCalled()
    })
})
