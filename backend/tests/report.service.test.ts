import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('../src/lib/prisma.js', () => ({
    prisma: {
        report: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
            findUnique: vi.fn(),
        },
    },
}))

import { prisma } from '../src/lib/prisma.js'
import {
    attachRecipient,
    createReport,
    getOrCreateShareToken,
    getReportByShareToken,
    getReportById,
    listReportsByOwner,
    listReportsByOwnerAndRole,
    updateValuerCase,
} from '../src/services/report.service.js'

afterEach(() => {
    vi.clearAllMocks()
})

const baseReportInput = {
    role: 'agent' as const,
    clientName: 'Jane Doe',
    clientEmail: 'jane@example.com',
    propertyAddressLine: '1 Main St',
    propertySuburb: 'Richmond',
    propertyState: 'VIC',
    propertyPostcode: '3121',
    propertyType: 'house',
    bedrooms: 3,
    bathrooms: 2,
    parking: 1,
    landSizeSqm: 400,
    reportTemplateId: 'vendor-appraisal',
    estimatedValue: 900000,
    narrativeText: 'Some narrative',
}

describe('listReportsByOwner / listReportsByOwnerAndRole', () => {
    test('listReportsByOwner scopes only by owner', async () => {
        vi.mocked(prisma.report.findMany).mockResolvedValue([])
        await listReportsByOwner('user-1')
        expect(prisma.report.findMany).toHaveBeenCalledWith({
            where: { ownerUserId: 'user-1' },
            orderBy: { createdAt: 'desc' },
        })
    })

    test('listReportsByOwnerAndRole also scopes by role, so a role view never leaks other roles\' reports', async () => {
        vi.mocked(prisma.report.findMany).mockResolvedValue([])
        await listReportsByOwnerAndRole('user-1', 'valuer')
        expect(prisma.report.findMany).toHaveBeenCalledWith({
            where: { ownerUserId: 'user-1', role: 'valuer' },
            orderBy: { createdAt: 'desc' },
        })
    })
})

describe('getReportById', () => {
    test('scopes by both reportId and ownerUserId', async () => {
        vi.mocked(prisma.report.findFirst).mockResolvedValue(null)
        await getReportById('r1', 'user-1')
        expect(prisma.report.findFirst).toHaveBeenCalledWith({ where: { reportId: 'r1', ownerUserId: 'user-1' } })
    })
})

describe('createReport', () => {
    test('valuer-created reports start with caseStatus "draft"', async () => {
        vi.mocked(prisma.report.create).mockResolvedValue({} as any)
        await createReport('user-1', { ...baseReportInput, role: 'valuer' }, true)

        const call = vi.mocked(prisma.report.create).mock.calls[0][0] as any
        expect(call.data.caseStatus).toBe('draft')
        expect(call.data.role).toBe('valuer')
    })

    test('non-valuer reports leave caseStatus null even if isValuer flag is miswired for the role', async () => {
        vi.mocked(prisma.report.create).mockResolvedValue({} as any)
        await createReport('user-1', baseReportInput, false)

        const call = vi.mocked(prisma.report.create).mock.calls[0][0] as any
        expect(call.data.caseStatus).toBeNull()
    })

    test('links to a client only when clientId is explicitly provided', async () => {
        vi.mocked(prisma.report.create).mockResolvedValue({} as any)
        await createReport('user-1', baseReportInput, false)
        let call = vi.mocked(prisma.report.create).mock.calls[0][0] as any
        expect(call.data.clientId).toBeNull()

        vi.mocked(prisma.report.create).mockClear()
        await createReport('user-1', { ...baseReportInput, clientId: '11111111-1111-1111-1111-111111111111' }, false)
        call = vi.mocked(prisma.report.create).mock.calls[0][0] as any
        expect(call.data.clientId).toBe('11111111-1111-1111-1111-111111111111')
    })

    test('optional ROI/affordability/snapshot fields default to null and JSON-serialize snapshot arrays only when present', async () => {
        vi.mocked(prisma.report.create).mockResolvedValue({} as any)
        await createReport('user-1', baseReportInput, false)

        const call = vi.mocked(prisma.report.create).mock.calls[0][0] as any
        expect(call.data.roiGrossYieldPct).toBeNull()
        expect(call.data.affordabilityMaxLoanAmount).toBeNull()
        expect(call.data.sectionsJson).toBeNull()
        expect(call.data.comparablesJson).toBeNull()
        expect(call.data.strategyCardsJson).toBeNull()
    })
})

describe('getOrCreateShareToken', () => {
    test('returns null when the report is not owned by this user', async () => {
        vi.mocked(prisma.report.findFirst).mockResolvedValue(null)
        const result = await getOrCreateShareToken('r1', 'user-1')
        expect(result).toBeNull()
        expect(prisma.report.update).not.toHaveBeenCalled()
    })

    test('returns the existing token unchanged (idempotent) if one already exists', async () => {
        vi.mocked(prisma.report.findFirst).mockResolvedValue({ shareToken: 'existing-token' } as any)
        const result = await getOrCreateShareToken('r1', 'user-1')
        expect(result).toBe('existing-token')
        expect(prisma.report.update).not.toHaveBeenCalled()
    })

    test('mints and persists a new token when none exists yet', async () => {
        vi.mocked(prisma.report.findFirst).mockResolvedValue({ shareToken: null } as any)
        vi.mocked(prisma.report.update).mockResolvedValue({} as any)

        const result = await getOrCreateShareToken('r1', 'user-1')

        expect(typeof result).toBe('string')
        expect(result!.length).toBeGreaterThan(10)
        expect(prisma.report.update).toHaveBeenCalledWith({
            where: { reportId: 'r1' },
            data: { shareToken: result },
        })
    })
})

describe('attachRecipient', () => {
    test('is a no-op (never calls Prisma) when no recipient field is given', async () => {
        await attachRecipient('r1', 'user-1', {})
        expect(prisma.report.updateMany).not.toHaveBeenCalled()
    })

    test('writes the given recipient fields scoped by report + owner', async () => {
        await attachRecipient('r1', 'user-1', { clientName: 'Jane', clientEmail: 'jane@example.com' })
        expect(prisma.report.updateMany).toHaveBeenCalledWith({
            where: { reportId: 'r1', ownerUserId: 'user-1' },
            data: { clientId: undefined, clientName: 'Jane', clientEmail: 'jane@example.com' },
        })
    })
})

describe('getReportByShareToken', () => {
    test('looks up by shareToken alone, deliberately not scoped by owner (public/anonymous access)', async () => {
        vi.mocked(prisma.report.findUnique).mockResolvedValue({ reportId: 'r1' } as any)
        await getReportByShareToken('tok123')
        expect(prisma.report.findUnique).toHaveBeenCalledWith({
            where: { shareToken: 'tok123' },
            include: { owner: { select: { fullName: true } } },
        })
    })
})

describe('updateValuerCase', () => {
    test('returns null when the report does not belong to this user\'s valuer role', async () => {
        vi.mocked(prisma.report.findFirst).mockResolvedValue(null)
        const result = await updateValuerCase('r1', 'user-1', { status: 'approved' })
        expect(result).toBeNull()
        expect(prisma.report.update).not.toHaveBeenCalled()
    })

    test('looks up scoped by role "valuer" specifically, not just ownership', async () => {
        vi.mocked(prisma.report.findFirst).mockResolvedValue({ reportId: 'r1' } as any)
        vi.mocked(prisma.report.update).mockResolvedValue({} as any)

        await updateValuerCase('r1', 'user-1', { status: 'approved' })

        expect(prisma.report.findFirst).toHaveBeenCalledWith({
            where: { reportId: 'r1', ownerUserId: 'user-1', role: 'valuer' },
        })
        expect(prisma.report.update).toHaveBeenCalledWith({
            where: { reportId: 'r1' },
            data: { propertyAddressLine: undefined, caseStatus: 'approved' },
        })
    })
})
