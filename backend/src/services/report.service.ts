import type { ComparableSale, ReportStatus, ReportStatusResult, ReportType } from '../types/report.types.js'

// TODO: swap this function's body for a real query against `reports` +
// `comparable_sales` (joined via `report_templates` for the type) once
// the data team's schema/dataset work lands (see DATA-AI-* branches).
// The signature — reportId in, ReportStatusResult out — is deliberately
// what a real DB-backed version will also return, so nothing calling
// getReportStatus() needs to change when that happens.

const MOCK_SUBURBS = ['Bondi', 'Marrickville', 'Parramatta', 'Newtown', 'Chatswood']
const MOCK_SOURCES = ['CoreLogic', 'Domain', 'PriceFinder']

const REPORT_TYPES: ReportType[] = [
  'vendor-appraisal',
  'bank-valuation',
  'buyer-advisory',
  'investor-report',
  'affordability-check',
]

const NARRATIVE_BY_TYPE: Record<ReportType, string> = {
  'vendor-appraisal':
    'Mock narrative: based on recent comparable sales in the surrounding area, this property is estimated to fall within the stated value range for vendor listing purposes.',
  'bank-valuation':
    'Mock narrative: a conservative, evidence-based valuation suitable for lending purposes, cross-referenced against recent comparable settlements.',
  'buyer-advisory':
    'Mock narrative: this advisory outlines a recommended offer range for the buyer based on comparable sales and current market conditions.',
  'investor-report':
    'Mock narrative: estimated value and rental yield potential based on comparable sales and suburb-level rental trends.',
  'affordability-check':
    'Mock narrative: estimated value compared against the stated budget, with comparable sales used to sanity-check the affordability outcome.',
}

function seedFromId(id: string): number {
  let seed = 0
  for (const char of id) seed += char.charCodeAt(0)
  return seed
}

function buildMockComparables(seed: number): ComparableSale[] {
  const count = 3 + (seed % 3) // 3-5 comparables
  return Array.from({ length: count }, (_, i) => {
    const suburb = MOCK_SUBURBS[(seed + i) % MOCK_SUBURBS.length]
    const basePrice = 700_000 + ((seed * (i + 1)) % 500_000)
    return {
      comparableId: `mock-comp-${seed}-${i}`,
      comparableAddress: `${12 + i * 4} ${suburb} Street, ${suburb}`,
      salePrice: Math.round(basePrice / 1000) * 1000,
      saleDate: new Date(Date.now() - (i + 1) * 20 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      distanceKm: Number((0.3 + (i + 1) * 0.4).toFixed(1)),
      matchScorePct: 95 - i * 6,
      dataSource: MOCK_SOURCES[(seed + i) % MOCK_SOURCES.length],
    }
  })
}

/**
 * Returns mock report status + comparable sales for a given reportId.
 * Deterministic per reportId (same input always returns the same mock
 * output) so the frontend gets stable data to build/test against.
 *
 * `forceStatus` / `forceType` let a caller preview a specific UI state
 * or report type without needing a second real backend state — these
 * are testing conveniences handled by the caller, not part of what a
 * real DB-backed version needs to support.
 */
export function getReportStatus(
  reportId: string,
  forceStatus?: ReportStatus,
  forceType?: ReportType,
): ReportStatusResult {
  const seed = seedFromId(reportId)
  const status: ReportStatus = forceStatus ?? (seed % 5 === 0 ? 'processing' : 'ready')
  const reportType: ReportType = forceType ?? REPORT_TYPES[seed % REPORT_TYPES.length]

  if (status === 'processing') {
    return {
      reportId,
      reportType,
      status,
      estimatedValueLow: null,
      estimatedValueHigh: null,
      confidenceScorePct: null,
      aiNarrativeText: null,
      comparableSales: [],
      updatedAt: new Date().toISOString(),
    }
  }

  const low = 700_000 + (seed % 400_000)
  const high = low + 80_000 + (seed % 50_000)

  return {
    reportId,
    reportType,
    status,
    estimatedValueLow: low,
    estimatedValueHigh: high,
    confidenceScorePct: 78 + (seed % 18),
    aiNarrativeText: NARRATIVE_BY_TYPE[reportType],
    comparableSales: buildMockComparables(seed),
    updatedAt: new Date().toISOString(),
  }
}
