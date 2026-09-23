// HTTP handlers for the Report API. Follows the { success, data } /
// { success, message, errors } envelope, matching PersistedReport/
// ApiResponse usage in common.ts and StoredReportRow usage in agent.ts
// and dashboard.ts.
import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { createReportSchema, recipientSchema, sendReportEmailSchema } from '../validators/report.validator.js'
import {
    attachRecipient,
    createReport as createReportInDb,
    getOrCreateShareToken,
    getReportById,
    getReportByShareToken,
    listReportsByOwner,
} from '../services/report.service.js'
import { getReportTemplateForRole, type ReportRole } from '../services/report-content.service.js'
import { findUserById } from '../services/user.service.js'
import { advanceClientToAppraisalSent, getClientById } from '../services/client.service.js'
import { sendReportEmail as sendReportEmailViaResend } from '../services/email.service.js'

function zodErrors(err: ZodError): Record<string, string> {
    const errors: Record<string, string> = {}
    const flattened = err.flatten().fieldErrors
    for (const [field, messages] of Object.entries(flattened)) {
        if (messages?.[0]) errors[field] = messages[0]
    }
    return errors
}

function unknownClient(res: Response) {
    res.status(400).json({ success: false, message: 'Validation failed.', errors: { clientId: 'Client not found.' } })
}

export async function listReports(_req: Request, res: Response) {
    const ownerUserId = String(res.locals.userId)
    const rows = await listReportsByOwner(ownerUserId)
    res.json({ success: true, data: rows })
}

export async function getReport(req: Request, res: Response) {
    const ownerUserId = String(res.locals.userId)
    const row = await getReportById(req.params.reportId, ownerUserId)

    if (!row) {
        res.status(404).json({ success: false, message: 'Report not found.' })
        return
    }

    res.json({ success: true, data: row })
}

/** Agent-only: mints (or returns the existing) public share link for a
 *  report they own. */
export async function createShareLink(req: Request, res: Response) {
    let recipient
    try {
        recipient = recipientSchema.parse(req.body ?? {})
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ success: false, message: 'Validation failed.', errors: zodErrors(error) })
            return
        }
        throw error
    }

    const ownerUserId = String(res.locals.userId)
    if (recipient.clientId && !(await getClientById(recipient.clientId, ownerUserId))) {
        return unknownClient(res)
    }

    const shareToken = await getOrCreateShareToken(req.params.reportId, ownerUserId)

    if (!shareToken) {
        res.status(404).json({ success: false, message: 'Report not found.' })
        return
    }

    await attachRecipient(req.params.reportId, ownerUserId, recipient)

    res.json({ success: true, data: { shareToken } })
}

/** Agent-only: mints (or reuses) the share link, same as createShareLink,
 *  and additionally emails it to the client address the agent typed in. */
export async function sendReportEmail(req: Request, res: Response) {
    let input
    try {
        input = sendReportEmailSchema.parse(req.body)
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ success: false, message: 'Validation failed.', errors: zodErrors(error) })
            return
        }
        throw error
    }

    const ownerUserId = String(res.locals.userId)
    if (input.clientId && !(await getClientById(input.clientId, ownerUserId))) {
        return unknownClient(res)
    }

    const shareToken = await getOrCreateShareToken(req.params.reportId, ownerUserId)
    if (!shareToken) {
        res.status(404).json({ success: false, message: 'Report not found.' })
        return
    }

    await attachRecipient(req.params.reportId, ownerUserId, input)

    const owner = await findUserById(ownerUserId)
    const shareUrl = `${process.env.PUBLIC_APP_URL ?? 'http://localhost:5173'}/shared-report/${shareToken}`

    try {
        await sendReportEmailViaResend({
            to: input.clientEmail,
            clientName: input.clientName,
            agentName: owner?.fullName ?? 'Your agent',
            shareUrl,
            note: input.note,
        })
    } catch (error) {
        res.status(502).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to send report email.',
        })
        return
    }

    // Only a real email moves the client's stage; copying a link doesn't.
    const report = await getReportById(req.params.reportId, ownerUserId)
    if (report?.clientId) await advanceClientToAppraisalSent(report.clientId, ownerUserId)

    res.json({ success: true, message: 'Report emailed to client.', data: { shareUrl } })
}

function safeJsonParse<T>(raw: string | null): T | null {
    if (!raw) return null
    try {
        return JSON.parse(raw) as T
    } catch {
        return null
    }
}

/** Public, unauthenticated: anyone with the token can view this one report.
 *  Explicitly shapes the response — never spreads the raw Prisma row —
 *  so nothing beyond what a client should see (ownerUserId, shareToken
 *  itself, clientEmail) ever leaks through this endpoint. */
export async function getPublicReport(req: Request, res: Response) {
    const row = await getReportByShareToken(req.params.token)

    if (!row) {
        res.status(404).json({ success: false, message: 'This link is invalid or has expired.' })
        return
    }

    const template = getReportTemplateForRole(row.role as ReportRole)

    res.json({
        success: true,
        data: {
            reportTitle: template.title,
            propertyAddressLine: row.propertyAddressLine,
            propertySuburb: row.propertySuburb,
            propertyState: row.propertyState,
            propertyPostcode: row.propertyPostcode,
            propertyType: row.propertyType,
            bedrooms: row.bedrooms,
            bathrooms: row.bathrooms,
            parking: row.parking,
            landSizeSqm: row.landSizeSqm,
            estimatedValue: row.estimatedValue,
            priceRangeLow: row.priceRangeLow,
            priceRangeHigh: row.priceRangeHigh,
            sections: safeJsonParse(row.sectionsJson),
            comparables: safeJsonParse(row.comparablesJson),
            strategyCards: safeJsonParse(row.strategyCardsJson),
            preparedByName: row.owner.fullName,
            preparedByRole: row.role,
            createdAt: row.createdAt,
        },
    })
}

export async function createReport(req: Request, res: Response) {
    try {
        const input = createReportSchema.parse(req.body)
        const ownerUserId = String(res.locals.userId)
        const client = input.clientId ? await getClientById(input.clientId, ownerUserId) : null
        if (input.clientId && !client) return unknownClient(res)

        const isValuer = input.role === 'valuer'
        const row = await createReportInDb(
            ownerUserId,
            { ...input, clientName: input.clientName ?? client?.fullName, clientEmail: input.clientEmail ?? client?.email },
            isValuer,
        )
        res.status(201).json({ success: true, data: { reportId: row.reportId } })
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ success: false, message: 'Validation failed.', errors: zodErrors(error) })
            return
        }

        throw error
    }
}
