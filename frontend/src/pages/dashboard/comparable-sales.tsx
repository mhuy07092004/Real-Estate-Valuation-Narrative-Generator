import { SalesSearch } from '../../components/ui/search-bar/sales-search'
import { SearchIcon } from '../../components/ui/search-bar/address-search'

type ComparableSalesProps = {
  emptyStateDescription?: string
}

export function ComparableSales({
  emptyStateDescription = 'Search a property address to find comparable sales',
}: ComparableSalesProps) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1 flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
        <SalesSearch />

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
      </div>
    </div>
  )
}
