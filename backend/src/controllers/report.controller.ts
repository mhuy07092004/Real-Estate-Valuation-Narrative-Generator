// HTTP handlers for the Report API. Follows the { success, data } /
// { success, message, errors } envelope, matching PersistedReport/
// ApiResponse usage in common.ts and StoredReportRow usage in agent.ts
// and dashboard.ts.
import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { createReportSchema } from '../validators/report.validator.js'
import {
    createReport as createReportInDb,
    getReportById,
    listReportsByOwner,
} from '../services/report.service.js'

function zodErrors(err: ZodError): Record<string, string> {
    const errors: Record<string, string> = {}
    const flattened = err.flatten().fieldErrors
    for (const [field, messages] of Object.entries(flattened)) {
        if (messages?.[0]) errors[field] = messages[0]
    }
    return errors
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

export async function createReport(req: Request, res: Response) {
    try {
        const input = createReportSchema.parse(req.body)
        const ownerUserId = String(res.locals.userId)
        const isValuer = input.role === 'valuer'
        const row = await createReportInDb(ownerUserId, input, isValuer)
        res.status(201).json({ success: true, data: { reportId: row.reportId } })
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ success: false, message: 'Validation failed.', errors: zodErrors(error) })
            return
        }

        throw error
    }
}
