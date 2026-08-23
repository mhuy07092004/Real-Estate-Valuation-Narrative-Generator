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

// v2 rebuild of the wizard's final report — matches figma's VendorAppraisalReport document
// pattern (dark header banner, SectionDivider-separated sections, comparable-sales table,
// valuation range bar, campaign-strategy cards, agent certification) instead of v1's lighter
// component-composed panel. All content is real: narrativePreview is the actual Groq-generated
// (or static-fallback) narrative; everything else comes from the same backend mock endpoints
// v1 already used, just laid out to match figma. See figma-ui-migration-plan.md §9.

function BuildingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="3" width="10" height="18" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 9h6v12h-6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function CheckDotIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.5" stroke="white" strokeWidth="1.5" />
      <path d="M5 19.5c1.3-3.6 3.9-5.5 7-5.5s5.7 1.9 7 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="my-8 flex items-center gap-4">
      <div className="h-px flex-grow bg-black/5" />
      <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-relaive-gray/60">{label}</span>
      <div className="h-px flex-grow bg-black/5" />
    </div>
  )
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(price)
}

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
  const avgComparablePrice = comparables.length
    ? Math.round(comparables.reduce((sum, sale) => sum + sale.price, 0) / comparables.length)
    : 0
  const marketStats = MARKET_STAT_ORDER.map((id) => summary.stats.find((stat) => stat.id === id)).filter(
    (stat): stat is (typeof summary.stats)[number] => Boolean(stat),
  )
  const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-[#102132] to-[#1C2A38] px-6 py-7 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-relaive-primary to-relaive-secondary text-white">
                <BuildingIcon />
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-white/60">
                Relaive · Property Appraisal
              </span>
            </div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Vendor Appraisal Report</h2>
            <p className="mt-1 text-sm text-white/50">
              {context.address}
            </p>
          </div>
          <div className="text-right">
            <p className="mb-1 text-[10px] uppercase tracking-wide text-white/40">Prepared by</p>
            <p className="text-sm font-semibold text-white">{agentName}</p>
            <p className="mt-0.5 text-xs text-white/50">{today}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-6 border-t border-white/10 pt-5">
          {[
            { label: 'Estimated Value', value: summary.priceRange, highlight: true },
            { label: 'Midpoint', value: summary.midpointEstimate },
            { label: 'Property Type', value: context.propertyType ?? '—' },
            {
              label: `${context.bedrooms ?? 0} bed · ${context.bathrooms ?? 0} bath · ${context.parking ?? 0} car`,
              value: context.landSizeSqm ? `${context.landSizeSqm}m²` : '—',
            },
          ].map((item) => (
            <div key={item.label}>
              <p className="mb-0.5 text-[10px] uppercase tracking-wide text-white/40">{item.label}</p>
              <p className={item.highlight ? 'text-base font-semibold text-relaive-secondary' : 'text-sm font-semibold text-white'}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

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
          <div className="rounded-2xl bg-black/[0.02] p-5">
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-relaive-gray/60">
              {factors.valueAddingTitle}
            </p>
            <div className="flex flex-col gap-2.5">
              {factors.valueAdding.map((item) => (
                <div key={item.id} className="flex items-start gap-2.5 text-sm text-relaive-navy/80">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-relaive-primary/15 text-relaive-primary">
                    <CheckDotIcon />
                  </span>
                  {item.description}
                </div>
              ))}
            </div>
          </div>
        </div>

        {marketStats.length > 0 ? (
          <>
            <SectionDivider label="Market Analysis" />
            <div className="grid grid-cols-3 gap-3">
              {marketStats.map((stat) => (
                <div key={stat.id} className="rounded-2xl bg-black/[0.02] p-4 text-center">
                  <p className="text-lg font-bold text-relaive-navy">{stat.value}</p>
                  <p className="mt-0.5 text-[10px] text-relaive-gray">{stat.label}</p>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <SectionDivider label="Comparable Sales Evidence" />
        <p className="mb-3 text-sm leading-relaxed text-relaive-navy/85">
          The following sales have been selected as the most comparable to the subject property, having regard to
          location, size, condition, and date of sale.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-black/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/[0.02]">
                {['Address', 'Config', 'Land', 'Sold', 'Sale Price'].map((header, index) => (
                  <th
                    key={header}
                    className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-relaive-gray/60 ${
                      index === 0 ? 'text-left' : index === 4 ? 'text-right' : 'text-center'
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {comparables.map((sale, index) => (
                <tr key={sale.id} className={index % 2 === 0 ? 'bg-white' : 'bg-black/[0.01]'}>
                  <td className="px-4 py-3 font-medium text-relaive-navy">{sale.address}</td>
                  <td className="px-4 py-3 text-center text-xs text-relaive-gray">
                    {sale.beds}b · {sale.baths}ba
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-relaive-gray">{sale.areaSqm}m²</td>
                  <td className="px-4 py-3 text-center text-xs text-relaive-gray">{sale.soldAgo}</td>
                  <td className="px-4 py-3 text-right font-bold text-relaive-navy">{formatPrice(sale.price)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-relaive-primary/15 bg-relaive-primary/5">
                <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-relaive-primary">
                  Comparable Average
                </td>
                <td className="px-4 py-3 text-right font-bold text-relaive-primary">{formatPrice(avgComparablePrice)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <SectionDivider label="Valuation Assessment" />
        <div className="rounded-2xl border border-relaive-primary/20 bg-gradient-to-br from-relaive-primary/[0.06] to-relaive-secondary/[0.04] p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-relaive-gray/60">
                Estimated Market Value Range
              </p>
              <p className="text-2xl font-bold text-relaive-navy sm:text-3xl">{summary.priceRange}</p>
            </div>
            <div className="text-right">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-relaive-gray/60">Midpoint</p>
              <p className="text-lg font-bold text-relaive-primary sm:text-xl">{summary.midpointEstimate}</p>
            </div>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-black/5">
            <div className="absolute inset-y-0 left-[15%] right-[15%] rounded-full bg-gradient-to-r from-relaive-primary to-relaive-secondary" />
            <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-px bg-white" />
          </div>
          <div className="mt-1.5 flex justify-between">
            <span className="text-[10px] text-relaive-gray/60">Lower</span>
            <span className="text-[10px] text-relaive-gray/60">Upper</span>
          </div>
        </div>

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
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-relaive-primary to-relaive-secondary shadow-md">
            <UserIcon />
          </span>
          <div>
            <p className="text-sm font-bold text-relaive-navy">{agentName}</p>
            <p className="mb-2.5 text-xs text-relaive-gray">Licensed Real Estate Agent · Relaive Property Group</p>
            <p className="text-xs leading-relaxed text-relaive-navy/75">
              I confirm that this appraisal has been prepared in accordance with current market evidence and
              represents my professional opinion of the likely selling price range for the subject property. This is
              not a formal valuation and should not be relied upon as such.
            </p>
          </div>
        </div>

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
