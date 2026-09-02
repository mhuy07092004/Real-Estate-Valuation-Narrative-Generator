import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchIcon } from '../../components/ui/search-bar/address-search'
import { SalesSearch, type SalesSearchQuery } from '../../components/ui/search-bar/sales-search'
import { ComparableSaleRow } from '../../features/dashboard/components/comparable-sale-row'
import { SubjectPropertyCard } from '../../features/dashboard/components/subject-property-card'
import {
  searchComparableSales,
  type ComparableSalesSearchResult,
} from '../../services/common'

type ComparableSalesProps = {
  emptyStateDescription?: string
}

// Real lookups resolve faster than a human can register — holding the
// skeleton up for a floor duration avoids a jarring flash-of-content and
// reads as a deliberate, "the system is working" moment instead.
const MIN_LOADING_MS = 550

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function SubjectPropertySkeleton() {
  return (
    <div
      className="animate-pulse rounded-2xl border border-black/5 bg-white/60 px-4 py-5 sm:px-6"
      aria-hidden="true"
    >
      <div className="h-3 w-28 rounded-full bg-relaive-gray/20" />
      <div className="mt-4 flex items-center gap-4">
        <div className="size-11 shrink-0 rounded-full bg-relaive-gray/20" />
        <div className="flex-1">
          <div className="h-4 w-2/3 max-w-xs rounded-full bg-relaive-gray/20" />
          <div className="mt-2 h-3 w-1/2 max-w-[220px] rounded-full bg-relaive-gray/15" />
        </div>
      </div>
    </div>
  )
}

function ComparableSaleRowSkeleton() {
  return (
    <div
      className="animate-pulse rounded-2xl border border-black/5 bg-white px-4 py-5 sm:px-5"
      aria-hidden="true"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1">
          <div className="h-4 w-40 rounded-full bg-relaive-gray/20" />
          <div className="mt-2 h-3 w-56 max-w-full rounded-full bg-relaive-gray/15" />
        </div>
        <div className="text-right">
          <div className="ml-auto h-4 w-24 rounded-full bg-relaive-gray/20" />
          <div className="mt-2 ml-auto h-3 w-16 rounded-full bg-relaive-gray/15" />
        </div>
      </div>
    </div>
  )
}

function ComparableSalesLoadingState() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-live="polite">
      <SubjectPropertySkeleton />
      <section>
        <div className="h-4 w-40 rounded-full bg-relaive-gray/20" />
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <ComparableSaleRowSkeleton key={index} />
          ))}
        </div>
      </section>
    </div>
  )
}

export function ComparableSales({
  emptyStateDescription = 'Search a property address to find comparable sales',
}: ComparableSalesProps) {
  const [searchParams] = useSearchParams()
  const addressFromQuery = searchParams.get('address') ?? ''

  const [result, setResult] = useState<ComparableSalesSearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  async function handleSearch(query: SalesSearchQuery) {
    if (!query.address.trim()) return

    setIsLoading(true)
    setSaved(false)
    setHasSearched(true)
    setResult(null)

    try {
      const [searchResult] = await Promise.all([
        searchComparableSales(query),
        wait(MIN_LOADING_MS),
      ])
      setResult(searchResult)
    } catch {
      setResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (addressFromQuery.trim()) {
      handleSearch({ address: addressFromQuery, dateRange: '12m', propertyType: 'all' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressFromQuery])

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1 flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
        <SalesSearch onSearch={handleSearch} initialAddress={addressFromQuery} />

        {isLoading ? <ComparableSalesLoadingState /> : null}

        {!isLoading && !hasSearched ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
            <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-[#E8F2F8] text-relaive-primary/70">
              <span className="scale-150">
                <SearchIcon />
              </span>
            </div>
            <p className="text-base font-semibold text-[#1C2A38]">{emptyStateDescription}</p>
            <p className="mt-1.5 text-sm text-relaive-gray">
              Enter an address above to get started
            </p>
          </div>
        ) : null}

        {!isLoading && hasSearched && result ? (
          <div className="flex flex-col gap-5">
            {result.subjectProperty ? (
              <div className="animate-stagger-in" style={{ animationDelay: '0ms' }}>
                <SubjectPropertyCard
                  property={result.subjectProperty}
                  saved={saved}
                  onSave={() => setSaved(true)}
                />
              </div>
            ) : null}

            <section>
              <h2
                className="animate-stagger-in text-base font-semibold text-relaive-navy sm:text-lg"
                style={{ animationDelay: '80ms' }}
              >
                Similar Sales Nearby
              </h2>
              <div className="mt-4 flex flex-col gap-3">
                {result.sales.map((sale, index) => (
                  <div
                    key={sale.id}
                    className="animate-stagger-in"
                    style={{ animationDelay: `${120 + index * 70}ms` }}
                  >
                    <ComparableSaleRow sale={sale} />
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  )
}
