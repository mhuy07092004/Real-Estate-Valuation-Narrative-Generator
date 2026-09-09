// HTTP handlers for Inspection. Returns raw JSON matching BuyerInspection
// directly (no { success, data } envelope) — confirmed against buyer.ts's
// fetchJson usage, which types these calls as BuyerInspection[]/BuyerInspection
// directly, not ApiSuccess<T>.
import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { createInspectionSchema, updateInspectionSchema } from '../validators/inspection.validator.js'
import {
    createInspection as createInspectionInDb,
    listInspectionsByOwner,
    updateInspection as updateInspectionInDb,
} from '../services/inspection.service.js'

export async function listInspections(_req: Request, res: Response) {
    const ownerUserId = String(res.locals.userId)
    const rows = await listInspectionsByOwner(ownerUserId)
    res.json(rows)
}

export async function createInspection(req: Request, res: Response) {
    try {
        const input = createInspectionSchema.parse(req.body)
        const ownerUserId = String(res.locals.userId)
        const row = await createInspectionInDb(ownerUserId, input)
        res.status(201).json(row)
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ message: 'Validation failed.', errors: error.flatten().fieldErrors })
            return
        }

        throw error
    }
}

export async function updateInspection(req: Request, res: Response) {
    try {
        const input = updateInspectionSchema.parse(req.body)
        const ownerUserId = String(res.locals.userId)
        const row = await updateInspectionInDb(req.params.inspectionId, ownerUserId, input)

        if (!row) {
            res.status(404).json({ message: 'Inspection not found.' })
            return
        }

        res.json(row)
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ message: 'Validation failed.', errors: error.flatten().fieldErrors })
            return
        }

        throw error
    }
}
