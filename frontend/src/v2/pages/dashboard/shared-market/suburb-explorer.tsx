import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getMarketMetricsForAddress, type MarketMetrics } from '../../../services/common'

// Net-new page shared by Investor and Buyer nav (both route to /dashboard/:role/suburb-explorer
// per Phase 1's use-dashboard-nav-state.ts). Figma: SuburbExplorerPage.tsx — a 7-tab deep-dive
// (Overview / Price Trends / Rental Market / Supply & Demand / Demographics / Forecast / Risks)
// with an "Opportunity Score" built from 6 fabricated sub-scores.
//
// Only real, backend-computed per-suburb data in this app is the 4-metric + 12-month price
// trend payload from /api/appraisal/market-metrics (same source as Market Comparison — see
// that page's header comment and backend/V2_BACKEND_TODO.md). So:
// - Overview + Price Trends tabs are real, built from that endpoint.
// - Opportunity Score is a genuine *derived* composite of the 4 real metrics (growth, monthly
//   growth, rental yield — higher better; days on market — lower better), not a fabricated
//   number — each sub-score is shown with the real figure it comes from.
// - Rental Market / Supply & Demand / Demographics / Forecast / Risks have no backing data
//   source (no vacancy-rate, population, or forecast dataset anywhere in this repo) and are
//   rendered as an honest "not available yet" panel rather than the prototype's fabricated
//   charts/numbers. Logged in backend/V2_BACKEND_TODO.md.
// - No suburb-search/autocomplete endpoint exists, so search uses a fixed list of real
//   Australian suburbs (same approach as Market Comparison).

type ExplorerTab = 'overview' | 'price-trends' | 'more'

const SUBURB_OPTIONS = [
  { label: 'Footscray VIC 3011', address: '1 Main St, Footscray VIC 3011' },
  { label: 'Richmond VIC 3121', address: '1 Main St, Richmond VIC 3121' },
  { label: 'Fitzroy VIC 3065', address: '1 Main St, Fitzroy VIC 3065' },
  { label: 'Brunswick VIC 3056', address: '1 Main St, Brunswick VIC 3056' },
  { label: 'Northcote VIC 3070', address: '1 Main St, Northcote VIC 3070' },
  { label: 'Surry Hills NSW 2010', address: '1 Main St, Surry Hills NSW 2010' },
]

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path d="M20 20 16.5 16.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="11" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function metricValue(metrics: MarketMetrics, id: string) {
  return metrics.metrics.find((m) => m.id === id)
}

function numberFrom(text: string | undefined): number {
  if (!text) return 0
  const parsed = Number.parseFloat(text.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function clamp01to100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

function formatCompactPrice(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  return `$${Math.round(value / 1000)}k`
}

function useOpportunityScore(metrics: MarketMetrics | null) {
  if (!metrics) return null
  const growthPct = numberFrom(metricValue(metrics, 'median-price')?.change)
  const monthlyPct = numberFrom(metricValue(metrics, 'monthly-growth')?.value)
  const yieldPct = numberFrom(metricValue(metrics, 'rental-yield')?.value)
  const dom = numberFrom(metricValue(metrics, 'days-on-market')?.value)

  const factors = [
    { label: '12-Month Growth', score: clamp01to100(50 + growthPct * 6), detail: `${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(1)}% over the last 12 months` },
    { label: 'Monthly Momentum', score: clamp01to100(monthlyPct * 40), detail: `${monthlyPct.toFixed(2)}% average monthly pace` },
    { label: 'Rental Yield', score: clamp01to100(yieldPct * 15), detail: `${yieldPct.toFixed(1)}% gross annual yield` },
    { label: 'Market Turnover', score: clamp01to100(100 - dom), detail: `${dom} days on market on average` },
  ]
  const overall = Math.round(factors.reduce((sum, f) => sum + f.score, 0) / factors.length)
  return { overall, factors }
}

export function SuburbExplorerPageV2() {
  const { role: roleParam } = useParams<{ role: string }>()
  const role = roleParam ?? 'investor'
  const [queryInput, setQueryInput] = useState(SUBURB_OPTIONS[0].label)
  const [selectedAddress, setSelectedAddress] = useState(SUBURB_OPTIONS[0].address)
  const [selectedLabel, setSelectedLabel] = useState(SUBURB_OPTIONS[0].label)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeTab, setActiveTab] = useState<ExplorerTab>('overview')

  const { data: metrics, isLoading } = useAsyncData(() => getMarketMetricsForAddress(selectedAddress), [selectedAddress])
  const opportunity = useOpportunityScore(metrics ?? null)

  function pickSuggestion(option: (typeof SUBURB_OPTIONS)[number]) {
    setQueryInput(option.label)
    setSelectedLabel(option.label)
    setSelectedAddress(option.address)
    setShowSuggestions(false)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const match = SUBURB_OPTIONS.find((s) => s.label.toLowerCase() === queryInput.trim().toLowerCase())
    if (match) pickSuggestion(match)
  }

  const tabs: { id: ExplorerTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'price-trends', label: 'Price Trends' },
    { id: 'more', label: 'More Insights' },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="rounded-2xl bg-gradient-to-r from-[#102132] to-[#1C2A38] p-6">
        <h1 className="mb-4 text-xl font-semibold text-white">Suburb Explorer</h1>
        <form onSubmit={handleSubmit} className="relative max-w-lg">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
            <SearchIcon />
          </span>
          <input
            value={queryInput}
            onChange={(e) => {
              setQueryInput(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Enter suburb, postcode, or region…"
            className="w-full rounded-xl border border-white/20 bg-white/10 py-3.5 pl-12 pr-4 text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/15 focus:outline-none"
          />
          {showSuggestions ? (
            <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-black/5 bg-white shadow-xl">
              {SUBURB_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickSuggestion(option)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-relaive-navy transition-colors hover:bg-[#EEF3F7]"
                >
                  <span className="text-relaive-primary">
                    <MapPinIcon />
                  </span>
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </form>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-relaive-primary">
                <MapPinIcon />
              </span>
              <h2 className="text-xl font-semibold text-relaive-navy">{selectedLabel}</h2>
            </div>
            <span className="text-xs text-relaive-gray">Real market metrics, computed per suburb</span>
          </div>
        </div>

        {isLoading || !metrics ? (
          <p className="text-sm text-relaive-gray">Loading suburb data…</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {metrics.metrics.map((m) => (
              <div key={m.id}>
                <p className="mb-0.5 text-xs text-relaive-gray">{m.label}</p>
                <p className="text-xl font-bold text-relaive-navy">{m.value}</p>
                <p className={`text-xs font-medium ${m.up ? 'text-emerald-600' : 'text-red-500'}`}>{m.change}</p>
              </div>
            ))}
            {opportunity ? (
              <div>
                <p className="mb-0.5 text-xs text-relaive-gray">Opportunity Score</p>
                <p className="text-3xl font-bold text-relaive-primary">{opportunity.overall}</p>
                <p className="text-xs text-relaive-gray">out of 100</p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-black/5 bg-white p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.id ? 'bg-relaive-primary text-white' : 'text-relaive-gray hover:bg-[#EEF3F7]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && opportunity ? (
        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
          <div className="border-b border-[#EEF3F7] px-5 py-4">
            <h3 className="text-sm font-semibold text-relaive-navy">Investment Opportunity Score — {opportunity.overall}/100</h3>
            <p className="mt-0.5 text-xs text-relaive-gray">Derived from the real market metrics above (growth, momentum, yield, turnover)</p>
          </div>
          <div className="space-y-3 p-5">
            {opportunity.factors.map((f) => (
              <div key={f.label}>
                <div className="flex items-center gap-3">
                  <span className="w-36 flex-shrink-0 text-sm font-medium text-relaive-navy">{f.label}</span>
                  <div className="h-2 flex-grow overflow-hidden rounded-full bg-[#EEF3F7]">
                    <div className="h-full rounded-full bg-gradient-to-r from-relaive-primary to-relaive-secondary" style={{ width: `${f.score}%` }} />
                  </div>
                  <span className="w-10 flex-shrink-0 text-right text-sm font-bold text-relaive-primary">{f.score}</span>
                </div>
                <p className="mt-1 pl-[9.75rem] text-xs text-relaive-gray">{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === 'price-trends' && metrics ? (
        <div className="rounded-2xl border border-black/5 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-relaive-navy">Median Sale Price — Last 12 Months</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.priceTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="suburbExplorerPriceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5193B3" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#5193B3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF3F7" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#1C2A38', fillOpacity: 0.45 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#1C2A38', fillOpacity: 0.45 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => formatCompactPrice(v)}
                  domain={['auto', 'auto']}
                />
                <Tooltip formatter={(v: unknown) => [formatCompactPrice(Number(v ?? 0)), 'Median']} contentStyle={{ borderRadius: 12, border: '1px solid #EEF3F7', fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke="#5193B3" strokeWidth={2} fill="url(#suburbExplorerPriceGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {activeTab === 'more' ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-white p-8 text-center">
          <p className="text-sm font-medium text-relaive-navy">Rental market, supply & demand, demographics, and forecast data aren't available yet</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-relaive-gray">
            This app doesn't have a real vacancy-rate, population, or forecast data source for {role === 'buyer' ? 'buyer' : 'investor'} suburb research yet.
            See backend/V2_BACKEND_TODO.md.
          </p>
        </div>
      ) : null}
    </div>
  )
}
