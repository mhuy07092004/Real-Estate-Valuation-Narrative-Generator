// Data-access layer for Client — the only file allowed to query the
// database directly for this feature. Every function is scoped by
// ownerUserId so a caller can never read or write another user's clients.
import { prisma } from '../lib/prisma.js'
import type { CreateClientInput, UpdateClientInput } from '../validators/client.validator.js'

// Report count comes from the database, not from the frontend re-fetching
// every report and matching by email.
const withReportCount = { _count: { select: { reports: true } } } as const

function toRow<T extends { _count: { reports: number } }>({ _count, ...client }: T) {
    return { ...client, reportCount: _count.reports }
}

export async function listClientsByOwner(ownerUserId: string) {
    const rows = await prisma.client.findMany({
        where: { ownerUserId },
        orderBy: { createdAt: 'desc' },
        include: withReportCount,
    })
    return rows.map(toRow)
}

export async function getClientById(clientId: string, ownerUserId: string) {
    const row = await prisma.client.findFirst({
        where: { clientId, ownerUserId },
        include: withReportCount,
    })
    return row ? toRow(row) : null
}

export async function createClient(ownerUserId: string, input: CreateClientInput) {
    const row = await prisma.client.create({
        data: { ownerUserId, ...input },
        include: withReportCount,
    })
    return toRow(row)
}

export async function updateClient(clientId: string, ownerUserId: string, input: UpdateClientInput) {
    const existing = await getClientById(clientId, ownerUserId)
    if (!existing) return null

    const row = await prisma.client.update({
        where: { clientId },
        data: input,
        include: withReportCount,
    })
    return toRow(row)
}

export async function deleteClient(clientId: string, ownerUserId: string) {
    const existing = await getClientById(clientId, ownerUserId)
    if (!existing) return false

    await prisma.client.delete({ where: { clientId } })
    return true
}

/** A client's reports, newest first, lean fields only (no narrative/JSON blobs). */
export async function listReportsForClient(clientId: string, ownerUserId: string) {
    const rows = await prisma.report.findMany({
        where: { clientId, ownerUserId },
        orderBy: { createdAt: 'desc' },
        select: {
            reportId: true,
            propertyAddressLine: true,
            propertySuburb: true,
            estimatedValue: true,
            shareToken: true,
            createdAt: true,
        },
    })
    return rows.map(({ shareToken, ...row }) => ({ ...row, shared: shareToken !== null }))
}

/** Forward-only: never moves a client already at listing/sold. */
export async function advanceClientToAppraisalSent(clientId: string, ownerUserId: string) {
    await prisma.client.updateMany({
        where: { clientId, ownerUserId, status: { in: ['prospecting', 'active'] } },
        data: { status: 'appraisal_sent' },
    })
}
