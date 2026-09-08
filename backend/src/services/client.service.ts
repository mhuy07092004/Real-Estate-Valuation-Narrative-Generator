// Data-access layer for Client — the only file allowed to query the
// database directly for this feature. Every function is scoped by
// ownerUserId so a caller can never read or write another user's clients.
import { prisma } from '../lib/prisma.js'
import type { CreateClientInput, UpdateClientInput } from '../validators/client.validator.js'

export async function listClientsByOwner(ownerUserId: string) {
    return prisma.client.findMany({
        where: { ownerUserId },
        orderBy: { createdAt: 'desc' },
    })
}

export async function getClientById(clientId: string, ownerUserId: string) {
    return prisma.client.findFirst({
        where: { clientId, ownerUserId },
    })
}

export async function createClient(ownerUserId: string, input: CreateClientInput) {
    return prisma.client.create({
        data: { ownerUserId, ...input },
    })
}

export async function updateClient(clientId: string, ownerUserId: string, input: UpdateClientInput) {
    const existing = await getClientById(clientId, ownerUserId)
    if (!existing) return null

    return prisma.client.update({
        where: { clientId },
        data: input,
    })
}

export async function deleteClient(clientId: string, ownerUserId: string) {
    const existing = await getClientById(clientId, ownerUserId)
    if (!existing) return false

    await prisma.client.delete({ where: { clientId } })
    return true
}
