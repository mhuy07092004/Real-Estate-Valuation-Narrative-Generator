import { useMemo, useState } from 'react'
import { getAppraisalInputContext } from '../../../../services/common'

// v2 build of the shared Property Timeline page (figma: PropertyTimelinePage.tsx, read in
// full) — reachable from any role via the sidebar's "Timeline" nav item (wired in Phase 1 to
// `/dashboard/{role}/timeline`, see use-dashboard-nav-state.ts). The figma page is a
// per-address sale/listing/renovation history with AI commentary — there is no property
// history / title-transfer / renovation-record data source anywhere in this app (checked
// `services/common.ts` and the wizard's comparable-sales/appraisal-summary endpoints — they
// return current comparable listings and suburb metrics, not a single address's own event
// history over time).
//
// Judgment call: rather than show a fully generic hardcoded address (unrelated to whatever
// the user is actually working on), the subject property here is seeded from
// `getAppraisalInputContext()` — the same shared address-context store the wizard writes to
// (`setAppraisalInputContext`, used by comparable-sales/generate-report navigation
// elsewhere). If nothing has been set yet (e.g. landing here directly), falls back to a
// clearly-labelled illustrative default. The event history itself (sale prices, renovation
// dates, AI commentary) remains illustrative mock content — there is no real per-address
// history endpoint to source it from — flagged in backend/V2_BACKEND_TODO.md as a net-new
// property-history data source this page should be wired to once one exists.

type TimelineEventType = 'sale' | 'listing' | 'ownership' | 'renovation' | 'market'

type TimelineEvent = {
  id: string
  year: string
  month: string
  type: TimelineEventType
  title: string
  detail: string
  value?: string
  aiComment?: string
  highlight?: boolean
}

const EVENTS: TimelineEvent[] = [
  {
    id: '1',
    year: '2024',
    month: 'Nov',
    type: 'listing',
    title: 'Listed for Sale',
    detail: 'Listed at $1,495,000 with Ray White Melbourne',
    aiComment: 'Priced aggressively for the current market. Based on comparable sales, fair value is $1,420K–$1,500K.',
    highlight: true,
  },
  {
    id: '2',
    year: '2023',
    month: 'Mar',
    type: 'renovation',
    title: 'Kitchen & Bathroom Renovation',
    detail: 'Full kitchen renovation and master bathroom upgrade',
    value: '~$85,000',
    aiComment: 'Estimated 8-12% value uplift from recent renovations in comparable properties.',
  },
  {
    id: '3',
    year: '2019',
    month: 'Jul',
    type: 'sale',
    title: 'Sold',
    detail: 'Sold via auction to current owners',
    value: '$1,050,000',
    aiComment: 'Purchased 28% below current estimated value, reflecting strong capital growth over 5 years.',
    highlight: true,
  },
  { id: '4', year: '2018', month: 'Feb', type: 'listing', title: 'Listed for Sale', detail: 'Listed at $1,095,000, passed in at auction' },
  {
    id: '5',
    year: '2015',
    month: 'Apr',
    type: 'market',
    title: 'Market Event',
    detail: 'Melbourne housing market peak – suburb median grew 22% in 12 months',
    aiComment: 'Historical market event that significantly boosted area values.',
  },
  {
    id: '6',
    year: '2012',
    month: 'Sep',
    type: 'sale',
    title: 'Sold',
    detail: 'Sold at auction',
    value: '$720,000',
    aiComment: 'Sold during a period of strong buyer demand. 45% growth since this sale.',
  },
  { id: '7', year: '2008', month: 'Jun', type: 'ownership', title: 'Ownership Transfer', detail: 'Title transferred – estate transaction' },
  { id: '8', year: '2005', month: 'Mar', type: 'renovation', title: 'Extension Built', detail: 'Rear extension adding 2nd bathroom and living room' },
  {
    id: '9',
    year: '1995',
    month: 'Jan',
    type: 'sale',
    title: 'First Recorded Sale',
    detail: 'Original sale',
    value: '$185,000',
    aiComment: 'Property has grown 7.2× from original purchase price — 7.4% annual growth over 29 years.',
  },
]

const TYPE_CONFIG: Record<TimelineEventType, { color: string; bg: string; label: string }> = {
  sale: { color: 'text-relaive-primary', bg: 'bg-relaive-primary', label: 'Sale' },
  listing: { color: 'text-emerald-600', bg: 'bg-emerald-500', label: 'Listing' },
  ownership: { color: 'text-purple-500', bg: 'bg-purple-500', label: 'Ownership' },
  renovation: { color: 'text-amber-600', bg: 'bg-amber-400', label: 'Renovation' },
  market: { color: 'text-orange-500', bg: 'bg-orange-400', label: 'Market Event' },
}

const SALES_HISTORY = [
  { year: 1995, price: 185000 },
  { year: 2012, price: 720000 },
  { year: 2019, price: 1050000 },
  { year: 2024, price: 1495000 },
]

const FALLBACK_ADDRESS = '45 Smith Street, South Yarra VIC 3141'

function formatPrice(price: number): string {
  return price >= 1000000 ? `$${(price / 1000000).toFixed(2)}M` : `$${(price / 1000).toFixed(0)}K`
}

function buildPropertySummary(): { address: string; detailLine: string } {
  const context = getAppraisalInputContext()
  if (!context?.address) {
    return { address: FALLBACK_ADDRESS, detailLine: 'House · 3 bed 2 bath · 430m² land · Built c.1985' }
  }

  const parts: string[] = [context.propertyType ?? 'House']
  if (typeof context.bedrooms === 'number') parts.push(`${context.bedrooms} bed`)
  if (typeof context.bathrooms === 'number') parts.push(`${context.bathrooms} bath`)
  if (typeof context.parking === 'number') parts.push(`${context.parking} car`)
  if (typeof context.landSizeSqm === 'number') parts.push(`${context.landSizeSqm}m² land`)

  return { address: context.address, detailLine: parts.join(' · ') }
}

export function PropertyTimelinePageV2() {
  const [expandedId, setExpandedId] = useState<string | null>('1')
  const [filterType, setFilterType] = useState<'all' | TimelineEventType>('all')

  const property = useMemo(buildPropertySummary, [])
  const filtered = filterType === 'all' ? EVENTS : EVENTS.filter((e) => e.type === filterType)
  const maxPrice = Math.max(...SALES_HISTORY.map((s) => s.price))
  const firstPrice = SALES_HISTORY[0].price
  const lastPrice = SALES_HISTORY[SALES_HISTORY.length - 1].price
  const totalGrowthPct = Math.round(((lastPrice - firstPrice) / firstPrice) * 100)

  return (
    <div className="flex flex-col gap-6 p-4 font-sans sm:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">Property Timeline</h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">Complete history with AI-powered commentary</p>
      </header>

      <div className="rounded-2xl bg-relaive-navy p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs text-white/50">Subject Property</span>
            </div>
            <h2 className="text-xl">{property.address}</h2>
            <p className="text-sm text-white/60">{property.detailLine}</p>
          </div>
          <div className="text-right">
            <div className="mb-1 text-xs text-white/50">Current Estimate</div>
            <div className="text-2xl font-semibold text-emerald-300">{formatPrice(lastPrice)}</div>
            <div className="mt-0.5 text-xs text-white/40">
              +{totalGrowthPct}% since {SALES_HISTORY[0].year}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-6">
        <h3 className="mb-5 text-base font-medium text-relaive-navy">Sale Price History</h3>
        <div className="mb-3 flex h-36 items-end justify-around gap-4">
          {SALES_HISTORY.map((sale, idx) => {
            const height = (sale.price / maxPrice) * 100
            const isLatest = idx === SALES_HISTORY.length - 1
            return (
              <div key={sale.year} className="flex flex-col items-center gap-2">
                <div className="text-xs font-medium text-relaive-primary">{formatPrice(sale.price)}</div>
                <div
                  className={`w-16 rounded-t-xl ${isLatest ? 'bg-relaive-primary' : 'bg-relaive-primary/25'}`}
                  style={{ height: `${height}%`, minHeight: 8 }}
                />
                <div className="text-xs text-relaive-gray/70">{sale.year}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`rounded-xl px-4 py-2 text-sm transition-colors ${
            filterType === 'all'
              ? 'bg-relaive-primary text-white'
              : 'border border-black/10 bg-white text-relaive-navy hover:border-relaive-primary/30'
          }`}
        >
          All Events
        </button>
        {(Object.entries(TYPE_CONFIG) as [TimelineEventType, (typeof TYPE_CONFIG)[TimelineEventType]][]).map(([type, cfg]) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilterType(type)}
            className={`rounded-xl px-4 py-2 text-sm transition-colors ${
              filterType === type
                ? 'bg-relaive-primary text-white'
                : 'border border-black/10 bg-white text-relaive-navy hover:border-relaive-primary/30'
            }`}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {filtered.map((event) => {
          const cfg = TYPE_CONFIG[event.type]
          const isExpanded = expandedId === event.id
          return (
            <div key={event.id} className="flex gap-5">
              <div
                className={`z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-white shadow-md ${
                  event.highlight ? 'bg-relaive-primary text-white' : `bg-white ${cfg.color}`
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${event.highlight ? 'bg-white' : cfg.bg}`} />
              </div>

              <div
                className={`flex-grow cursor-pointer overflow-hidden rounded-2xl border bg-white transition-colors ${
                  event.highlight
                    ? 'border-relaive-primary/30 shadow-md'
                    : isExpanded
                      ? 'border-relaive-primary/25 shadow-md'
                      : 'border-black/5 hover:border-relaive-primary/20'
                }`}
                onClick={() => setExpandedId(isExpanded ? null : event.id)}
              >
                <div className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-xs text-relaive-gray/60">{event.month}</div>
                        <div className="text-sm font-semibold text-relaive-primary">{event.year}</div>
                      </div>
                      <div className="h-8 w-px bg-black/10" />
                      <div>
                        <div className="mb-0.5 flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] ${cfg.color} bg-black/5`}>{cfg.label}</span>
                          <h3 className="text-sm font-medium text-relaive-navy">{event.title}</h3>
                        </div>
                        <p className="text-xs text-relaive-gray">{event.detail}</p>
                      </div>
                    </div>
                    {event.value ? <span className="text-base font-semibold text-relaive-primary">{event.value}</span> : null}
                  </div>
                </div>

                {isExpanded && event.aiComment ? (
                  <div className="border-t border-black/5 px-4 pb-4">
                    <div className="mt-3 rounded-xl bg-relaive-primary/5 p-3">
                      <div className="mb-1 text-xs font-medium text-relaive-primary">AI Commentary</div>
                      <p className="text-sm text-relaive-navy/80">{event.aiComment}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-6">
        <h3 className="mb-4 text-base font-medium text-relaive-navy">Ownership Summary</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Recorded Sales', value: String(SALES_HISTORY.length), desc: `Since ${SALES_HISTORY[0].year}` },
            { label: 'Last Sale Price', value: formatPrice(SALES_HISTORY[SALES_HISTORY.length - 2]?.price ?? lastPrice), desc: '' },
            { label: 'Total Growth', value: `+${totalGrowthPct}%`, desc: 'Since first sale' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-[#F5F7FA] p-4">
              <div className="mb-1 text-xl font-semibold text-relaive-primary">{item.value}</div>
              <div className="text-sm text-relaive-navy">{item.label}</div>
              {item.desc ? <div className="text-xs text-relaive-gray/70">{item.desc}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
