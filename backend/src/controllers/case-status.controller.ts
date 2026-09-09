// HTTP handler for updating a valuer case — wires up the address edit and
// status dropdown on the Valuation Cases page, both previously fake/
// local-state-only. Returns the reshaped CaseItem, matching listValuerCases.
import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { updateCaseSchema } from '../validators/case-status.validator.js'
import { updateValuerCase } from '../services/report.service.js'

export async function updateCase(req: Request, res: Response) {
    try {
        const input = updateCaseSchema.parse(req.body)
        const ownerUserId = String(res.locals.userId)
        const row = await updateValuerCase(req.params.reportId, ownerUserId, input)

        if (!row) {
            res.status(404).json({ message: 'Case not found.' })
            return
        }

        res.json({
            id: row.reportId,
            address: row.propertyAddressLine,
            suburb: row.propertySuburb,
            clientName: row.clientName,
            status: row.caseStatus ?? 'draft',
            confidence: row.confidence,
            updatedAt: row.updatedAt,
        })
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ message: 'Validation failed.', errors: error.flatten().fieldErrors })
            return
        }

        throw error
    }
}
