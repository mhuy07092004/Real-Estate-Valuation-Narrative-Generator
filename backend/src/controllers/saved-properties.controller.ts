import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { prisma } from '../lib/prisma.js'
import { createSavedPropertySchema, updateSavedPropertySchema } from '../validators/saved-property.validator.js'

function zodErrors(err: ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  const flattened = err.flatten().fieldErrors
  for (const [field, messages] of Object.entries(flattened)) {
    if (messages?.[0]) errors[field] = messages[0]
  }
  return errors
}

function toSavedPropertyResponse(row: {
  savedPropertyId: string
  ownerUserId: string
  label: string | null
  addressLine: string
  suburb: string
  state: string
  postcode: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  parking: number
  landSizeSqm: number
  soldDateFrom: Date | null
  soldDateTo: Date | null
  filterPropertyType: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...row,
    landSizeSqm: row.landSizeSqm,
    soldDateFrom: row.soldDateFrom?.toISOString().slice(0, 10) ?? null,
    soldDateTo: row.soldDateTo?.toISOString().slice(0, 10) ?? null,
  }
}

export async function listSavedProperties(_req: Request, res: Response) {
  const userId = String(res.locals.userId)
  const rows = await prisma.savedPropertySearch.findMany({
    where: { ownerUserId: userId },
    orderBy: { createdAt: 'desc' },
  })

  res.json({ success: true, data: rows.map(toSavedPropertyResponse) })
}

export async function getSavedProperty(req: Request, res: Response) {
  const userId = String(res.locals.userId)
  const row = await prisma.savedPropertySearch.findFirst({
    where: { savedPropertyId: req.params.savedPropertyId, ownerUserId: userId },
  })

  if (!row) {
    res.status(404).json({ success: false, message: 'Saved property not found.' })
    return
  }

  res.json({ success: true, data: toSavedPropertyResponse(row) })
}

export async function createSavedProperty(req: Request, res: Response) {
  try {
    const input = createSavedPropertySchema.parse(req.body)
    const userId = String(res.locals.userId)

    const row = await prisma.savedPropertySearch.create({
      data: {
        ownerUserId: userId,
        label: input.label,
        addressLine: input.addressLine,
        suburb: input.suburb,
        state: input.state,
        postcode: input.postcode,
        propertyType: input.propertyType,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        parking: input.parking,
        landSizeSqm: input.landSizeSqm,
        soldDateFrom: input.soldDateFrom ? new Date(input.soldDateFrom) : null,
        soldDateTo: input.soldDateTo ? new Date(input.soldDateTo) : null,
        filterPropertyType: input.filterPropertyType,
      },
    })

    res.status(201).json({ success: true, data: toSavedPropertyResponse(row) })
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, message: 'Validation failed.', errors: zodErrors(error) })
      return
    }

    throw error
  }
}

export async function updateSavedProperty(req: Request, res: Response) {
  try {
    const input = updateSavedPropertySchema.parse(req.body)
    const userId = String(res.locals.userId)

    const existing = await prisma.savedPropertySearch.findFirst({
      where: { savedPropertyId: req.params.savedPropertyId, ownerUserId: userId },
    })

    if (!existing) {
      res.status(404).json({ success: false, message: 'Saved property not found.' })
      return
    }

    const row = await prisma.savedPropertySearch.update({
      where: { savedPropertyId: existing.savedPropertyId },
      data: {
        ...input,
        soldDateFrom: input.soldDateFrom ? new Date(input.soldDateFrom) : undefined,
        soldDateTo: input.soldDateTo ? new Date(input.soldDateTo) : undefined,
      },
    })

    res.json({ success: true, data: toSavedPropertyResponse(row) })
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, message: 'Validation failed.', errors: zodErrors(error) })
      return
    }

    throw error
  }
}

export async function deleteSavedProperty(req: Request, res: Response) {
  const userId = String(res.locals.userId)
  const existing = await prisma.savedPropertySearch.findFirst({
    where: { savedPropertyId: req.params.savedPropertyId, ownerUserId: userId },
  })

  if (!existing) {
    res.status(404).json({ success: false, message: 'Saved property not found.' })
    return
  }

  await prisma.savedPropertySearch.delete({ where: { savedPropertyId: existing.savedPropertyId } })
  res.json({ success: true, message: 'Saved property deleted.' })
}
