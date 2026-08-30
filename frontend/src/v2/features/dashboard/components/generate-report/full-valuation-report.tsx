import type {
  AppraisalDisclaimer,
  AppraisalInputContext,
  AppraisalSummary,
  ComparableSale,
  NarrativePreview,
} from '../../../../../services/common'
import { Notification } from '../../../../../components/notification/notification'
import {
  BuildingIcon,
  ComparableSalesTable,
  MarketStatTiles,
  PropertyDetailList,
  ReportCertificationBlock,
  ReportHeaderBanner,
  SectionDivider,
  ValuationRangeBar,
} from './report-document-shared'

// v2 report document for the Valuer role — matches figma's FullValuationReport pattern
// (GenerateAppraisalPage.tsx), built from the same shared blocks as VendorAppraisalReport
// / InvestmentAnalysisReport (§10.2). Real data throughout: narrative is Groq-generated
// (reportType "bank-valuation"), comparables/market stats are the same real backend
// endpoints the Agent flow uses. The Valuation Methodology section is figma's own static
// informative boilerplate (naming the Direct Comparison Method) — not user-specific data,
// same category as the certification statement text.

const MARKET_STAT_ORDER = ['annual-growth', 'clearance-rate', 'days-on-mkt']

type FullValuationReportProps = {
  context: AppraisalInputContext
  summary: AppraisalSummary
  narrative: NarrativePreview
  disclaimer: AppraisalDisclaimer
  comparables: ComparableSale[]
  valuerName: string
}

export function FullValuationReport({ context, summary, narrative, disclaimer, comparables, valuerName }: FullValuationReportProps) {
  const marketStats = MARKET_STAT_ORDER.map((id) => summary.stats.find((stat) => stat.id === id)).filter(
    (stat): stat is (typeof summary.stats)[number] => Boolean(stat),
  )
  const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
      <ReportHeaderBanner
        icon={<BuildingIcon />}
        eyebrow="Relaive · Property Valuation"
        title="Full Valuation Report"
        subtitle={context.address}
        preparedBy={valuerName}
        date={today}
        stats={[
          { label: 'Assessed Value', value: summary.priceRange, highlight: true },
          { label: 'Midpoint', value: summary.midpointEstimate },
          { label: 'Property Type', value: context.propertyType ?? '—' },
          {
            label: `${context.bedrooms ?? 0} bed · ${context.bathrooms ?? 0} bath · ${context.parking ?? 0} car`,
            value: context.landSizeSqm ? `${context.landSizeSqm}m²` : '—',
          },
        ]}
      />

      <div className="px-6 py-7 sm:px-8">
        <SectionDivider label="Introduction" />
        <div className="space-y-3 text-sm leading-relaxed text-relaive-navy/85">
          {narrative.sections.map((section, index) => (
            <p key={`${section.heading}-${index}`}>
              {section.heading ? <span className="font-semibold text-relaive-navy">{section.heading} </span> : null}
              {section.body}
            </p>
          ))}
          <p>This report has been prepared in accordance with the Australian Property Institute Valuation Standards.</p>
        </div>

        <SectionDivider label="Property Description" />
        <div className="grid gap-6 sm:grid-cols-2">
          <p className="text-sm leading-relaxed text-relaive-navy/85">
            The subject property is a {(context.propertyType ?? 'property').toLowerCase()} at {context.address}, presenting
            as a well-maintained dwelling with a functional floor plan. Key features include {context.bedrooms ?? 0}{' '}
            bedroom{context.bedrooms === 1 ? '' : 's'}, {context.bathrooms ?? 0} bathroom{context.bathrooms === 1 ? '' : 's'}
            {context.parking ? `, ${context.parking} car space${context.parking === 1 ? '' : 's'}` : ', no designated car space'}
            , and a total land area of {context.landSizeSqm ?? '—'}m².
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

        <SectionDivider label="Valuation Methodology" />
        <p className="text-sm leading-relaxed text-relaive-navy/85">
          The <strong className="text-relaive-navy">Direct Comparison Method</strong> has been adopted as the primary
          approach to value for this assessment. This method involves analysing recent sales of comparable properties
          and making appropriate adjustments to reflect differences in location, size, condition, and market timing.
        </p>

        <SectionDivider label="Evidence Summary" />
        <ComparableSalesTable comparables={comparables} averageLabel="Evidence Average" />

        {marketStats.length > 0 ? (
          <>
            <SectionDivider label="Market Context" />
            <MarketStatTiles stats={marketStats} />
          </>
        ) : null}

        <SectionDivider label="Valuation Assessment" />
        <ValuationRangeBar title="Assessed Market Value Range" priceRange={summary.priceRange} midpoint={summary.midpointEstimate} />

        <SectionDivider label="Certificate of Valuation" />
        <ReportCertificationBlock
          name={valuerName}
          roleLabel="Certified Property Valuer · Relaive Valuation Services"
          statement="I certify that I have made a personal inspection of the subject property and that, to the best of my knowledge and belief, the facts stated in this report are true and correct. This valuation has been prepared in accordance with the Australian Property Institute Valuation Standards and represents my independent professional opinion of the market value as at the date of assessment."
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
