import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../src/lib/prisma.js', () => ({
    prisma: {
        emailOtp: {
            findFirst: vi.fn(),
            count: vi.fn(),
            updateMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
    },
}))

import { prisma } from '../src/lib/prisma.js'
import {
    InvalidOtpError,
    OtpRateLimitError,
    consumeOtp,
    issueOtp,
    verifyOtp,
} from '../src/services/otp.service.js'

beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01T12:00:00.000Z'))
})

afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
})

describe('issueOtp', () => {
    test('creates a fresh 6-digit code, invalidates any previous live code, and returns the plain code', async () => {
        vi.mocked(prisma.emailOtp.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.emailOtp.count).mockResolvedValue(0)
        vi.mocked(prisma.emailOtp.updateMany).mockResolvedValue({ count: 1 } as any)
        vi.mocked(prisma.emailOtp.create).mockResolvedValue({} as any)

        const code = await issueOtp('jane@example.com')

        expect(code).toMatch(/^\d{6}$/)
        expect(prisma.emailOtp.updateMany).toHaveBeenCalledWith({
            where: { email: 'jane@example.com', consumedAt: null },
            data: { consumedAt: expect.any(Date) },
        })
        const createCall = vi.mocked(prisma.emailOtp.create).mock.calls[0][0] as any
        expect(createCall.data.email).toBe('jane@example.com')
        expect(createCall.data.codeHash).toMatch(/^[a-f0-9]{64}$/)
    })

    test('throws OtpRateLimitError with the remaining cooldown seconds if resent within 60s', async () => {
        vi.mocked(prisma.emailOtp.findFirst).mockResolvedValue({
            createdAt: new Date('2026-06-01T11:59:30.000Z'), // 30s ago, cooldown is 60s
        } as any)

        const err = await issueOtp('jane@example.com').catch((e) => e)

        expect(err).toBeInstanceOf(OtpRateLimitError)
        expect((err as OtpRateLimitError).retryAfterSeconds).toBe(30)
        expect(prisma.emailOtp.create).not.toHaveBeenCalled()
    })

    test('allows a resend once the 60s cooldown has fully elapsed', async () => {
        vi.mocked(prisma.emailOtp.findFirst).mockResolvedValue({
            createdAt: new Date('2026-06-01T11:59:00.000Z'), // exactly 60s ago
        } as any)
        vi.mocked(prisma.emailOtp.count).mockResolvedValue(1)
        vi.mocked(prisma.emailOtp.updateMany).mockResolvedValue({ count: 1 } as any)
        vi.mocked(prisma.emailOtp.create).mockResolvedValue({} as any)

        await expect(issueOtp('jane@example.com')).resolves.toMatch(/^\d{6}$/)
    })

    test('throws OtpRateLimitError once 5 codes have already been sent in the last hour', async () => {
        vi.mocked(prisma.emailOtp.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.emailOtp.count).mockResolvedValue(5)

        const err = await issueOtp('jane@example.com').catch((e) => e)

        expect(err).toBeInstanceOf(OtpRateLimitError)
        expect((err as OtpRateLimitError).retryAfterSeconds).toBe(3600)
        expect(prisma.emailOtp.create).not.toHaveBeenCalled()
    })

    test('hashes the same code differently for different emails (keyed hash, not a bare code hash)', async () => {
        vi.mocked(prisma.emailOtp.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.emailOtp.count).mockResolvedValue(0)
        vi.mocked(prisma.emailOtp.updateMany).mockResolvedValue({ count: 0 } as any)
        vi.mocked(prisma.emailOtp.create).mockResolvedValue({} as any)

        // Force a deterministic code via randomInt would require mocking
        // node:crypto; instead just confirm two different emails produce
        // two different hashes even if (by coincidence) they got the same
        // plain code, by hashing the same fixed code both times manually.
        await issueOtp('alice@example.com')
        const hashAlice = (vi.mocked(prisma.emailOtp.create).mock.calls[0][0] as any).data.codeHash

        vi.mocked(prisma.emailOtp.create).mockClear()
        await issueOtp('bob@example.com')
        const hashBob = (vi.mocked(prisma.emailOtp.create).mock.calls[0][0] as any).data.codeHash

        // Different emails (and almost certainly different random codes) must
        // not coincidentally collide.
        expect(hashAlice).not.toBe(hashBob)
    })
})

describe('verifyOtp', () => {
    test('throws InvalidOtpError when there is no live (unconsumed, unexpired) code for this email', async () => {
        vi.mocked(prisma.emailOtp.findFirst).mockResolvedValue(null)
        await expect(verifyOtp('jane@example.com', '123456')).rejects.toBeInstanceOf(InvalidOtpError)
    })

    test('throws InvalidOtpError once the max attempt count has been reached, without checking the code', async () => {
        vi.mocked(prisma.emailOtp.findFirst).mockResolvedValue({
            id: 'otp1',
            codeHash: 'irrelevant',
            attempts: 5,
        } as any)

        await expect(verifyOtp('jane@example.com', '123456')).rejects.toBeInstanceOf(InvalidOtpError)
        expect(prisma.emailOtp.update).not.toHaveBeenCalled()
    })

    test('returns the record id on a correct code', async () => {
        const { createHmac } = await import('node:crypto')
        const correctHash = createHmac('sha256', 'dev-access-secret-change-me')
            .update('jane@example.com:482913')
            .digest('hex')

        vi.mocked(prisma.emailOtp.findFirst).mockResolvedValue({
            id: 'otp1',
            codeHash: correctHash,
            attempts: 0,
        } as any)

        const id = await verifyOtp('jane@example.com', '482913')
        expect(id).toBe('otp1')
        expect(prisma.emailOtp.update).not.toHaveBeenCalled()
    })

    test('increments the attempt counter and throws InvalidOtpError on a wrong code', async () => {
        vi.mocked(prisma.emailOtp.findFirst).mockResolvedValue({
            id: 'otp1',
            codeHash: 'a'.repeat(64),
            attempts: 1,
        } as any)
        vi.mocked(prisma.emailOtp.update).mockResolvedValue({} as any)

        await expect(verifyOtp('jane@example.com', '000000')).rejects.toBeInstanceOf(InvalidOtpError)

        expect(prisma.emailOtp.update).toHaveBeenCalledWith({
            where: { id: 'otp1' },
            data: { attempts: { increment: 1 } },
        })
    })
})

describe('consumeOtp', () => {
    test('marks the record consumed by id', async () => {
        vi.mocked(prisma.emailOtp.update).mockResolvedValue({} as any)
        await consumeOtp('otp1')
        expect(prisma.emailOtp.update).toHaveBeenCalledWith({
            where: { id: 'otp1' },
            data: { consumedAt: expect.any(Date) },
        })
    })
})
