import { useEffect, useState, type FormEvent } from 'react'
import { BUTTON_FONT_CLASS } from '../button/button'
import { AddressSearch, SearchIcon } from './address-search'

const DATE_RANGES = [
  { value: '12m', label: 'Last 12 months' },
  { value: '6m', label: 'Last 6 months' },
  { value: '3m', label: 'Last 3 months' },
  { value: '1m', label: 'Last month' },
] as const

const PROPERTY_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'land', label: 'Land' },
] as const

export type SalesSearchQuery = {
  address: string
  dateRange: string
  propertyType: string
}

type SalesSearchProps = {
  className?: string
  initialAddress?: string
  onSearch?: (query: SalesSearchQuery) => void
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M3.5 10h17" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8 3.5v3.5M16 3.5v3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function HouseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 11.5L12 4.5l8 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 10.5V19.5h11V10.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const selectClassName =
  'appearance-none rounded-full bg-[#E8EDF1] py-2 pl-4 pr-9 text-sm font-medium text-relaive-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary'

export function SalesSearch({ className = '', initialAddress = '', onSearch }: SalesSearchProps) {
  const [address, setAddress] = useState(initialAddress)
  const [dateRange, setDateRange] = useState<string>('12m')
  const [propertyType, setPropertyType] = useState<string>('all')

  useEffect(() => {
    if (initialAddress) setAddress(initialAddress)
  }, [initialAddress])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearch?.({
      address: address.trim(),
      dateRange,
      propertyType,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl border border-black/8 bg-white p-4 shadow-[0_1px_4px_rgba(26,32,44,0.04)] sm:p-5 ${className}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <AddressSearch
          placeholder="Enter a property address..."
          className="max-w-none min-w-0 flex-1"
          inputClassName="border-transparent bg-[#F3F4F6] py-3.5 shadow-none"
          iconPosition="left"
          readOnly={false}
          value={address}
          onChange={setAddress}
        />
        <button
          type="submit"
          className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl ${BUTTON_FONT_CLASS} bg-gradient-to-r from-relaive-primary to-relaive-secondary px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary`}
        >
          <SearchIcon />
          Search
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3">
        <label className="flex items-center gap-2.5 text-sm text-relaive-gray">
          <CalendarIcon />
          <span>Date Range</span>
          <span className="relative">
            <select
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value)}
              className={selectClassName}
              aria-label="Date range"
            >
              {DATE_RANGES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-relaive-gray">
              <ChevronIcon />
            </span>
          </span>
        </label>

        <label className="flex items-center gap-2.5 text-sm text-relaive-gray">
          <HouseIcon />
          <span>Property Type</span>
          <span className="relative">
            <select
              value={propertyType}
              onChange={(event) => setPropertyType(event.target.value)}
              className={selectClassName}
              aria-label="Property type"
            >
              {PROPERTY_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-relaive-gray">
              <ChevronIcon />
            </span>
          </span>
        </label>
      </div>
    </form>
  )
}
