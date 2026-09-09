// Data-access + response shaping for MarketIntelligence — reference data,
// not owned by a user, keyed by suburb+state. Two shapers on top of the
// same row: a named-field shape (Market Insights / Suburb Explorer pages)
// and a generic array shape (the appraisal wizard's step-3 panel).
import { prisma } from '../lib/prisma.js'

type PriceTrendPoint = { month: string; priceIndex: number }

function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2).replace(/0$/, '').replace(/\.$/, '')}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${Math.round(value)}`
}

function formatSignedPct(value: number, decimals = 1): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

function formatSignedPp(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}pp`
}

function formatSignedDays(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value} day${Math.abs(value) === 1 ? '' : 's'}`
}

// null means genuinely unknown for this suburb (e.g. bulk-imported sold
// listings with no rental data or original listing date) — shown as an
// honest "N/A", never a fabricated number.
function formatSignedPctOrNA(value: number | null, decimals = 1): string {
  return value === null ? 'N/A' : formatSignedPct(value, decimals)
}

function formatSignedDaysOrNA(value: number | null): string {
  return value === null ? 'N/A' : formatSignedDays(value)
}

// Splits a combined query like "Richmond VIC" into suburb + state — the
// last whitespace-separated token is treated as the state.
function splitSuburbState(suburbQuery: string): { suburb: string; state?: string } {
  const parts = suburbQuery.trim().split(/\s+/)
  if (parts.length < 2) return { suburb: suburbQuery.trim() }
  return { suburb: parts.slice(0, -1).join(' '), state: parts[parts.length - 1] }
}

async function findBySuburb(suburb: string, state?: string) {
  const rows = await prisma.marketIntelligence.findMany()

  return (
    rows.find((row) => {
      const suburbMatches = row.suburb.trim().toLowerCase() === suburb.trim().toLowerCase()
      const stateMatches = state ? row.state.trim().toLowerCase() === state.trim().toLowerCase() : true
      return suburbMatches && stateMatches
    }) ?? null
  )
}

// Named-field shape for agent/valuer "Market Insights" and buyer/investor
// "Suburb Explorer" — all four frontend types are structurally identical.
export async function getMarketInsightsForSuburb(suburbQuery: string) {
  const { suburb, state } = splitSuburbState(suburbQuery)
  const row = await findBySuburb(suburb, state)
  if (!row) return null

  const priceTrend: PriceTrendPoint[] = JSON.parse(row.priceTrendJson)

  return {
    suburb: `${row.suburb} ${row.state}`,
    stats: {
      medianPrice: formatCompactCurrency(row.medianPrice),
      medianPriceTrend: formatSignedPct(row.medianPriceGrowthPct),
      monthlyGrowth: formatSignedPct(row.monthlyGrowthPct, 2),
      monthlyGrowthTrend: formatSignedPp(row.monthlyGrowthTrendPp),
      // null (not derivable from bulk sold-listing data — no time-on-market
      // or rental data to compute from) — the frontend must render this
      // honestly as "N/A" once it's wired to real data, not as the literal
      // string "null".
      daysOnMarket: row.daysOnMarket,
      daysOnMarketTrend: formatSignedDaysOrNA(row.daysOnMarketTrendDays),
      rentalYield: row.rentalYieldPct === null ? 'N/A' : `${row.rentalYieldPct.toFixed(1)}%`,
      rentalYieldTrend: formatSignedPctOrNA(row.rentalYieldTrendPct),
    },
    priceTrend,
  }
}

// Generic array shape for the appraisal wizard's step-3 panel.
export async function getMarketIntelligenceOverviewForSuburb(suburb: string, state?: string) {
  const row = await findBySuburb(suburb, state)

  if (!row) {
    return { suburbLabel: suburb, stats: [], priceTrend: [] as PriceTrendPoint[] }
  }

  const priceTrend: PriceTrendPoint[] = JSON.parse(row.priceTrendJson)

  return {
    suburbLabel: `${row.suburb} ${row.state}`,
    stats: [
      { id: 'median-price', label: 'Median Price', value: formatCompactCurrency(row.medianPrice), trend: formatSignedPct(row.medianPriceGrowthPct) },
      { id: 'monthly-growth', label: 'Monthly Growth', value: formatSignedPct(row.monthlyGrowthPct, 2), trend: formatSignedPp(row.monthlyGrowthTrendPp) },
      { id: 'days-on-market', label: 'Days on Market', value: row.daysOnMarket === null ? 'N/A' : String(row.daysOnMarket), trend: formatSignedDaysOrNA(row.daysOnMarketTrendDays) },
      { id: 'rental-yield', label: 'Rental Yield', value: row.rentalYieldPct === null ? 'N/A' : `${row.rentalYieldPct.toFixed(1)}%`, trend: formatSignedPctOrNA(row.rentalYieldTrendPct) },
    ],
    priceTrend,
  }
}
