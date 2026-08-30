import { Notification } from '../../../../../components/notification/notification'
import { getAgentRecommendationIcon } from '../../../../../features/dashboard/components/generate-report/generate-report-icons'
import type {
  AgentRecommendations,
  AppraisalDisclaimer,
  AppraisalInputContext,
  AppraisalSummary,
  ComparableSale,
  NarrativePreview,
  PropertySpecificFactors,
} from '../../../../../services/common'
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

// v2 rebuild of the wizard's final report — matches figma's VendorAppraisalReport document
// pattern (dark header banner, SectionDivider-separated sections, comparable-sales table,
// valuation range bar, campaign-strategy cards, agent certification) instead of v1's lighter
// component-composed panel. All content is real: narrativePreview is the actual Groq-generated
// (or static-fallback) narrative; everything else comes from the same backend mock endpoints
// v1 already used, just laid out to match figma. See figma-ui-migration-plan.md §9.
//
// Shared header/table/valuation-bar/certification markup lives in report-document-shared.tsx —
// reused by the Valuer/Investor/Buyer report documents too, see §10.2.

const MARKET_STAT_ORDER = ['annual-growth', 'clearance-rate', 'days-on-mkt']

type VendorAppraisalReportProps = {
  context: AppraisalInputContext
  summary: AppraisalSummary
  narrative: NarrativePreview
  factors: PropertySpecificFactors
  recommendations: AgentRecommendations
  disclaimer: AppraisalDisclaimer
  comparables: ComparableSale[]
  agentName: string
}

export function VendorAppraisalReport({
  context,
  summary,
  narrative,
  factors,
  recommendations,
  disclaimer,
  comparables,
  agentName,
}: VendorAppraisalReportProps) {
  const marketStats = MARKET_STAT_ORDER.map((id) => summary.stats.find((stat) => stat.id === id)).filter(
    (stat): stat is (typeof summary.stats)[number] => Boolean(stat),
  )
  const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
      <ReportHeaderBanner
        icon={<BuildingIcon />}
        eyebrow="Relaive · Property Appraisal"
        title="Vendor Appraisal Report"
        subtitle={context.address}
        preparedBy={agentName}
        date={today}
        stats={[
          { label: 'Estimated Value', value: summary.priceRange, highlight: true },
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
            {context.bedrooms ?? 0} bedroom{context.bedrooms === 1 ? '' : 's'}, {context.bathrooms ?? 0} bathroom
            {context.bathrooms === 1 ? '' : 's'}
            {context.parking ? `, and ${context.parking} car space${context.parking === 1 ? '' : 's'}` : ''} on{' '}
            {context.landSizeSqm ?? '—'}m² of land.
          </p>
          <PropertyDetailList title={factors.valueAddingTitle} items={factors.valueAdding.map((item) => item.description)} />
        </div>

        {marketStats.length > 0 ? (
          <>
            <SectionDivider label="Market Analysis" />
            <MarketStatTiles stats={marketStats} />
          </>
        ) : null}

        <SectionDivider label="Comparable Sales Evidence" />
        <p className="mb-3 text-sm leading-relaxed text-relaive-navy/85">
          The following sales have been selected as the most comparable to the subject property, having regard to
          location, size, condition, and date of sale.
        </p>
        <ComparableSalesTable comparables={comparables} />

        <SectionDivider label="Valuation Assessment" />
        <ValuationRangeBar title="Estimated Market Value Range" priceRange={summary.priceRange} midpoint={summary.midpointEstimate} />

        <SectionDivider label={recommendations.title.replace(/^\d+\.\s*/, '')} />
        <div className="grid gap-4 sm:grid-cols-3">
          {recommendations.items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-black/5 bg-white p-5">
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-relaive-primary/10 text-relaive-primary">
                {getAgentRecommendationIcon(item.iconKey)}
              </span>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-relaive-gray/60">{item.title}</p>
              <p className="text-xs leading-relaxed text-relaive-navy/75">{item.description}</p>
            </div>
          ))}
        </div>

        <SectionDivider label="Agent Certification" />
        <ReportCertificationBlock
          name={agentName}
          roleLabel="Licensed Real Estate Agent · Relaive Property Group"
          statement="I confirm that this appraisal has been prepared in accordance with current market evidence and represents my professional opinion of the likely selling price range for the subject property. This is not a formal valuation and should not be relied upon as such."
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
