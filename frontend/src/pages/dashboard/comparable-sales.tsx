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

    try {
      const searchResult = await searchComparableSales(query)
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

        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
            <p className="text-sm text-relaive-gray">Searching comparable sales…</p>
          </div>
        ) : null}

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
              <SubjectPropertyCard
                property={result.subjectProperty}
                saved={saved}
                onSave={() => setSaved(true)}
              />
            ) : null}

            <section>
              <h2 className="text-base font-semibold text-relaive-navy sm:text-lg">
                Similar Sales Nearby
              </h2>
              <div className="mt-4 flex flex-col gap-3">
                {result.sales.map((sale) => (
                  <ComparableSaleRow key={sale.id} sale={sale} />
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  )
}
