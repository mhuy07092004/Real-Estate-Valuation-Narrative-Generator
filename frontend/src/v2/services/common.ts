// v2-only addition: market metrics (trend-labelled cards + 12-month price history) for the
// figma-pattern Market Intelligence view. New endpoint (/api/appraisal/market-metrics),
// new file — v1's services/common.ts is untouched.
// See figma-ui-migration-plan.md §9.1 (Market Intelligence).

import { fetchJson } from '../../services/api-client'
import { getAppraisalInputContext } from '../../services/common'

export type MarketMetric = {
  id: string
  label: string
  value: string
  change: string
  up: boolean
  detail: string
}

export type PriceTrendPoint = {
  month: string
  value: number
}

export type MarketMetrics = {
  metrics: MarketMetric[]
  priceTrend: PriceTrendPoint[]
}

function withAppraisalContext(path: string): string {
  const context = getAppraisalInputContext()
  if (!context) return path

  const query = new URLSearchParams()
  query.set('address', context.address)
  if (context.propertyType) query.set('propertyType', context.propertyType)
  if (typeof context.bedrooms === 'number') query.set('bedrooms', String(context.bedrooms))
  if (typeof context.bathrooms === 'number') query.set('bathrooms', String(context.bathrooms))
  if (typeof context.parking === 'number') query.set('parking', String(context.parking))
  if (typeof context.landSizeSqm === 'number') query.set('landSizeSqm', String(context.landSizeSqm))

  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}${query.toString()}`
}

export function getMarketMetrics(): Promise<MarketMetrics> {
  return fetchJson(withAppraisalContext('/api/appraisal/market-metrics'))
}

// Phase 5 addition: the real /api/appraisal/market-metrics endpoint is deterministic per
// suburb+postcode (backend/src/routes/mock.routes.ts's buildMarketMetrics() seeds off
// `${suburb}${postcode}`), so calling it with a *different* address per call — rather than
// going through the shared getAppraisalInputContext() singleton getMarketMetrics() above
// reads from — gives real, distinct, backend-computed metrics for multiple suburbs at once.
// Used by Market Comparison and Suburb Explorer (investor/buyer) to compare/explore real
// suburbs side by side without racing writes to the single global appraisal context.
export function getMarketMetricsForAddress(address: string): Promise<MarketMetrics> {
  const query = new URLSearchParams({ address })
  return fetchJson(`/api/appraisal/market-metrics?${query.toString()}`)
}

// v2-only addition: same real /api/appraisal/comparable-sales endpoint v1 already calls
// (services/common.ts's getComparableSales()), but typed to include `propertyType` —
// the backend mock now echoes the subject property's type onto each comparable
// (backend/src/routes/mock.routes.ts), which the standalone Comparable Sales page's
// figma-pattern Property Type filter needs and v1's ComparableSale type doesn't declare.
// See figma-ui-migration-plan.md §9.7 B.1.
export type ComparableSaleV2 = {
  id: string
  address: string
  price: number
  soldAgo: string
  beds: number
  baths: number
  parking: number
  areaSqm: number
  matchPercent: number
  distanceKm: number
  propertyType: string
}

export function getComparableSalesV2(): Promise<ComparableSaleV2[]> {
  return fetchJson(withAppraisalContext('/api/appraisal/comparable-sales'))
}
