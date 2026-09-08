// HTTP handlers for the Client API: validate the request, call the
// service layer, and shape the { success, data } / { success, message,
// errors } response envelope used across the backend.
import type { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { createClientSchema, updateClientSchema } from '../validators/client.validator.js'
import {
    createClient as createClientInDb,
    deleteClient as deleteClientInDb,
    getClientById,
    listClientsByOwner,
    updateClient as updateClientInDb,
} from '../services/client.service.js'

function zodErrors(err: ZodError): Record<string, string> {
    const errors: Record<string, string> = {}
    const flattened = err.flatten().fieldErrors
    for (const [field, messages] of Object.entries(flattened)) {
        if (messages?.[0]) errors[field] = messages[0]
    }
    return errors
}

export async function listClients(_req: Request, res: Response) {
    const ownerUserId = String(res.locals.userId)
    const rows = await listClientsByOwner(ownerUserId)
    res.json({ success: true, data: rows })
}

export async function getClient(req: Request, res: Response) {
    const ownerUserId = String(res.locals.userId)
    const row = await getClientById(req.params.clientId, ownerUserId)

    if (!row) {
        res.status(404).json({ success: false, message: 'Client not found.' })
        return
    }

    res.json({ success: true, data: row })
}

export async function createClient(req: Request, res: Response) {
    try {
        const input = createClientSchema.parse(req.body)
        const ownerUserId = String(res.locals.userId)
        const row = await createClientInDb(ownerUserId, input)
        res.status(201).json({ success: true, data: row })
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ success: false, message: 'Validation failed.', errors: zodErrors(error) })
            return
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            res.status(409).json({ success: false, message: 'A client with this email already exists.' })
            return
        }

        throw error
    }
}

export async function updateClient(req: Request, res: Response) {
    try {
        const input = updateClientSchema.parse(req.body)
        const ownerUserId = String(res.locals.userId)
        const row = await updateClientInDb(req.params.clientId, ownerUserId, input)

        if (!row) {
            res.status(404).json({ success: false, message: 'Client not found.' })
            return
        }

        res.json({ success: true, data: row })
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ success: false, message: 'Validation failed.', errors: zodErrors(error) })
            return
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            res.status(409).json({ success: false, message: 'A client with this email already exists.' })
            return
        }

        throw error
    }
}

export async function deleteClient(req: Request, res: Response) {
    const ownerUserId = String(res.locals.userId)
    const deleted = await deleteClientInDb(req.params.clientId, ownerUserId)

    if (!deleted) {
        res.status(404).json({ success: false, message: 'Client not found.' })
        return
    }

    res.json({ success: true, message: 'Client deleted.' })
}
