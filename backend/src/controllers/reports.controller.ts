import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { prisma } from '../lib/prisma.js'
import { createReportSchema, updateReportSchema } from '../validators/report.validator.js'

function zodErrors(err: ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  const flattened = err.flatten().fieldErrors
  for (const [field, messages] of Object.entries(flattened)) {
    if (messages?.[0]) errors[field] = messages[0]
  }
  return errors
}

function toReportResponse(row: {
  reportId: string
  ownerUserId: string
  clientId: string | null
  client?: {
    fullName: string
    email: string
  } | null
  propertyAddressLine: string
  propertySuburb: string
  propertyState: string
  propertyPostcode: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  parking: number
  landSizeSqm: number
  estimatedValue: number
  selectedComparableId: string | null
  selectedComparableAddress: string | null
  selectedComparableSoldPrice: number | null
  selectedComparableSoldDate: Date | null
  marketSuburb: string | null
  marketMeanHousePrice: number | null
  marketMonthGrowthPct: number | null
  marketRentalYieldPct: number | null
  marketBuyerInterestLevel: string | null
  marketSupplyLevel: string | null
  marketPriceGrowthLevel: string | null
  narrativeText: string
  pdfStoragePath: string | null
  pdfGeneratedAt: Date | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...row,
    clientName: row.client?.fullName ?? null,
    clientEmail: row.client?.email ?? null,
    landSizeSqm: row.landSizeSqm,
    estimatedValue: row.estimatedValue,
    selectedComparableSoldPrice: row.selectedComparableSoldPrice,
    selectedComparableSoldDate: row.selectedComparableSoldDate?.toISOString().slice(0, 10) ?? null,
    marketMeanHousePrice: row.marketMeanHousePrice,
    marketMonthGrowthPct: row.marketMonthGrowthPct,
    marketRentalYieldPct: row.marketRentalYieldPct,
  }
}

export async function listReports(_req: Request, res: Response) {
  const userId = String(res.locals.userId)
  const rows = await prisma.report.findMany({
    where: { ownerUserId: userId },
    include: {
      client: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json({ success: true, data: rows.map(toReportResponse) })
}

export async function getReport(req: Request, res: Response) {
  const userId = String(res.locals.userId)
  const row = await prisma.report.findFirst({
    where: { reportId: req.params.reportId, ownerUserId: userId },
    include: {
      client: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
  })

  if (!row) {
    res.status(404).json({ success: false, message: 'Report not found.' })
    return
  }

  res.json({ success: true, data: toReportResponse(row) })
}

export async function createReport(req: Request, res: Response) {
  try {
    const input = createReportSchema.parse(req.body)
    const userId = String(res.locals.userId)

    let resolvedClientId = input.clientId
    const hasContactInput = Boolean(input.clientName?.trim() || input.clientEmail?.trim())

    if (hasContactInput) {
      const contactName = input.clientName?.trim()
      const contactEmail = input.clientEmail?.trim().toLowerCase()

      if (!contactName || !contactEmail) {
        res.status(400).json({
          success: false,
          message: 'Validation failed.',
          errors: {
            clientName: contactName ? '' : 'Client name is required when sending to a client.',
            clientEmail: contactEmail ? '' : 'Client email is required when sending to a client.',
          },
        })
        return
      }

      const existingClient = await prisma.client.findUnique({ where: { email: contactEmail } })

      if (existingClient) {
        resolvedClientId = existingClient.clientId
      } else {
        const createdClient = await prisma.client.create({
          data: {
            ownerUserId: userId,
            fullName: contactName,
            email: contactEmail,
            phone: 'N/A',
            status: 'prospecting',
            notes: 'Auto-created from generated report send flow.',
            addressLine: input.propertyAddressLine,
            suburb: input.propertySuburb,
            state: input.propertyState,
            postcode: input.propertyPostcode,
            propertyType: input.propertyType,
            bedrooms: input.bedrooms,
            bathrooms: input.bathrooms,
            parking: input.parking,
            landSizeSqm: input.landSizeSqm,
          },
        })

        resolvedClientId = createdClient.clientId
      }
    }

    const row = await prisma.report.create({
      data: {
        ownerUserId: userId,
        clientId: resolvedClientId,
        propertyAddressLine: input.propertyAddressLine,
        propertySuburb: input.propertySuburb,
        propertyState: input.propertyState,
        propertyPostcode: input.propertyPostcode,
        propertyType: input.propertyType,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        parking: input.parking,
        landSizeSqm: input.landSizeSqm,
        estimatedValue: input.estimatedValue,
        selectedComparableId: input.selectedComparableId,
        selectedComparableAddress: input.selectedComparableAddress,
        selectedComparableSoldPrice: input.selectedComparableSoldPrice,
        selectedComparableSoldDate: input.selectedComparableSoldDate ? new Date(input.selectedComparableSoldDate) : null,
        marketSuburb: input.marketSuburb,
        marketMeanHousePrice: input.marketMeanHousePrice,
        marketMonthGrowthPct: input.marketMonthGrowthPct,
        marketRentalYieldPct: input.marketRentalYieldPct,
        marketBuyerInterestLevel: input.marketBuyerInterestLevel,
        marketSupplyLevel: input.marketSupplyLevel,
        marketPriceGrowthLevel: input.marketPriceGrowthLevel,
        narrativeText: input.narrativeText,
        pdfStoragePath: input.pdfStoragePath,
      },
      include: {
        client: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    })

    res.status(201).json({ success: true, data: toReportResponse(row) })
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, message: 'Validation failed.', errors: zodErrors(error) })
      return
    }

    throw error
  }
}

export async function updateReport(req: Request, res: Response) {
  try {
    const input = updateReportSchema.parse(req.body)
    const userId = String(res.locals.userId)

    const existing = await prisma.report.findFirst({
      where: { reportId: req.params.reportId, ownerUserId: userId },
    })

    if (!existing) {
      res.status(404).json({ success: false, message: 'Report not found.' })
      return
    }

    const row = await prisma.report.update({
      where: { reportId: existing.reportId },
      data: {
        ...input,
        selectedComparableSoldDate: input.selectedComparableSoldDate ? new Date(input.selectedComparableSoldDate) : undefined,
      },
    })

    res.json({ success: true, data: toReportResponse(row) })
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, message: 'Validation failed.', errors: zodErrors(error) })
      return
    }

    throw error
  }
}

export async function deleteReport(req: Request, res: Response) {
  const userId = String(res.locals.userId)
  const existing = await prisma.report.findFirst({
    where: { reportId: req.params.reportId, ownerUserId: userId },
  })

  if (!existing) {
    res.status(404).json({ success: false, message: 'Report not found.' })
    return
  }

  await prisma.report.delete({ where: { reportId: existing.reportId } })
  res.json({ success: true, message: 'Report deleted.' })
}
