import { AddressSearch } from '../../../../components/ui/search-bar/address-search'
import { Button } from '../../../../components/ui/button/button'
import { FilterButton } from '../../../../components/ui/button/filter-button'

const MOCK_MATCH_COUNT = 128

export function SearchProperty() {
  return (
    <div className="flex flex-col">
      <header className="font-sans px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
          Search Properties
        </h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">
          {MOCK_MATCH_COUNT} match your criteria
        </p>
      </header>

      <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <AddressSearch className="max-w-none min-w-0 flex-1" />
          <FilterButton />
          <Button variant="primary" size="md" type="button">
            Search
          </Button>
        </div>
      </div>
    </div>
  )
}
