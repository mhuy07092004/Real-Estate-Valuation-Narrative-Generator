// Data-access layer for Report — the only file allowed to query the
// database directly for this feature. Every function is scoped by
// ownerUserId so a caller can never read or write another user's reports.
import { prisma } from '../lib/prisma.js'
import type { CreateReportInput } from '../validators/report.validator.js'
import type { UpdateCaseInput } from '../validators/case-status.validator.js'

export async function listReportsByOwner(ownerUserId: string) {
    return prisma.report.findMany({
        where: { ownerUserId },
        orderBy: { createdAt: 'desc' },
    })
}

// Scoped to a single dashboard role — the per-role list pages (agent's
// Client Report, buyer/investor's Reports, valuer's Cases) must only ever
// see reports created under that same role, not everything the account
// has ever saved across every role it's used.
export async function listReportsByOwnerAndRole(ownerUserId: string, role: string) {
    return prisma.report.findMany({
        where: { ownerUserId, role },
        orderBy: { createdAt: 'desc' },
    })
}

export async function getReportById(reportId: string, ownerUserId: string) {
    return prisma.report.findFirst({
        where: { reportId, ownerUserId },
    })
}

// Matches an existing client by name or email — never creates one, since a
// report only ever carries a name/email, not the phone/address a Client
// row requires. No match just means the report keeps clientName/clientEmail
// as free text with no clientId link.
async function findMatchingClientId(
    ownerUserId: string,
    clientName?: string,
    clientEmail?: string,
): Promise<string | null> {
    if (!clientName && !clientEmail) return null

    const candidates = await prisma.client.findMany({ where: { ownerUserId } })
    const name = clientName?.trim().toLowerCase()
    const email = clientEmail?.trim().toLowerCase()

    const match = candidates.find(
        (client) =>
            (name && client.fullName.trim().toLowerCase() === name) ||
            (email && client.email.trim().toLowerCase() === email),
    )

    return match?.clientId ?? null
}

// isValuer decides caseStatus: valuer-created reports start as a 'draft'
// case; every other role leaves caseStatus null.
export async function createReport(ownerUserId: string, input: CreateReportInput, isValuer: boolean) {
    const clientId = await findMatchingClientId(ownerUserId, input.clientName, input.clientEmail)

    return prisma.report.create({
        data: {
            ownerUserId,
            role: input.role,
            clientId,
            clientName: input.clientName,
            clientEmail: input.clientEmail,
            propertyAddressLine: input.propertyAddressLine,
            propertySuburb: input.propertySuburb,
            propertyState: input.propertyState,
            propertyPostcode: input.propertyPostcode,
            propertyType: input.propertyType,
            bedrooms: input.bedrooms,
            bathrooms: input.bathrooms,
            parking: input.parking,
            landSizeSqm: input.landSizeSqm,
            reportTemplateId: input.reportTemplateId,
            estimatedValue: input.estimatedValue,
            narrativeText: input.narrativeText,
            pdfStoragePath: input.pdfStoragePath,
            caseStatus: isValuer ? 'draft' : null,
            roiGrossYieldPct: input.roiGrossYieldPct ?? null,
            roiNetYieldPct: input.roiNetYieldPct ?? null,
            roiMonthlyCashFlow: input.roiMonthlyCashFlow ?? null,
            roiCashOnCashReturnPct: input.roiCashOnCashReturnPct ?? null,
            affordabilityEstimatedBorrowingCapacity: input.affordabilityEstimatedBorrowingCapacity ?? null,
            affordabilityMaxLoanAmount: input.affordabilityMaxLoanAmount ?? null,
            affordabilityRepaymentToIncomePct: input.affordabilityRepaymentToIncomePct ?? null,
        },
    })
}

// Scoped to role: 'valuer' as well as ownerUserId — a case update should
// only ever touch a report that actually belongs to the valuer workflow,
// not just any report this account happens to own.
export async function updateValuerCase(reportId: string, ownerUserId: string, input: UpdateCaseInput) {
    const existing = await prisma.report.findFirst({
        where: { reportId, ownerUserId, role: 'valuer' },
    })
    if (!existing) return null

    return prisma.report.update({
        where: { reportId },
        data: {
            propertyAddressLine: input.addressLine ?? undefined,
            caseStatus: input.status ?? undefined,
        },
    })
}
