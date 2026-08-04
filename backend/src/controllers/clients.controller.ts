import type { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { prisma } from '../lib/prisma.js'
import { createClientSchema, updateClientSchema } from '../validators/client.validator.js'

function zodErrors(err: ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  const flattened = err.flatten().fieldErrors
  for (const [field, messages] of Object.entries(flattened)) {
    if (messages?.[0]) errors[field] = messages[0]
  }
  return errors
}

function toClientResponse(client: {
  clientId: string
  ownerUserId: string
  fullName: string
  email: string
  phone: string
  status: string
  notes: string | null
  addressLine: string
  suburb: string
  state: string
  postcode: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  parking: number
  landSizeSqm: number
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...client,
    landSizeSqm: client.landSizeSqm,
  }
}

export async function listClients(_req: Request, res: Response) {
  const userId = String(res.locals.userId)
  const rows = await prisma.client.findMany({
    where: { ownerUserId: userId },
    orderBy: { createdAt: 'desc' },
  })

  res.json({ success: true, data: rows.map(toClientResponse) })
}

export async function getClient(req: Request, res: Response) {
  const userId = String(res.locals.userId)
  const row = await prisma.client.findFirst({
    where: { clientId: req.params.clientId, ownerUserId: userId },
  })

  if (!row) {
    res.status(404).json({ success: false, message: 'Client not found.' })
    return
  }

  res.json({ success: true, data: toClientResponse(row) })
}

export async function createClient(req: Request, res: Response) {
  try {
    const input = createClientSchema.parse(req.body)
    const userId = String(res.locals.userId)

    const row = await prisma.client.create({
      data: {
        ownerUserId: userId,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        status: input.status,
        notes: input.notes,
        addressLine: input.addressLine,
        suburb: input.suburb,
        state: input.state,
        postcode: input.postcode,
        propertyType: input.propertyType,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        parking: input.parking,
        landSizeSqm: input.landSizeSqm,
      },
    })

    res.status(201).json({ success: true, data: toClientResponse(row) })
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, message: 'Validation failed.', errors: zodErrors(error) })
      return
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Client email already exists.' })
      return
    }

    throw error
  }
}

export async function updateClient(req: Request, res: Response) {
  try {
    const input = updateClientSchema.parse(req.body)
    const userId = String(res.locals.userId)

    const existing = await prisma.client.findFirst({
      where: { clientId: req.params.clientId, ownerUserId: userId },
    })

    if (!existing) {
      res.status(404).json({ success: false, message: 'Client not found.' })
      return
    }

    const row = await prisma.client.update({
      where: { clientId: existing.clientId },
      data: input,
    })

    res.json({ success: true, data: toClientResponse(row) })
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, message: 'Validation failed.', errors: zodErrors(error) })
      return
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Client email already exists.' })
      return
    }

    throw error
  }
}

export async function deleteClient(req: Request, res: Response) {
  const userId = String(res.locals.userId)
  const existing = await prisma.client.findFirst({
    where: { clientId: req.params.clientId, ownerUserId: userId },
  })

  if (!existing) {
    res.status(404).json({ success: false, message: 'Client not found.' })
    return
  }

  await prisma.client.delete({ where: { clientId: existing.clientId } })
  res.json({ success: true, message: 'Client deleted.' })
}
