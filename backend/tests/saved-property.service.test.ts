import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('../src/lib/prisma.js', () => ({
    prisma: {
        savedProperty: {
            findMany: vi.fn(),
            upsert: vi.fn(),
            findFirst: vi.fn(),
            delete: vi.fn(),
        },
    },
}))

import { prisma } from '../src/lib/prisma.js'
import {
    deleteSavedProperty,
    listSavedPropertiesByOwner,
    saveProperty,
} from '../src/services/saved-property.service.js'

afterEach(() => {
    vi.clearAllMocks()
})

describe('listSavedPropertiesByOwner', () => {
    test('scopes the query to the given owner and orders newest first', async () => {
        vi.mocked(prisma.savedProperty.findMany).mockResolvedValue([{ savedPropertyId: 'sp1' } as any])

        const result = await listSavedPropertiesByOwner('user-1')

        expect(prisma.savedProperty.findMany).toHaveBeenCalledWith({
            where: { ownerUserId: 'user-1' },
            orderBy: { createdAt: 'desc' },
        })
        expect(result).toEqual([{ savedPropertyId: 'sp1' }])
    })
})

describe('saveProperty', () => {
    test('upserts keyed by (ownerUserId, addressLine) so re-saving the same address updates, not duplicates', async () => {
        const input = { addressLine: '1 Main St', propertyType: 'house', bedrooms: 3, bathrooms: 2, areaSqm: 400 }
        vi.mocked(prisma.savedProperty.upsert).mockResolvedValue({ savedPropertyId: 'sp1', ...input } as any)

        await saveProperty('user-1', input)

        expect(prisma.savedProperty.upsert).toHaveBeenCalledWith({
            where: { ownerUserId_addressLine: { ownerUserId: 'user-1', addressLine: '1 Main St' } },
            update: input,
            create: { ownerUserId: 'user-1', ...input },
        })
    })
})

describe('deleteSavedProperty', () => {
    test('deletes and returns true when the property belongs to the owner', async () => {
        vi.mocked(prisma.savedProperty.findFirst).mockResolvedValue({ savedPropertyId: 'sp1' } as any)
        vi.mocked(prisma.savedProperty.delete).mockResolvedValue({} as any)

        const result = await deleteSavedProperty('sp1', 'user-1')

        expect(prisma.savedProperty.findFirst).toHaveBeenCalledWith({
            where: { savedPropertyId: 'sp1', ownerUserId: 'user-1' },
        })
        expect(prisma.savedProperty.delete).toHaveBeenCalledWith({ where: { savedPropertyId: 'sp1' } })
        expect(result).toBe(true)
    })

    test('returns false and never calls delete when the property does not belong to the owner', async () => {
        vi.mocked(prisma.savedProperty.findFirst).mockResolvedValue(null)

        const result = await deleteSavedProperty('sp1', 'someone-else')

        expect(result).toBe(false)
        expect(prisma.savedProperty.delete).not.toHaveBeenCalled()
    })
})
