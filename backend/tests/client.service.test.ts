import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('../src/lib/prisma.js', () => ({
    prisma: {
        client: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            updateMany: vi.fn(),
        },
        report: {
            findMany: vi.fn(),
        },
    },
}))

import { prisma } from '../src/lib/prisma.js'
import {
    advanceClientToAppraisalSent,
    createClient,
    deleteClient,
    getClientById,
    listClientsByOwner,
    listReportsForClient,
    updateClient,
} from '../src/services/client.service.js'

afterEach(() => {
    vi.clearAllMocks()
})

const baseClientInput = {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '0400000000',
    status: 'prospecting' as const,
    addressLine: '1 Main St',
    suburb: 'Richmond',
    state: 'VIC',
    postcode: '3121',
}

describe('listClientsByOwner', () => {
    test('flattens Prisma\'s _count.reports into a plain reportCount field', async () => {
        vi.mocked(prisma.client.findMany).mockResolvedValue([
            { clientId: 'c1', fullName: 'Jane', _count: { reports: 3 } } as any,
        ])

        const result = await listClientsByOwner('user-1')

        expect(prisma.client.findMany).toHaveBeenCalledWith({
            where: { ownerUserId: 'user-1' },
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { reports: true } } },
        })
        expect(result).toEqual([{ clientId: 'c1', fullName: 'Jane', reportCount: 3 }])
        expect((result[0] as any)._count).toBeUndefined()
    })
})

describe('getClientById', () => {
    test('returns null (not a mapped object) when no client matches the owner', async () => {
        vi.mocked(prisma.client.findFirst).mockResolvedValue(null)
        const result = await getClientById('c1', 'user-1')
        expect(result).toBeNull()
    })

    test('scopes the lookup by both clientId and ownerUserId', async () => {
        vi.mocked(prisma.client.findFirst).mockResolvedValue({ clientId: 'c1', _count: { reports: 0 } } as any)
        await getClientById('c1', 'user-1')
        expect(prisma.client.findFirst).toHaveBeenCalledWith({
            where: { clientId: 'c1', ownerUserId: 'user-1' },
            include: { _count: { select: { reports: true } } },
        })
    })
})

describe('createClient', () => {
    test('attaches the owner id and maps the report count on the created row', async () => {
        vi.mocked(prisma.client.create).mockResolvedValue({
            clientId: 'c1',
            ...baseClientInput,
            _count: { reports: 0 },
        } as any)

        const result = await createClient('user-1', baseClientInput)

        expect(prisma.client.create).toHaveBeenCalledWith({
            data: { ownerUserId: 'user-1', ...baseClientInput },
            include: { _count: { select: { reports: true } } },
        })
        expect(result.reportCount).toBe(0)
    })
})

describe('updateClient', () => {
    test('returns null without writing when the client is not owned by this user', async () => {
        vi.mocked(prisma.client.findFirst).mockResolvedValue(null)

        const result = await updateClient('c1', 'user-1', { fullName: 'New Name' })

        expect(result).toBeNull()
        expect(prisma.client.update).not.toHaveBeenCalled()
    })

    test('updates and re-maps the report count when the client is owned', async () => {
        vi.mocked(prisma.client.findFirst).mockResolvedValue({ clientId: 'c1', _count: { reports: 2 } } as any)
        vi.mocked(prisma.client.update).mockResolvedValue({
            clientId: 'c1',
            fullName: 'New Name',
            _count: { reports: 2 },
        } as any)

        const result = await updateClient('c1', 'user-1', { fullName: 'New Name' })

        expect(prisma.client.update).toHaveBeenCalledWith({
            where: { clientId: 'c1' },
            data: { fullName: 'New Name' },
            include: { _count: { select: { reports: true } } },
        })
        expect(result?.reportCount).toBe(2)
    })
})

describe('deleteClient', () => {
    test('returns false and skips delete when the client is not owned by this user', async () => {
        vi.mocked(prisma.client.findFirst).mockResolvedValue(null)
        const result = await deleteClient('c1', 'user-1')
        expect(result).toBe(false)
        expect(prisma.client.delete).not.toHaveBeenCalled()
    })

    test('deletes and returns true when the client is owned', async () => {
        vi.mocked(prisma.client.findFirst).mockResolvedValue({ clientId: 'c1', _count: { reports: 0 } } as any)
        vi.mocked(prisma.client.delete).mockResolvedValue({} as any)

        const result = await deleteClient('c1', 'user-1')

        expect(prisma.client.delete).toHaveBeenCalledWith({ where: { clientId: 'c1' } })
        expect(result).toBe(true)
    })
})

describe('listReportsForClient', () => {
    test('derives a boolean "shared" flag from shareToken and strips the raw token from the result', async () => {
        vi.mocked(prisma.report.findMany).mockResolvedValue([
            { reportId: 'r1', shareToken: 'tok123', estimatedValue: 500000 } as any,
            { reportId: 'r2', shareToken: null, estimatedValue: 600000 } as any,
        ])

        const result = await listReportsForClient('c1', 'user-1')

        expect(result).toEqual([
            { reportId: 'r1', estimatedValue: 500000, shared: true },
            { reportId: 'r2', estimatedValue: 600000, shared: false },
        ])
    })
})

describe('advanceClientToAppraisalSent', () => {
    test('only moves clients currently in prospecting or active, never listing/sold', async () => {
        vi.mocked(prisma.client.updateMany).mockResolvedValue({ count: 1 } as any)

        await advanceClientToAppraisalSent('c1', 'user-1')

        expect(prisma.client.updateMany).toHaveBeenCalledWith({
            where: { clientId: 'c1', ownerUserId: 'user-1', status: { in: ['prospecting', 'active'] } },
            data: { status: 'appraisal_sent' },
        })
    })
})
