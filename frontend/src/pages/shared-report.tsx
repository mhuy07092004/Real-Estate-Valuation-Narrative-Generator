// Public, unauthenticated report view — reached via the token-based share
// link an agent generates from the Generated Report screen. No login, no
// ProtectedRoute: a client has no Relaive account at all. Renders the same
// GeneratedReportPanel the agent saw, from the snapshot persisted at save
// time (see report.service.ts's Report.sectionsJson/comparablesJson/
// strategyCardsJson) — never a live re-fetch, so this shows exactly what
// the agent generated, unaffected by later data changes.
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getInitials } from '../features/dashboard/utils/dashboard-user'
import { getAgentRecommendationIcon, ReportDocumentIcon } from '../features/dashboard/components/generate-report/generate-report-icons'
import {
  GeneratedReportPanel,
  type GeneratedReportStrategyCard,
  type GeneratedReportTable,
} from '../features/dashboard/components/generate-report/generated-report-panel'
import { getPublicReport, type AgentRecommendationIconKey, type PublicReport } from '../services/common'

const ROLE_TITLE: Record<string, string> = {
  agent: 'Real Estate Agent',
  valuer: 'Property Valuer',
  investor: 'Investor',
  buyer: 'Buyer',
}

const DISCLAIMER =
  'Disclaimer: This report was prepared using automated market analysis and is intended as a guidance tool only. ' +
  'It does not constitute a formal property valuation under the Valuers Act 2003 (Vic) and should not be relied upon ' +
  'as such in legal, financial, or lending contexts. All figures are estimates based on available comparable sales ' +
  'and market data. Relaive recommends this report be reviewed by a licensed real estate agent or certified ' +
  'practising valuer before being presented to vendors or third parties. Market conditions may change; this ' +
  'appraisal has a recommended validity period of 90 days from the date of generation.'

function formatCurrency(value: number): string {
  return `$${new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 }).format(value)}`
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
}

export default function SharedReportPage() {
  const { token } = useParams<{ token: string }>()
  const [report, setReport] = useState<PublicReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    getPublicReport(token)
      .then((data) => {
        if (!cancelled) setReport(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'This link is invalid or has expired.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <p className="text-sm text-relaive-gray">Loading report…</p>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-center">
        <div>
          <h1 className="text-lg font-semibold text-relaive-navy">Report unavailable</h1>
          <p className="mt-2 text-sm text-relaive-gray">{error ?? 'This link is invalid or has expired.'}</p>
        </div>
      </div>
    )
  }

  const comparables = report.comparables ?? []
  const averagePrice = comparables.length
    ? Math.round(comparables.reduce((sum, comp) => sum + comp.price, 0) / comparables.length)
    : 0

  const table: GeneratedReportTable = {
    title: 'Comparable Sales',
    columns: ['Address', 'Configuration', 'Sold', 'Price'],
    rows: [
      ...comparables.map((comp) => ({
        id: comp.id,
        cells: [
          comp.address,
          `${comp.beds} bed · ${comp.baths} bath · ${comp.parking} car`,
          comp.soldAgo,
          formatCurrency(comp.price),
        ],
      })),
      {
        id: 'average',
        isTotal: true,
        cells: ['Average', '—', '—', formatCurrency(averagePrice)],
      },
    ],
  }

  const rangeLow = report.priceRangeLow
  const rangeHigh = report.priceRangeHigh
  const progressPercent =
    rangeLow !== null && rangeHigh !== null && rangeHigh > rangeLow
      ? ((report.estimatedValue - rangeLow) / (rangeHigh - rangeLow)) * 100
      : 50

  const strategyCards: GeneratedReportStrategyCard[] = (report.strategyCards ?? []).map((item) => ({
    id: item.id,
    icon: getAgentRecommendationIcon(item.iconKey as AgentRecommendationIconKey),
    label: item.iconKey.charAt(0).toUpperCase() + item.iconKey.slice(1),
    title: item.title,
    description: item.description,
  }))

  const sections =
    report.sections && report.sections.length > 0
      ? report.sections
      : [
          {
            id: 'summary',
            title: 'Summary',
            paragraphs: [
              [
                {
                  text: `This ${report.propertyType} at ${report.propertyAddressLine}, ${report.propertySuburb} has an estimated value of ${formatCurrency(report.estimatedValue)}.`,
                },
              ],
            ],
          },
        ]

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <GeneratedReportPanel
          eyebrowIcon={<ReportDocumentIcon size={16} />}
          eyebrowLabel={`Relaive · ${report.reportTitle}`}
          preparedByName={report.preparedByName}
          date={formatDate(report.createdAt)}
          reportTitle={report.propertyAddressLine}
          reportSubtitle={`${report.propertySuburb} ${report.propertyState} ${report.propertyPostcode} · ${report.propertyType} · ${report.bedrooms} bed · ${report.bathrooms} bath`}
          headerStats={[
            {
              id: 'estimated-value',
              label: 'Estimated Value',
              value:
                rangeLow !== null && rangeHigh !== null
                  ? `${formatCurrency(rangeLow)} – ${formatCurrency(rangeHigh)}`
                  : formatCurrency(report.estimatedValue),
              accent: true,
            },
            { id: 'midpoint', label: 'Midpoint', value: formatCurrency(report.estimatedValue) },
            { id: 'property-type', label: 'Property Type', value: report.propertyType },
            {
              id: 'features',
              label: 'Bed · Bath · Car',
              value: `${report.bedrooms} bed · ${report.bathrooms} bath · ${report.parking} car`,
            },
          ]}
          sections={sections}
          table={table}
          summaryResult={{
            rangeLow: rangeLow !== null ? formatCurrency(rangeLow) : formatCurrency(report.estimatedValue),
            rangeHigh: rangeHigh !== null ? formatCurrency(rangeHigh) : '',
            midpointLabel: 'Midpoint Estimate',
            midpointValue: formatCurrency(report.estimatedValue),
            progressPercent,
          }}
          strategyCards={strategyCards}
          certification={{
            name: report.preparedByName,
            title: ROLE_TITLE[report.preparedByRole] ?? 'Property Appraisal Specialist',
            initials: getInitials(report.preparedByName),
            disclaimer: DISCLAIMER,
          }}
        />
      </div>
    </div>
  )
}
