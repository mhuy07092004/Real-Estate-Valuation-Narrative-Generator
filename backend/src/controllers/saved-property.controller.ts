// HTTP handlers for SavedProperty. GET returns raw JSON matching the
// frontend's BuyerSavedProperty/InvestorSavedProperty/AgentSavedProperty/
// ValuerSavedEvidence types directly (all four structurally identical),
// same no-envelope convention as the other /api/appraisal-family endpoints.
// POST/DELETE are new endpoints with no prior frontend contract to match,
// so they follow the same raw-JSON convention for consistency within this
// one resource.
import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { createSavedPropertySchema } from '../validators/saved-property.validator.js'
import {
    deleteSavedProperty as deleteSavedPropertyInDb,
    listSavedPropertiesByOwner,
    saveProperty,
} from '../services/saved-property.service.js'

function savedAgoLabel(createdAt: Date): string {
    const diffDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 1) return 'Today'
    if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    const diffMonths = Math.floor(diffDays / 30)
    if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`
    const diffYears = Math.floor(diffMonths / 12)
    return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`
}

function toSavedPropertyResponse(row: {
    savedPropertyId: string
    addressLine: string
    propertyType: string
    bedrooms: number
    bathrooms: number
    areaSqm: number
    createdAt: Date
}) {
    return {
        id: row.savedPropertyId,
        address: row.addressLine,
        savedAgo: savedAgoLabel(row.createdAt),
        propertyType: row.propertyType,
        beds: row.bedrooms,
        baths: row.bathrooms,
        areaSqm: row.areaSqm,
        createdAt: row.createdAt.toISOString(),
    }
}

export async function listSavedProperties(_req: Request, res: Response) {
    const ownerUserId = String(res.locals.userId)
    const rows = await listSavedPropertiesByOwner(ownerUserId)
    res.json(rows.map(toSavedPropertyResponse))
}

export async function createSavedProperty(req: Request, res: Response) {
    try {
        const input = createSavedPropertySchema.parse(req.body)
        const ownerUserId = String(res.locals.userId)
        const row = await saveProperty(ownerUserId, input)
        res.status(201).json(toSavedPropertyResponse(row))
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ message: 'Validation failed.', errors: error.flatten().fieldErrors })
            return
        }

        throw error
    }
}

export async function deleteSavedProperty(req: Request, res: Response) {
    const ownerUserId = String(res.locals.userId)
    const deleted = await deleteSavedPropertyInDb(req.params.savedPropertyId, ownerUserId)

    if (!deleted) {
        res.status(404).json({ message: 'Saved property not found.' })
        return
    }

    res.status(204).end()
}
