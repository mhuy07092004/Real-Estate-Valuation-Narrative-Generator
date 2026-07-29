import { AddressSearch } from '../../../components/ui/search-bar/address-search'
import { Button } from '../../../components/ui/button/button'
import { FilterButton } from '../../../components/ui/button/filter-button'
import { PropertyCard } from '../../../components/ui/property-card/property-card'
import { useAsyncData } from '../../../hooks/use-async-data'
import { getSavedProperties } from '../../../services/mock-buyer'

export function SavedProperty() {
  const { data: properties } = useAsyncData(getSavedProperties, [])
  const propertyList = properties ?? []

  return (
    <div className="flex flex-col">
      <header className="font-sans px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
          Saved Properties
        </h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">
          {propertyList.length} saved properties
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

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {propertyList.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </div>
  )
}
