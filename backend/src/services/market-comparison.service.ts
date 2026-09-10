// BACKEND-117: investor Market Comparison data — the radar-chart page that
// used to be a fully hardcoded 3-suburb array. Real data now exists on
// MarketIntelligence for a subset of suburbs (Domain/SQM/ABS scrapes via
// data_ai/ingestion + backend/scripts/load-external-market-data.ts,
// medianHousePrice/medianUnitPrice via BACKEND-118), but coverage is
// partial and uneven per suburb (e.g. no exact-match ABS SA2 region, or no
// unit sales in the trailing 12-month window).
//
// Rather than redesign the frontend page to tolerate a mix of real and null
// values per axis (a much bigger change to its normalisation/formatting
// logic), this only returns suburbs with a COMPLETE real value for every
// field the page needs — same "honest gap over a fabricated number"
// principle as everywhere else, just applied at the suburb-inclusion level
// instead of the field level. As more suburbs get scraped, more will
// qualify; none are fabricated to fill the gap.
import { prisma } from '../lib/prisma.js'

export type MarketComparisonSuburb = {
  id: string
  suburb: string
  postcode: string
  medianHousePrice: number
  medianUnitPrice: number
  growth12m: number
  rentalYield: number
  vacancyRate: number
  clearanceRate: number
  populationGrowth: number
  supplyConstraint: number
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function getMarketComparisonSuburbs(): Promise<MarketComparisonSuburb[]> {
  const rows = await prisma.marketIntelligence.findMany({
    where: {
      medianHousePrice: { not: null },
      medianUnitPrice: { not: null },
      rentalYieldPct: { not: null },
      vacancyRatePct: { not: null },
      auctionClearanceRatePct: { not: null },
      populationGrowthPct: { not: null },
      supplyConstraintDwellingApprovalsPer1000: { not: null },
    },
  })

  const results: MarketComparisonSuburb[] = []
  for (const row of rows) {
    // MarketIntelligence has no postcode column of its own — real postcodes
    // live on Property, keyed the same way (suburb+state) since both were
    // populated from the same bronze import.
    const property = await prisma.property.findFirst({
      where: { suburb: row.suburb, state: row.state },
      select: { postcode: true },
    })

    results.push({
      id: `${slugify(row.suburb)}-${row.state.toLowerCase()}-${property?.postcode ?? ''}`,
      suburb: row.suburb,
      postcode: property?.postcode ?? '',
      medianHousePrice: row.medianHousePrice!,
      medianUnitPrice: row.medianUnitPrice!,
      growth12m: row.medianPriceGrowthPct,
      rentalYield: row.rentalYieldPct!,
      vacancyRate: row.vacancyRatePct!,
      clearanceRate: row.auctionClearanceRatePct!,
      populationGrowth: row.populationGrowthPct!,
      supplyConstraint: row.supplyConstraintDwellingApprovalsPer1000!,
    })
  }
  return results
}
