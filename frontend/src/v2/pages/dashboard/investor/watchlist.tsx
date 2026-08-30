import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { deleteSavedProperty, listSavedProperties, type SavedPropertyRow } from '../../../services/saved-properties'
import { setAppraisalInputContext } from '../../../../services/common'
import { getInvestorNotifications } from '../../../../services/investor'
import type { InboxNotification } from '../../../../services/common'

// Net-new v2 page — figma: WatchlistPage.tsx (4 tabs: Saved Properties / Saved Suburbs /
// Saved Searches / Alerts, plus a static "AI Recommendations" banner).
//
// Data reality check (see backend/V2_BACKEND_TODO.md for the full writeup):
// - Saved Properties: REAL, backed by the same /api/saved-properties (SavedPropertySearch
//   model) endpoint Buyer's saved-properties.tsx already uses. Delete is wired to the real
//   DELETE endpoint, same as that page.
// - Alerts: REAL, reuses the existing /api/investor/notifications endpoint (same data the
//   Notifications page reads) rather than a fabricated alert feed — these note market/comp
//   events already, which is what the figma "Alerts" tab conceptually wants.
// - Saved Suburbs / Saved Searches: NO backend model exists (checked backend/prisma/schema.prisma
//   — only SavedPropertySearch; no SavedSuburb/SavedSearch table, and no frontend service
//   shaped like search history). Rather than fabricate suburb growth/yield numbers or a fake
//   search list (the figma seed data), these tabs render an honest "not available yet" panel.
// - The figma "AI Recommendations" banner (static suburb scores 92/87/84) is not backed by
//   any real recommendation engine — omitted rather than ported as fake AI output.

type WatchlistTab = 'properties' | 'suburbs' | 'searches' | 'alerts'

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

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3a5 5 0 0 0-5 5v3.2c0 .6-.2 1.2-.6 1.7L5 15.5h14l-1.4-2.6a2.7 2.7 0 0 1-.6-1.7V8a5 5 0 0 0-5-5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9.5 18a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="11" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 20 16.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
      title="Remove from watchlist"
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

function NotAvailablePanel({ title, reason }: { title: string; reason: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/10 bg-white py-14 text-center">
      <p className="text-sm font-medium text-relaive-navy">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-relaive-gray">{reason}</p>
    </div>
  )
}

export function WatchlistPageV2() {
  const navigate = useNavigate()
  const { data: fetchedProperties } = useAsyncData(listSavedProperties, [])
  const { data: notifications } = useAsyncData(getInvestorNotifications, [])
  const [properties, setProperties] = useState<SavedPropertyRow[] | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<WatchlistTab>('properties')

  useEffect(() => {
    if (fetchedProperties) setProperties(fetchedProperties)
  }, [fetchedProperties])

  function handleSearchComparables(property: SavedPropertyRow) {
    setAppraisalInputContext({
      address: buildFullAddress(property),
      propertyType: property.propertyType,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      landSizeSqm: property.landSizeSqm,
    })
    navigate('/dashboard/investor/comparable-sales')
  }

  async function handleDelete(property: SavedPropertyRow) {
    setDeleteError(null)
    setDeletingId(property.savedPropertyId)
    try {
      await deleteSavedProperty(property.savedPropertyId)
      setProperties((current) => (current ?? []).filter((row) => row.savedPropertyId !== property.savedPropertyId))
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not remove this property. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const unreadCount = (notifications ?? []).filter((n: InboxNotification) => !n.isRead).length

  const tabs: { id: WatchlistTab; label: string; count: number; icon: () => ReactNode }[] = [
    { id: 'properties', label: 'Saved Properties', count: properties?.length ?? 0, icon: HomeIcon },
    { id: 'suburbs', label: 'Saved Suburbs', count: 0, icon: MapPinIcon },
    { id: 'searches', label: 'Saved Searches', count: 0, icon: SearchIcon },
    { id: 'alerts', label: 'Alerts', count: unreadCount, icon: BellIcon },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header className="font-sans">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">Watchlist</h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">Track saved properties, suburbs, searches, and market alerts</p>
      </header>

      <div className="flex items-center gap-1 overflow-x-auto border-b border-black/5 pb-0">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px flex flex-shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-all ${
                active ? 'border-relaive-primary text-relaive-primary' : 'border-transparent text-relaive-gray hover:text-relaive-navy'
              }`}
            >
              <Icon />
              {tab.label}
              {tab.count > 0 ? (
                <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-relaive-primary/10 text-relaive-primary' : 'bg-[#EEF3F7] text-relaive-gray'}`}>
                  {tab.count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {activeTab === 'properties' ? (
        properties === null ? (
          <p className="text-sm text-relaive-gray">Loading saved properties…</p>
        ) : (
          <div className="space-y-3">
            {deleteError ? <p className="text-xs text-red-600">{deleteError}</p> : null}
            {properties.map((property) => (
              <div
                key={property.savedPropertyId}
                className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-5 sm:flex-row sm:items-center sm:gap-4"
              >
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-relaive-primary/10 text-relaive-primary">
                  <HomeIcon />
                </span>
                <div className="min-w-0 flex-grow">
                  <p className="truncate text-sm font-semibold text-relaive-navy">{property.addressLine}</p>
                  <p className="text-xs text-relaive-gray">
                    {property.suburb} {property.state} {property.postcode} · {property.bedrooms} bed · {property.bathrooms} bath ·{' '}
                    {property.landSizeSqm}m² · {property.propertyType}
                  </p>
                  <p className="mt-0.5 text-[10px] text-relaive-gray/70">Saved {relativeTime(property.createdAt)}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSearchComparables(property)}
                    disabled={deletingId === property.savedPropertyId}
                    className="flex items-center gap-2 rounded-xl bg-relaive-primary px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-relaive-primary-hover disabled:opacity-50"
                  >
                    <CompareIcon />
                    Comparables
                  </button>
                  <DeleteConfirmButton onConfirm={() => handleDelete(property)} />
                </div>
              </div>
            ))}

            {properties.length === 0 ? (
              <div className="rounded-2xl border border-black/5 bg-white py-16 text-center">
                <p className="text-sm font-medium text-relaive-navy">No saved properties yet</p>
                <p className="mt-1 text-sm text-relaive-gray">Save a property from Comparable Sales to track it here.</p>
              </div>
            ) : null}
          </div>
        )
      ) : null}

      {activeTab === 'suburbs' ? (
        <NotAvailablePanel
          title="Saved Suburbs isn't available yet"
          reason="Tracking specific suburbs on your watchlist needs a new backend model — there is currently no saved-suburb data source. See backend/V2_BACKEND_TODO.md."
        />
      ) : null}

      {activeTab === 'searches' ? (
        <NotAvailablePanel
          title="Saved Searches isn't available yet"
          reason="Re-running a saved search needs a search-history backend model — none exists yet. See backend/V2_BACKEND_TODO.md."
        />
      ) : null}

      {activeTab === 'alerts' ? (
        <div className="space-y-3">
          {(notifications ?? []).map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 rounded-2xl border p-4 transition-all ${
                !alert.isRead ? 'border-relaive-primary/15 bg-relaive-primary/5' : 'border-black/5 bg-white'
              }`}
            >
              <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${!alert.isRead ? 'bg-relaive-primary' : 'bg-black/15'}`} />
              <div className="flex-grow">
                <p className="text-sm text-relaive-navy">{alert.title}</p>
                <p className="mt-0.5 text-xs text-relaive-gray">{alert.description}</p>
                <p className="mt-1 text-xs text-relaive-gray/60">{alert.timestamp}</p>
              </div>
            </div>
          ))}
          {notifications && notifications.length === 0 ? (
            <div className="rounded-2xl border border-black/5 bg-white py-16 text-center">
              <p className="text-sm font-medium text-relaive-navy">No alerts yet</p>
            </div>
          ) : null}
          {!notifications ? <p className="text-sm text-relaive-gray">Loading alerts…</p> : null}
        </div>
      ) : null}
    </div>
  )
}
