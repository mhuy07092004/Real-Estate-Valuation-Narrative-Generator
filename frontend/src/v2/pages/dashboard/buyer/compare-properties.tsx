import { useEffect, useMemo, useState } from 'react'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { listSavedProperties, type SavedPropertyRow } from '../../../services/saved-properties'

// Net-new v2 page — figma: ComparePropertiesPage.tsx (side-by-side table of up to 4 saved
// properties, with price/fairness/commute/school/yield rows and a fabricated "AI Buyer
// Summary" paragraph).
//
// The real /api/saved-properties (SavedPropertySearch model) rows only carry
// addressLine/suburb/state/postcode/propertyType/bedrooms/bathrooms/landSizeSqm/createdAt —
// no price, estimated range, fairness, commute time, school distance, rental yield, or
// buyer-demand fields exist anywhere in this repo for a saved property. So this page compares
// only the real fields on SavedPropertyRow, and the prototype's price/fairness/commute/etc.
// rows plus its fabricated AI summary paragraph are NOT ported — logged as a gap in
// backend/V2_BACKEND_TODO.md rather than invented here.

const MAX_COMPARE = 3

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function buildFullAddress(property: SavedPropertyRow): string {
  return `${property.suburb} ${property.state} ${property.postcode}`
}

export function ComparePropertiesPageV2() {
  const { data: fetchedProperties } = useAsyncData(listSavedProperties, [])
  const [properties, setProperties] = useState<SavedPropertyRow[] | null>(null)
  const [comparingIds, setComparingIds] = useState<string[]>([])

  useEffect(() => {
    if (fetchedProperties) {
      setProperties(fetchedProperties)
      setComparingIds(fetchedProperties.slice(0, 2).map((p) => p.savedPropertyId))
    }
  }, [fetchedProperties])

  const comparing = useMemo(
    () => (properties ?? []).filter((p) => comparingIds.includes(p.savedPropertyId)),
    [properties, comparingIds],
  )
  const available = useMemo(
    () => (properties ?? []).filter((p) => !comparingIds.includes(p.savedPropertyId)),
    [properties, comparingIds],
  )

  function addToCompare(id: string) {
    setComparingIds((prev) => (prev.includes(id) || prev.length >= MAX_COMPARE ? prev : [...prev, id]))
  }

  function removeFromCompare(id: string) {
    setComparingIds((prev) => prev.filter((c) => c !== id))
  }

  const rows: { label: string; render: (p: SavedPropertyRow) => string }[] = [
    { label: 'Property Type', render: (p) => p.propertyType },
    { label: 'Bedrooms', render: (p) => String(p.bedrooms) },
    { label: 'Bathrooms', render: (p) => String(p.bathrooms) },
    { label: 'Land Size', render: (p) => `${p.landSizeSqm}m²` },
    { label: 'Suburb', render: (p) => buildFullAddress(p) },
    { label: 'Saved', render: (p) => new Date(p.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) },
  ]

  if (!properties) {
    return <div className="p-6 text-sm text-relaive-gray sm:p-8">Loading saved properties…</div>
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header className="font-sans">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">Compare Properties</h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">Compare up to {MAX_COMPARE} saved properties side by side</p>
      </header>

      {properties.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-white py-16 text-center">
          <p className="text-sm font-medium text-relaive-navy">No saved properties yet</p>
          <p className="mt-1 text-sm text-relaive-gray">Save properties from Comparable Sales to compare them here.</p>
        </div>
      ) : (
        <>
          {available.length > 0 && comparing.length < MAX_COMPARE ? (
            <div className="flex flex-wrap items-center gap-3">
              {available.map((p) => (
                <button
                  key={p.savedPropertyId}
                  type="button"
                  onClick={() => addToCompare(p.savedPropertyId)}
                  className="flex items-center gap-2 rounded-xl border border-dashed border-relaive-primary/30 bg-white px-3.5 py-2 text-sm text-relaive-primary transition-colors hover:border-relaive-primary/60 hover:bg-relaive-primary/5"
                >
                  <PlusIcon />
                  {p.addressLine}
                </button>
              ))}
            </div>
          ) : null}

          {comparing.length === 0 ? (
            <div className="rounded-2xl border border-black/5 bg-white py-16 text-center">
              <p className="text-sm font-medium text-relaive-navy">Pick properties above to compare</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full" style={{ minWidth: comparing.length * 200 + 160 }}>
                  <thead>
                    <tr className="border-b border-[#EEF3F7]">
                      <th className="w-40 bg-[#EEF3F7]/40 px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-wider text-relaive-gray">
                        Property
                      </th>
                      {comparing.map((p) => (
                        <th key={p.savedPropertyId} className="px-4 py-3 text-center">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => removeFromCompare(p.savedPropertyId)}
                              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#EEF3F7] transition-colors hover:bg-red-100"
                            >
                              <span className="text-relaive-navy/40 hover:text-red-500">
                                <XIcon />
                              </span>
                            </button>
                            <div className="mb-2 flex h-20 w-full items-center justify-center rounded-xl bg-relaive-primary/10 text-relaive-primary">
                              <HomeIcon />
                            </div>
                            <p className="text-xs font-semibold text-relaive-navy">{p.addressLine}</p>
                            <p className="text-[10px] text-relaive-primary">
                              {p.suburb} {p.state} {p.postcode}
                            </p>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF3F7]">
                    {rows.map((row) => (
                      <tr key={row.label} className="transition-colors hover:bg-[#EEF3F7]/20">
                        <td className="bg-[#EEF3F7]/20 px-5 py-3.5 text-sm font-medium text-relaive-gray">{row.label}</td>
                        {comparing.map((p) => (
                          <td key={p.savedPropertyId} className="px-4 py-3.5 text-center text-sm font-medium text-relaive-navy">
                            {row.render(p)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
