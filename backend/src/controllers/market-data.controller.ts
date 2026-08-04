import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'

export async function listComparableSales(req: Request, res: Response) {
  const suburb = typeof req.query.suburb === 'string' ? req.query.suburb : undefined
  const state = typeof req.query.state === 'string' ? req.query.state : undefined
  const rows = await prisma.comparableSale.findMany({
    where: {
      suburb: suburb ? { contains: suburb } : undefined,
      state: state ? { contains: state } : undefined,
    },
    orderBy: { soldDate: 'desc' },
    take: 100,
  })

  res.json({
    success: true,
    data: rows.map((row) => ({
      ...row,
      landSizeSqm: Number(row.landSizeSqm),
      soldPrice: Number(row.soldPrice),
      soldDate: row.soldDate.toISOString().slice(0, 10),
    })),
  })
}

export async function listMarketIntelligence(req: Request, res: Response) {
  const suburb = typeof req.query.suburb === 'string' ? req.query.suburb : undefined
  const state = typeof req.query.state === 'string' ? req.query.state : undefined

  const rows = await prisma.marketIntelligence.findMany({
    where: {
      suburb: suburb ? { contains: suburb } : undefined,
      state: state ? { contains: state } : undefined,
    },
    orderBy: { asOfMonth: 'desc' },
    take: 100,
  })

  res.json({
    success: true,
    data: rows.map((row) => ({
      ...row,
      meanHousePrice: Number(row.meanHousePrice),
      monthGrowthPct: Number(row.monthGrowthPct),
      rentalYieldPct: Number(row.rentalYieldPct),
      asOfMonth: row.asOfMonth.toISOString().slice(0, 10),
    })),
  })
}
