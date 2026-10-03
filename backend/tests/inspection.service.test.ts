import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('../src/lib/prisma.js', () => ({
    prisma: {
        inspection: {
            findMany: vi.fn(),
            create: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn(),
        },
    },
}))

import { prisma } from '../src/lib/prisma.js'
import {
    createInspection,
    listInspectionsByOwner,
    updateInspection,
} from '../src/services/inspection.service.js'

afterEach(() => {
    vi.clearAllMocks()
})

const rawRow = {
    inspectionId: 'i1',
    addressLine: '1 Main St',
    suburb: 'Richmond',
    inspectionDate: new Date('2026-05-01T00:00:00.000Z'),
    agentsJson: JSON.stringify(['Alice']),
    overallNotes: 'Looks good',
    checklistJson: JSON.stringify([{ id: 'item-1', label: 'Roof', description: '', status: 'ok' }]),
}

describe('listInspectionsByOwner', () => {
    test('parses the JSON agents/checklist columns and ISO-formats the date', async () => {
        vi.mocked(prisma.inspection.findMany).mockResolvedValue([rawRow] as any)

        const [result] = await listInspectionsByOwner('user-1')

        expect(prisma.inspection.findMany).toHaveBeenCalledWith({
            where: { ownerUserId: 'user-1' },
            orderBy: { inspectionDate: 'asc' },
        })
        expect(result.agents).toEqual(['Alice'])
        expect(result.checklist).toEqual([{ id: 'item-1', label: 'Roof', description: '', status: 'ok' }])
        expect(result.inspectionDate).toBe('2026-05-01T00:00:00.000Z')
        expect(result.id).toBe('i1')
        expect(result.address).toBe('1 Main St')
    })
})

describe('createInspection', () => {
    test('seeds a new inspection with the standard 10-item blank checklist', async () => {
        vi.mocked(prisma.inspection.create).mockImplementation(async ({ data }: any) => ({
            inspectionId: 'i2',
            addressLine: data.addressLine,
            suburb: data.suburb,
            inspectionDate: data.inspectionDate,
            agentsJson: data.agentsJson,
            overallNotes: data.overallNotes,
            checklistJson: data.checklistJson,
        }))

        const result = await createInspection('user-1', {
            addressLine: '2 Side St',
            suburb: 'Fitzroy',
            inspectionDate: '2026-06-01',
            agents: ['Bob'],
        })

        expect(result.checklist).toHaveLength(10)
        expect(result.checklist.every((item) => item.status === 'not_checked')).toBe(true)
        expect(result.overallNotes).toBe('')
        expect(result.agents).toEqual(['Bob'])

        const createCall = vi.mocked(prisma.inspection.create).mock.calls[0][0] as any
        expect(createCall.data.ownerUserId).toBe('user-1')
        expect(createCall.data.inspectionDate).toBeInstanceOf(Date)
    })

    test('checklist item ids are unique and sequential (item-1..item-10)', async () => {
        vi.mocked(prisma.inspection.create).mockImplementation(async ({ data }: any) => ({
            inspectionId: 'i3',
            ...data,
        }))

        const result = await createInspection('user-1', {
            addressLine: 'x',
            suburb: 'y',
            inspectionDate: '2026-06-01',
            agents: ['A'],
        })

        expect(result.checklist.map((item) => item.id)).toEqual(
            Array.from({ length: 10 }, (_, i) => `item-${i + 1}`),
        )
    })
})

describe('updateInspection', () => {
    test('returns null without writing when the inspection is not owned by this user', async () => {
        vi.mocked(prisma.inspection.findFirst).mockResolvedValue(null)

        const result = await updateInspection('i1', 'user-1', {
            address: 'a',
            suburb: 'b',
            inspectionDate: '2026-01-01',
            agents: ['A'],
            overallNotes: '',
            checklist: [],
        })

        expect(result).toBeNull()
        expect(prisma.inspection.update).not.toHaveBeenCalled()
    })

    test('persists the full replacement checklist/notes/agents when owned', async () => {
        vi.mocked(prisma.inspection.findFirst).mockResolvedValue({ inspectionId: 'i1' } as any)
        vi.mocked(prisma.inspection.update).mockResolvedValue({
            ...rawRow,
            overallNotes: 'Updated notes',
            agentsJson: JSON.stringify(['Carol']),
        } as any)

        const result = await updateInspection('i1', 'user-1', {
            address: '1 Main St',
            suburb: 'Richmond',
            inspectionDate: '2026-05-02',
            agents: ['Carol'],
            overallNotes: 'Updated notes',
            checklist: [{ id: 'item-1', label: 'Roof', description: '', status: 'concern' }],
        })

        expect(result?.overallNotes).toBe('Updated notes')
        expect(result?.agents).toEqual(['Carol'])

        const updateCall = vi.mocked(prisma.inspection.update).mock.calls[0][0] as any
        expect(updateCall.where).toEqual({ inspectionId: 'i1' })
        expect(updateCall.data.addressLine).toBe('1 Main St')
        expect(JSON.parse(updateCall.data.checklistJson)).toEqual([
            { id: 'item-1', label: 'Roof', description: '', status: 'concern' },
        ])
    })
})
