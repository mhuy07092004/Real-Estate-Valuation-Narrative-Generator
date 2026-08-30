import type {
  AppraisalDisclaimer,
  AppraisalInputContext,
  AppraisalSummary,
  ComparableSale,
  NarrativePreview,
} from '../../../../../services/common'
import { Notification } from '../../../../../components/notification/notification'
import type { AffordabilityResult } from '../affordability/use-affordability-calculator'
import {
  BookmarkIcon,
  ComparableSalesTable,
  MarketStatTiles,
  PropertyDetailList,
  ReportCertificationBlock,
  ReportHeaderBanner,
  SectionDivider,
  ValuationRangeBar,
} from './report-document-shared'

// v2 report document for the Buyer role — matches figma's BuyerAdvisoryReport pattern
// (GenerateAppraisalPage.tsx), built from the same shared blocks as the other three report
// documents (§10.2). Real data throughout: narrative is Groq-generated (reportType
// "buyer-advisory"), comparables/market stats are the same real backend endpoints the
// Agent flow uses, and the affordability figures are the user's own real inputs from the
// wizard's Affordability step — not fabricated.

const MARKET_STAT_ORDER = ['annual-growth', 'clearance-rate', 'days-on-mkt']

function formatCapacity(value: number): string {
  return value >= 1000000 ? `$${(value / 1000000).toFixed(2)}M` : `$${Math.round(value / 1000)}K`
}

const LEVEL_STYLES = {
  Comfortable: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  Moderate: 'bg-amber-50 border-amber-200 text-amber-700',
  Stretched: 'bg-red-50 border-red-200 text-red-700',
} as const

const LEVEL_NOTES: Record<AffordabilityResult['affordabilityLevel'], string> = {
  Comfortable: 'Repayments are well within your income — strong financial position to proceed.',
  Moderate: 'Repayments are manageable but leave limited buffer — consider carefully.',
  Stretched: 'Repayments represent a stretch — seek independent financial advice before proceeding.',
}

type BuyerAdvisoryReportProps = {
  context: AppraisalInputContext
  summary: AppraisalSummary
  narrative: NarrativePreview
  disclaimer: AppraisalDisclaimer
  comparables: ComparableSale[]
  affordability: AffordabilityResult
  combinedIncome: number
  deposit: number
  interestRate: number
  loanTerm: number
  agentName: string
}

export function BuyerAdvisoryReport({
  context,
  summary,
  narrative,
  disclaimer,
  comparables,
  affordability,
  combinedIncome,
  deposit,
  interestRate,
  loanTerm,
  agentName,
}: BuyerAdvisoryReportProps) {
  const marketStats = MARKET_STAT_ORDER.map((id) => summary.stats.find((stat) => stat.id === id)).filter(
    (stat): stat is (typeof summary.stats)[number] => Boolean(stat),
  )
  const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
      <ReportHeaderBanner
        icon={<BookmarkIcon />}
        eyebrow="Relaive · Buyer Advisory"
        title="Buyer Advisory Report"
        subtitle={context.address}
        preparedBy={agentName}
        date={today}
        stats={[
          { label: 'Fair Value Range', value: summary.priceRange, highlight: true },
          { label: 'Midpoint', value: summary.midpointEstimate },
          { label: 'Property Type', value: context.propertyType ?? '—' },
          {
            label: `${context.bedrooms ?? 0} bed · ${context.bathrooms ?? 0} bath · ${context.parking ?? 0} car`,
            value: context.landSizeSqm ? `${context.landSizeSqm}m²` : '—',
          },
        ]}
      />

      <div className="px-6 py-7 sm:px-8">
        <SectionDivider label="Executive Summary" />
        <div className="space-y-3 text-sm leading-relaxed text-relaive-navy/85">
          {narrative.sections.map((section, index) => (
            <p key={`${section.heading}-${index}`}>
              {section.heading ? <span className="font-semibold text-relaive-navy">{section.heading} </span> : null}
              {section.body}
            </p>
          ))}
        </div>

        <SectionDivider label="Property Description" />
        <div className="grid gap-6 sm:grid-cols-2">
          <p className="text-sm leading-relaxed text-relaive-navy/85">
            The subject property is a {(context.propertyType ?? 'property').toLowerCase()} at {context.address}, offering{' '}
            {context.bedrooms ?? 0} bedroom{context.bedrooms === 1 ? '' : 's'} and {context.bathrooms ?? 0} bathroom
            {context.bathrooms === 1 ? '' : 's'} across {context.landSizeSqm ?? '—'}m² of land area.
          </p>
          <PropertyDetailList
            title="Property Details"
            items={[
              `Land area: ${context.landSizeSqm ?? '—'}m²`,
              `Property type: ${context.propertyType ?? '—'}`,
              `Bedrooms: ${context.bedrooms ?? 0}`,
              `Bathrooms: ${context.bathrooms ?? 0}`,
              `Car spaces: ${context.parking ?? 0}`,
            ]}
          />
        </div>

        <SectionDivider label="Comparable Sales Evidence" />
        <ComparableSalesTable comparables={comparables} />

        {marketStats.length > 0 ? (
          <>
            <SectionDivider label="Market Analysis" />
            <MarketStatTiles stats={marketStats} />
          </>
        ) : null}

        <SectionDivider label="Fair Value Assessment" />
        <ValuationRangeBar title="Fair Value Range" priceRange={summary.priceRange} midpoint={summary.midpointEstimate} lowerLabel="Lower bound" upperLabel="Upper bound" />

        <SectionDivider label="Affordability Assessment" />
        <div className="space-y-4">
          <div className="rounded-2xl bg-gradient-to-br from-[#102132] to-[#1C2A38] p-5 text-white">
            <p className="mb-1 text-xs text-white/50">Estimated Borrowing Capacity</p>
            <p className="mb-3 text-3xl font-bold">{formatCapacity(affordability.borrowingCapacity)}</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/10 p-3">
                <p className="mb-0.5 text-[10px] text-white/50">Monthly Repayment</p>
                <p className="text-sm font-bold text-white">${Math.round(affordability.repaymentOnCapacity).toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <p className="mb-0.5 text-[10px] text-white/50">Max Loan Amount</p>
                <p className="text-sm font-bold text-white">{formatCapacity(affordability.maxLoan)}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <p className="mb-0.5 text-[10px] text-white/50">Repayment-to-Income</p>
                <p className="text-sm font-bold text-white">{affordability.repaymentToIncome.toFixed(0)}%</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-black/[0.02] p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-relaive-gray/60">Income &amp; Deposit</p>
              {[
                ['Combined Annual Income', `$${combinedIncome.toLocaleString()}`],
                ['Available Deposit', `$${deposit.toLocaleString()}`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-black/5 py-1.5 last:border-0">
                  <span className="text-xs text-relaive-gray">{label}</span>
                  <span className="text-xs font-semibold text-relaive-navy">{value}</span>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-black/[0.02] p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-relaive-gray/60">Loan Assumptions</p>
              {[
                ['Interest Rate', `${interestRate}%`],
                ['Loan Term', `${loanTerm} years`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-black/5 py-1.5 last:border-0">
                  <span className="text-xs text-relaive-gray">{label}</span>
                  <span className="text-xs font-semibold text-relaive-navy">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={`rounded-xl border p-4 ${LEVEL_STYLES[affordability.affordabilityLevel]}`}>
            <p className="text-xs font-semibold">Affordability Level: {affordability.affordabilityLevel}</p>
            <p className="mt-0.5 text-xs opacity-80">{LEVEL_NOTES[affordability.affordabilityLevel]}</p>
          </div>
        </div>

        <SectionDivider label="Prepared by" />
        <ReportCertificationBlock
          name={agentName}
          roleLabel="Buyer Advisor · Relaive Property Group"
          statement="This Buyer Advisory Report has been prepared using publicly available comparable sales data and current market intelligence. It is intended to assist the buyer in making an informed purchase decision and does not constitute legal or financial advice. Independent due diligence is recommended prior to exchange."
        />

        <Notification className="mt-8">
          <p className="font-semibold">{disclaimer.title}</p>
          <p className="mt-1">{disclaimer.message}</p>
          <div className="mt-3 border-t border-amber-200/80 pt-3">
            <p className="text-xs text-amber-800/80">{disclaimer.footer}</p>
          </div>
        </Notification>
      </div>
    </div>
  )
}
