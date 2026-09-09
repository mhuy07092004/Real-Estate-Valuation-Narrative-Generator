// Data-access layer for SavedProperty — the only file allowed to query the
// database directly for this feature. Every function is scoped by
// ownerUserId so a caller can never read, create, or delete another user's
// saved properties.
import { prisma } from '../lib/prisma.js'
import type { CreateSavedPropertyInput } from '../validators/saved-property.validator.js'

export async function listSavedPropertiesByOwner(ownerUserId: string) {
    return prisma.savedProperty.findMany({
        where: { ownerUserId },
        orderBy: { createdAt: 'desc' },
    })
}

// Saving the same address twice updates the existing row instead of
// duplicating it, per the (ownerUserId, addressLine) unique constraint.
export async function saveProperty(ownerUserId: string, input: CreateSavedPropertyInput) {
    return prisma.savedProperty.upsert({
        where: { ownerUserId_addressLine: { ownerUserId, addressLine: input.addressLine } },
        update: input,
        create: { ownerUserId, ...input },
    })
}

export async function deleteSavedProperty(savedPropertyId: string, ownerUserId: string) {
    const existing = await prisma.savedProperty.findFirst({
        where: { savedPropertyId, ownerUserId },
    })
    if (!existing) return false

    await prisma.savedProperty.delete({ where: { savedPropertyId } })
    return true
}
