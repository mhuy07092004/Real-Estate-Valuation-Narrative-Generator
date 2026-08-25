import { useCallback, useRef, useState } from 'react'
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps'
import { AddressSearch } from '../search-bar/address-search'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

// Sydney CBD — reasonable default center for an AU property platform.
const DEFAULT_CENTER = { lat: -33.8688, lng: 151.2093 }
const DEFAULT_ZOOM = 12

function ZoomInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M11 8V14M8 11H14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function ZoomOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M8 11H14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function ExpandIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 4H4V9M15 4H20V9M9 20H4V15M15 20H20V15"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ResetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12A8 8 0 0 1 19.5 8.5M20 12A8 8 0 0 1 4.5 15.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path
        d="M19.5 4.5V8.5H15.5M4.5 19.5V15.5H8.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Lives inside <Map> so it can use the useMap() hook to control zoom/
 * center directly. Kept separate from MapCard so that hook call is
 * always inside the map's context.
 */
function MapControls({
  isExpanded,
  onToggleExpand,
}: {
  isExpanded: boolean
  onToggleExpand: () => void
}) {
  const map = useMap()

  const zoomBy = useCallback(
    (delta: number) => {
      if (!map) return
      const current = map.getZoom() ?? DEFAULT_ZOOM
      map.setZoom(current + delta)
    },
    [map],
  )

  const reset = useCallback(() => {
    if (!map) return
    map.setCenter(DEFAULT_CENTER)
    map.setZoom(DEFAULT_ZOOM)
  }, [map])

  const controls = [
    { label: 'Zoom in', icon: <ZoomInIcon />, onClick: () => zoomBy(1) },
    { label: 'Zoom out', icon: <ZoomOutIcon />, onClick: () => zoomBy(-1) },
    { label: isExpanded ? 'Collapse map' : 'Expand map', icon: <ExpandIcon />, onClick: onToggleExpand },
    { label: 'Reset map', icon: <ResetIcon />, onClick: reset },
  ] as const

  return (
    <div className="absolute right-5 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2.5">
      {controls.map(({ label, icon, onClick }) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          onClick={onClick}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-relaive-navy shadow-[0_2px_10px_rgba(26,32,44,0.08)] transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
        >
          {icon}
        </button>
      ))}
    </div>
  )
}

/** Geocodes the typed address and recenters the map — lives inside <Map> for map access. */
function AddressSearchBar({ onLocate }: { onLocate: (pos: google.maps.LatLngLiteral, formatted: string) => void }) {
  const map = useMap()
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(
    async (value: string) => {
      setError(null)
      if (!value.trim() || !GOOGLE_MAPS_API_KEY) return

      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(value)}&key=${GOOGLE_MAPS_API_KEY}`,
        )
        const data = await res.json()
        const result = data.results?.[0]
        if (!result) {
          setError('Address not found')
          return
        }
        const pos = result.geometry.location as google.maps.LatLngLiteral
        map?.panTo(pos)
        map?.setZoom(16)
        onLocate(pos, result.formatted_address)
      } catch {
        setError('Could not search that address right now')
      }
    },
    [map, onLocate],
  )

  return (
    <div className="absolute inset-x-0 top-0 z-10 flex flex-col items-center gap-1 px-6 pt-6">
      <AddressSearch value={query} onChange={setQuery} onSearch={handleSearch} />
      {error && <span className="rounded-full bg-white px-3 py-1 text-xs text-red-600 shadow-sm">{error}</span>}
    </div>
  )
}

export function MapCard() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [marker, setMarker] = useState<google.maps.LatLngLiteral | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  if (!GOOGLE_MAPS_API_KEY) {
    // No key configured yet — keep the original placeholder so the app
    // still renders cleanly for anyone without VITE_GOOGLE_MAPS_API_KEY set.
    return (
      <div
        className="relative flex aspect-[16/9] min-h-[420px] w-full items-center justify-center overflow-hidden rounded-3xl bg-slate-100 text-sm text-relaive-gray shadow-[0_4px_24px_rgba(26,32,44,0.06)]"
        aria-label="Property intelligence map placeholder"
      >
        Map unavailable — set VITE_GOOGLE_MAPS_API_KEY in frontend/.env to enable it.
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={
        isExpanded
          ? 'fixed inset-4 z-50 overflow-hidden rounded-3xl shadow-2xl'
          : 'relative aspect-[16/9] min-h-[420px] w-full overflow-hidden rounded-3xl shadow-[0_4px_24px_rgba(26,32,44,0.06)]'
      }
    >
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <Map
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={DEFAULT_ZOOM}
          gestureHandling="greedy"
          disableDefaultUI
          className="h-full w-full"
        >
          {marker && <Marker position={marker} />}
          <AddressSearchBar onLocate={(pos) => setMarker(pos)} />
          <MapControls isExpanded={isExpanded} onToggleExpand={() => setIsExpanded((v) => !v)} />
        </Map>
      </APIProvider>
    </div>
  )
}
