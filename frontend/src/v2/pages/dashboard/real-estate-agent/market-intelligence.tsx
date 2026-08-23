import { useState, type FormEvent } from 'react'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getAppraisalInputContext, setAppraisalInputContext } from '../../../../services/common'
import { getMarketMetrics } from '../../../services/common'
import { MarketIntelligenceView } from '../../../features/dashboard/components/market-intelligence/market-intelligence-view'

// New standalone page (net-new route, no v1 counterpart) — figma: MarketIntelligencePage.tsx.
// Rebuilt to match figma's actual pattern: title + suburb search side-by-side, metric cards,
// price trend chart — not the older Suburb Overview/Demand Signals layout. Shares its core
// rendering with the generate-report wizard's Market Intelligence step via
// MarketIntelligenceView (§4.5). Same real backend endpoint either way
// (/api/appraisal/market-metrics — new, additive, see §9.1), keyed by the address below.

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

export function MarketIntelligencePageV2() {
  const initialAddress = getAppraisalInputContext()?.address ?? '45 Park Ave, Richmond VIC 3121'
  const [addressInput, setAddressInput] = useState(initialAddress)
  const [searchedAddress, setSearchedAddress] = useState(initialAddress)

  const { data, isLoading } = useAsyncData(getMarketMetrics, [searchedAddress])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = addressInput.trim()
    if (!trimmed) return
    setAppraisalInputContext({ address: trimmed })
    setSearchedAddress(trimmed)
  }

  return (
    <div className="flex flex-col">
      <header className="flex flex-wrap items-start justify-between gap-4 px-4 pt-4 font-sans sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">Market Intelligence</h1>
          <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">Suburb insights and market performance</p>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-relaive-primary">
            <SearchIcon />
          </span>
          <input
            value={addressInput}
            onChange={(event) => setAddressInput(event.target.value)}
            placeholder="Search address…"
            className="w-64 rounded-xl border border-black/10 bg-white py-2.5 pl-9 pr-4 text-sm text-relaive-navy shadow-sm placeholder:text-relaive-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
          />
        </form>
      </header>

      <div className="p-4 sm:p-6 lg:p-8">
        {isLoading || !data ? (
          <div className="rounded-2xl border border-black/5 bg-white py-12 text-center text-sm text-relaive-gray">
            Loading market data…
          </div>
        ) : (
          <MarketIntelligenceView metrics={data.metrics} priceTrend={data.priceTrend} variant="full" />
        )}
      </div>
    </div>
  )
}
