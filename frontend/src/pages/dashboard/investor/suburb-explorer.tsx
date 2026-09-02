import { useEffect, useState } from 'react'
import { Card } from '../../../components/ui/card/card'
import { PriceTrendChart } from '../../../components/ui/chart/price-trend-chart'
import { AddressSearch } from '../../../components/ui/search-bar/address-search'
import { StatCard } from '../../../components/ui/stat-card/stat-card'
import { useAsyncData } from '../../../hooks/use-async-data'
import { MarketInsightsSkeleton } from '../../../features/dashboard/components/market-insights-skeleton'
import {
  SUBURB_EXPLORER_KNOWN_SUBURBS,
  getSuburbExplorerMockData,
} from '../../../services/investor'

const DEFAULT_SUBURB = 'Richmond VIC'
const SEARCH_DEBOUNCE_MS = 300

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 11.5L12 4.5l8 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 10v9.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9.5 20.5V15a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function TrendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 16.5l5.5-5.5 3.5 3.5L20 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15 7.5h5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5.5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 9.5h16" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 3.5v4M16 3.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function SuburbExplorer() {
  const [suburbInput, setSuburbInput] = useState(DEFAULT_SUBURB)
  const [activeSuburb, setActiveSuburb] = useState(DEFAULT_SUBURB)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setActiveSuburb(suburbInput.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [suburbInput])

  const { data, isLoading } = useAsyncData(
    () => getSuburbExplorerMockData({ suburb: activeSuburb }),
    [activeSuburb],
  )

  function handleSuggestionClick(suburb: string) {
    setSuburbInput(suburb)
    setActiveSuburb(suburb)
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1 flex-col gap-6 p-4 sm:gap-7 sm:p-6 lg:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
              Suburb Explorer
            </h1>
            <p className="mt-1 text-sm text-relaive-gray sm:text-base">
              Suburb insights and market performance
            </p>
          </div>
          <div className="w-[min(100%,16rem)] shrink-0">
            <AddressSearch
              placeholder="Search suburb, e.g. Richmond VIC"
              className="max-w-none"
              inputClassName="border-black/10 py-2.5 shadow-none"
              readOnly={false}
              value={suburbInput}
              onChange={setSuburbInput}
            />
          </div>
        </header>

        {isLoading ? (
          <MarketInsightsSkeleton />
        ) : !data ? (
          <div className="flex flex-col items-start gap-3 rounded-3xl border border-black/5 bg-white p-6 shadow-[0_4px_24px_rgba(26,32,44,0.06)]">
            <p className="text-sm text-relaive-gray">
              No market data found for “{activeSuburb}”. Try one of these suburbs:
            </p>
            <div className="flex flex-wrap gap-2">
              {SUBURB_EXPLORER_KNOWN_SUBURBS.map((suburb) => (
                <button
                  key={suburb}
                  type="button"
                  onClick={() => handleSuggestionClick(suburb)}
                  className="rounded-full bg-relaive-primary/10 px-3.5 py-1.5 text-sm font-medium text-relaive-primary transition-colors hover:bg-relaive-primary/20"
                >
                  {suburb}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={<HomeIcon />}
                tone="blue"
                label="Median Price"
                hint="median house price"
                value={data.stats.medianPrice}
                trend={`↗ ${data.stats.medianPriceTrend}`}
              />
              <StatCard
                icon={<TrendIcon />}
                tone="blue"
                label="Monthly Growth"
                hint="month-on-month"
                value={data.stats.monthlyGrowth}
                trend={`↗ ${data.stats.monthlyGrowthTrend}`}
              />
              <StatCard
                icon={<CalendarIcon />}
                tone="blue"
                label="Days on Market"
                hint="avg days listed"
                value={String(data.stats.daysOnMarket)}
                trend={`↘ ${data.stats.daysOnMarketTrend}`}
              />
              <StatCard
                icon={<PinIcon />}
                tone="blue"
                label="Rental Yield"
                hint="gross annual yield"
                value={data.stats.rentalYield}
                trend={`↗ ${data.stats.rentalYieldTrend}`}
              />
            </div>

            <Card>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-relaive-navy sm:text-xl">
                    Price Trend — Last 12 Months
                  </h2>
                  <p className="mt-1 text-sm text-relaive-gray">{data.suburb} · price index</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-relaive-gray">
                    {data.priceTrend[data.priceTrend.length - 1]?.month}:{' '}
                    <span className="font-semibold text-relaive-navy">{data.stats.medianPrice}</span>
                  </p>
                  <p className="text-relaive-gray">
                    Growth:{' '}
                    <span className="font-semibold text-relaive-primary">
                      {data.stats.medianPriceTrend}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <PriceTrendChart
                  data={data.priceTrend.map((point) => ({
                    label: point.month,
                    value: point.priceIndex,
                  }))}
                />
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
