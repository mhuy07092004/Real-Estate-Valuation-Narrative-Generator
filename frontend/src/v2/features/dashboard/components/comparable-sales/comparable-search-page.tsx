import { useMemo, useState, type FormEvent } from 'react'
import { Button } from '../../../../../components/ui/button/button'
import { getAppraisalInputContext, setAppraisalInputContext } from '../../../../../services/common'
import { useAsyncData } from '../../../../../hooks/use-async-data'
import { getComparableSalesV2, type ComparableSaleV2 } from '../../../../services/common'
import { saveComparableProperty } from '../../../../services/saved-properties'
import { ComparableSalesView } from './comparable-sales-view'

// Shared standalone-page core for Comparable Sales (Agent) and Evidence Centre (Valuer) —
// figma's ComparableSalesPage.tsx and EvidenceCentrePage.tsx are near-identical (search bar,
// filters, Subject Property card, save action, results list), differing only in copy. Per
// §4.5's shared-core rule, this is one component parameterized by copy instead of two
// hand-duplicated pages. See figma-ui-migration-plan.md §10.2/§10.4.

const DATE_RANGE_OPTIONS = ['Last 3 months', 'Last 6 months', 'Last 12 months', 'Last 2 years'] as const
const DATE_RANGE_MAX_WEEKS: Record<(typeof DATE_RANGE_OPTIONS)[number], number> = {
  'Last 3 months': 13,
  'Last 6 months': 26,
  'Last 12 months': 52,
  'Last 2 years': 104,
}

const PROPERTY_TYPE_OPTIONS = ['All Types', 'House', 'Townhouse', 'Unit', 'Apartment'] as const

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function parseWeeksAgo(soldAgo: string): number | null {
  const match = soldAgo.match(/(\d+)\s*week/i)
  if (!match) return null
  return Number(match[1])
}

export type ComparableSearchPageCopy = {
  pageTitle: string
  pageSubtitle: string
  searchPlaceholder: string
  emptyStateTitle: string
  emptyStateSubtitle: string
  loadingLabel: string
  resultsHeading: string
  saveIdleLabel: string
  saveSavingLabel: string
  saveSavedLabel: string
}

function SubjectPropertyCard({ address, copy }: { address: string; copy: ComparableSearchPageCopy }) {
  const context = getAppraisalInputContext()
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState<string | null>(null)

  const detailParts: string[] = []
  if (typeof context?.bedrooms === 'number') detailParts.push(`${context.bedrooms} bed`)
  if (typeof context?.bathrooms === 'number') detailParts.push(`${context.bathrooms} bath`)
  if (typeof context?.landSizeSqm === 'number') detailParts.push(`${context.landSizeSqm}m²`)
  if (context?.propertyType) detailParts.push(context.propertyType)

  async function handleSave() {
    if (!context || saveState !== 'idle') return
    setError(null)
    setSaveState('saving')
    try {
      await saveComparableProperty(context)
      setSaveState('saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Please try again.')
      setSaveState('idle')
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-relaive-primary/25 bg-gradient-to-br from-relaive-primary/5 to-relaive-secondary/5">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-relaive-primary to-relaive-secondary" />
      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-relaive-primary to-relaive-secondary text-white">
              <HomeIcon />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-relaive-primary">Subject Property</div>
              <h2 className="truncate text-base font-semibold leading-snug text-relaive-navy">{address}</h2>
              {detailParts.length > 0 ? (
                <p className="mt-0.5 text-sm text-relaive-gray">{detailParts.join(' · ')}</p>
              ) : null}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!context || saveState !== 'idle'}
            className={saveState === 'saved' ? 'border-relaive-secondary/30 bg-relaive-secondary/10 text-relaive-secondary' : undefined}
          >
            {saveState === 'saved' ? (
              <>
                <CheckIcon /> <span className="ml-2">{copy.saveSavedLabel}</span>
              </>
            ) : saveState === 'saving' ? (
              copy.saveSavingLabel
            ) : (
              copy.saveIdleLabel
            )}
          </Button>
        </div>

        {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}
      </div>
    </div>
  )
}

export function ComparableSearchPage({ copy }: { copy: ComparableSearchPageCopy }) {
  const initialAddress = getAppraisalInputContext()?.address ?? ''
  const [addressInput, setAddressInput] = useState(initialAddress)
  const [searchedAddress, setSearchedAddress] = useState(initialAddress)
  const [dateRange, setDateRange] = useState<(typeof DATE_RANGE_OPTIONS)[number]>('Last 12 months')
  const [propertyType, setPropertyType] = useState<(typeof PROPERTY_TYPE_OPTIONS)[number]>('All Types')

  const { data: sales, isLoading } = useAsyncData(
    () => (searchedAddress ? getComparableSalesV2() : Promise.resolve([])),
    [searchedAddress],
  )

  const filteredSales = useMemo(() => {
    const all: ComparableSaleV2[] = sales ?? []
    const maxWeeks = DATE_RANGE_MAX_WEEKS[dateRange]

    return all.filter((sale) => {
      if (propertyType !== 'All Types' && sale.propertyType !== propertyType) return false
      const weeksAgo = parseWeeksAgo(sale.soldAgo)
      if (weeksAgo !== null && weeksAgo > maxWeeks) return false
      return true
    })
  }, [sales, dateRange, propertyType])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = addressInput.trim()
    if (!trimmed) return
    setAppraisalInputContext({ address: trimmed })
    setSearchedAddress(trimmed)
  }

  return (
    <div className="flex flex-col">
      <header className="font-sans px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">{copy.pageTitle}</h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">{copy.pageSubtitle}</p>
      </header>

      <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
            <input
              value={addressInput}
              onChange={(event) => setAddressInput(event.target.value)}
              placeholder={copy.searchPlaceholder}
              className="min-w-0 flex-1 rounded-full border border-black/5 bg-white px-5 py-3 text-sm text-relaive-navy shadow-[0_2px_12px_rgba(26,32,44,0.08)] placeholder:text-relaive-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
            />
            <Button type="submit" variant="primary" size="md" disabled={!addressInput.trim()}>
              Search
            </Button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-black/5 pt-3">
            <div className="flex items-center gap-1.5 text-xs text-relaive-gray">
              <CalendarIcon />
              <span>Date Range</span>
            </div>
            <select
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value as (typeof DATE_RANGE_OPTIONS)[number])}
              className="cursor-pointer rounded-lg border border-black/5 bg-black/5 px-3 py-1.5 text-xs text-relaive-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
            >
              {DATE_RANGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <div className="ml-2 flex items-center gap-1.5 text-xs text-relaive-gray">
              <HomeIcon />
              <span>Property Type</span>
            </div>
            <select
              value={propertyType}
              onChange={(event) => setPropertyType(event.target.value as (typeof PROPERTY_TYPE_OPTIONS)[number])}
              className="cursor-pointer rounded-lg border border-black/5 bg-black/5 px-3 py-1.5 text-xs text-relaive-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
            >
              {PROPERTY_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!searchedAddress ? (
          <div className="rounded-2xl border border-black/5 bg-white py-12 text-center">
            <p className="text-sm font-medium text-relaive-navy">{copy.emptyStateTitle}</p>
            <p className="mt-1 text-sm text-relaive-gray">{copy.emptyStateSubtitle}</p>
          </div>
        ) : isLoading ? (
          <div className="rounded-2xl border border-black/5 bg-white py-12 text-center text-sm text-relaive-gray">
            {copy.loadingLabel}
          </div>
        ) : (
          <>
            <SubjectPropertyCard address={searchedAddress} copy={copy} />
            <div>
              <h3 className="mb-4 text-base font-semibold text-relaive-navy">{copy.resultsHeading}</h3>
              <ComparableSalesView sales={filteredSales} variant="full" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
