// Data-access layer for Report — the only file allowed to query the
// database directly for this feature. Every function is scoped by
// ownerUserId so a caller can never read or write another user's reports.
import crypto from 'node:crypto'
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

// isValuer decides caseStatus: valuer-created reports start as a 'draft'
// case; every other role leaves caseStatus null. A report is linked to a
// client only when the caller names one explicitly (clientId, ownership
// already checked by the controller) — no guessing by name or email.
export async function createReport(ownerUserId: string, input: CreateReportInput, isValuer: boolean) {
    return prisma.report.create({
        data: {
            ownerUserId,
            role: input.role,
            clientId: input.clientId ?? null,
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
            priceRangeLow: input.priceRangeLow ?? null,
            priceRangeHigh: input.priceRangeHigh ?? null,
            sectionsJson: input.sections ? JSON.stringify(input.sections) : null,
            comparablesJson: input.comparables ? JSON.stringify(input.comparables) : null,
            strategyCardsJson: input.strategyCards ? JSON.stringify(input.strategyCards) : null,
        },
    })
}

/** Returns the existing share link if one was already generated, otherwise
 *  mints a new high-entropy token and saves it. Idempotent by design — the
 *  same link keeps working across repeated "Send Report" clicks rather than
 *  rotating (and invalidating) it every time. */
export async function getOrCreateShareToken(reportId: string, ownerUserId: string): Promise<string | null> {
    const existing = await prisma.report.findFirst({ where: { reportId, ownerUserId } })
    if (!existing) return null
    if (existing.shareToken) return existing.shareToken

    const shareToken = crypto.randomBytes(24).toString('base64url')
    await prisma.report.update({ where: { reportId }, data: { shareToken } })
    return shareToken
}

/** Attaches (or updates) who this report is for. Ownership of clientId is
 *  checked by the caller; this only writes what it's given. */
export async function attachRecipient(
    reportId: string,
    ownerUserId: string,
    recipient: { clientId?: string; clientName?: string; clientEmail?: string },
) {
    if (!recipient.clientId && !recipient.clientName && !recipient.clientEmail) return
    await prisma.report.updateMany({
        where: { reportId, ownerUserId },
        data: {
            clientId: recipient.clientId,
            clientName: recipient.clientName,
            clientEmail: recipient.clientEmail,
        },
    })
}

/** Public lookup by share token — deliberately NOT scoped by ownerUserId,
 *  since the whole point is that an anonymous client (no account) can read
 *  it with just the token. */
export async function getReportByShareToken(shareToken: string) {
    return prisma.report.findUnique({
        where: { shareToken },
        include: { owner: { select: { fullName: true } } },
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
