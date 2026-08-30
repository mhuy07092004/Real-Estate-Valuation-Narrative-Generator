import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAsyncData } from '../../../../../hooks/use-async-data'
import { deleteSavedProperty, listSavedProperties, type SavedPropertyRow } from '../../../../services/saved-properties'
import { setAppraisalInputContext } from '../../../../../services/common'

// Shared Saved Properties/Evidence core (figma: SavedPropertiesPage.tsx). The prototype's
// sidebar links this same page from ALL FOUR roles (Agent/Investor/Buyer as "Saved
// Properties", Valuer as "Saved Evidence") — see Sidebar.tsx lines 38/72/103/143. The
// underlying data (/api/saved-properties, SavedPropertySearch model) is genuinely
// role-agnostic (whichever user is logged in), so this is one real, shared component with
// a thin per-role wrapper supplying copy — not four near-duplicate pages.
//
// Wired to the REAL /api/saved-properties endpoint rather than any per-role mock. "Search
// Comparables" sets the shared appraisal address context (setAppraisalInputContext, the
// same mechanism the wizard/Comparable Sales page use for prefill) and navigates to that
// role's Comparable Sales page. Delete is a real two-step-confirm wired to
// DELETE /api/saved-properties/:savedPropertyId.

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function CompareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 3v18M16 3v18M4 8l4-5 4 5M20 16l-4 5-4-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7h12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DeleteConfirmButton({ onConfirm }: { onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="px-2 py-1 text-xs text-relaive-navy/50 transition-colors hover:text-relaive-navy"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false)
            onConfirm()
          }}
          className="rounded-lg bg-red-500 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      title="Delete"
      className="rounded-lg p-2 text-relaive-navy/30 transition-all hover:bg-red-50 hover:text-red-500"
    >
      <TrashIcon />
    </button>
  )
}

function relativeTime(isoDate: string): string {
  const timestamp = new Date(isoDate).getTime()
  if (!Number.isFinite(timestamp)) return ''
  const deltaMs = Date.now() - timestamp
  const days = Math.floor(deltaMs / (24 * 60 * 60 * 1000))
  if (days < 1) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

function buildFullAddress(property: SavedPropertyRow): string {
  return `${property.addressLine}, ${property.suburb} ${property.state} ${property.postcode}`
}

export type SavedPropertiesViewProps = {
  title?: string
  compareLabel?: string
  /** Route segment to navigate to after prefilling the address context (default: comparable-sales). */
  compareRoute?: string
  emptyTitle?: string
  emptyHint?: string
}

export function SavedPropertiesView({
  title = 'Saved Properties',
  compareLabel = 'Search Comparables',
  compareRoute = 'comparable-sales',
  emptyTitle = 'No saved properties yet',
  emptyHint = 'Save a property from Comparable Sales to see it here.',
}: SavedPropertiesViewProps) {
  const { role: roleParam } = useParams<{ role: string }>()
  const role = roleParam ?? 'agent'
  const navigate = useNavigate()
  const { data: fetchedProperties } = useAsyncData(listSavedProperties, [])
  const [properties, setProperties] = useState<SavedPropertyRow[] | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (fetchedProperties) setProperties(fetchedProperties)
  }, [fetchedProperties])

  if (!properties) {
    return <div className="p-6 text-sm text-relaive-gray sm:p-8">Loading saved properties…</div>
  }

  function handleSearchComparables(property: SavedPropertyRow) {
    setAppraisalInputContext({
      address: buildFullAddress(property),
      propertyType: property.propertyType,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      landSizeSqm: property.landSizeSqm,
    })
    navigate(`/dashboard/${role}/${compareRoute}`)
  }

  async function handleDelete(property: SavedPropertyRow) {
    setDeleteError(null)
    setDeletingId(property.savedPropertyId)
    try {
      await deleteSavedProperty(property.savedPropertyId)
      setProperties((current) => (current ?? []).filter((row) => row.savedPropertyId !== property.savedPropertyId))
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete this property. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col">
      <header className="font-sans px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">{title}</h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">{properties.length} saved properties</p>
        {deleteError ? <p className="mt-2 text-xs text-red-600">{deleteError}</p> : null}
      </header>

      <div className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 lg:p-8">
        {properties.map((property) => (
          <div key={property.savedPropertyId} className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-relaive-primary/10 text-relaive-primary">
                  <HomeIcon />
                </span>
                <p className="mt-3 text-sm font-semibold text-relaive-navy">{property.addressLine}</p>
                <p className="text-xs text-relaive-gray">
                  {property.suburb} {property.state} {property.postcode}
                </p>
              </div>
              <DeleteConfirmButton onConfirm={() => handleDelete(property)} />
            </div>

            <p className="text-xs text-relaive-gray">
              {property.bedrooms} bed · {property.bathrooms} bath · {property.landSizeSqm}m² · {property.propertyType}
            </p>
            <p className="text-[10px] text-relaive-gray/70">Saved {relativeTime(property.createdAt)}</p>

            <button
              type="button"
              onClick={() => handleSearchComparables(property)}
              disabled={deletingId === property.savedPropertyId}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-relaive-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-relaive-primary-hover disabled:opacity-50"
            >
              <CompareIcon />
              {compareLabel}
            </button>
          </div>
        ))}

        {properties.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-black/5 bg-white py-16 text-center">
            <p className="text-sm font-medium text-relaive-navy">{emptyTitle}</p>
            <p className="mt-1 text-sm text-relaive-gray">{emptyHint}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
