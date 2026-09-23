import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps'
import { AddressSearch } from '../search-bar/address-search'
import { geocodeAddress } from '../../../services/geocode'
import { getAddressSuggestions, type AddressSuggestion } from '../../../services/autocomplete'
import type { AmenityCategory } from '../../../services/places'
import { RadiusCircle } from './radius-circle'
import { AmenityMarkers } from './amenity-markers'
import {
  DEFAULT_LAYER_VISIBILITY,
  LayersPanel,
  TOGGLEABLE_CATEGORIES,
  type LayerVisibility,
  type ToggleableCategory,
} from './layers-panel'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

//*default map loc being sydney cbd*/
const DEFAULT_CENTER = { lat: -33.8688, lng: 151.2093 }
const DEFAULT_ZOOM = 12
// Starting radius before the user touches the Map Layers slider — matches
// the old fixed AMENITY_RADIUS_METERS constant this replaces.
const DEFAULT_RADIUS_METERS = 5000
// Address-suggestion tuning: don't fire on 1-2 characters (mostly noise,
// wastes calls), and debounce so a fast typist doesn't fire one request per
// keystroke.
const SUGGESTION_MIN_LENGTH = 3
const SUGGESTION_DEBOUNCE_MS = 300
// Every amenity category the backend can return (services/places.ts). Used
// to build the "which markers should render" set: everything minus whatever
// TOGGLEABLE_CATEGORIES the layers panel has turned off.
const ALL_AMENITY_CATEGORIES: AmenityCategory[] = [
  'school',
  'grocery',
  'park',
  'transit',
  'healthcare',
  'dining',
  'other',
]

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

/** Opens/closes the Map Layers panel — only shown once a search has placed a marker. */
function LayersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3L21 8L12 13L3 8L12 3Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M3 12L12 17L21 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 16L12 21L21 16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
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
  showLayersButton,
  isLayersPanelOpen,
  onToggleLayersPanel,
}: {
  isExpanded: boolean
  onToggleExpand: () => void
  /** Only true once a search has placed a marker — matches the Figma spec's "5th button appears after search". */
  showLayersButton: boolean
  isLayersPanelOpen: boolean
  onToggleLayersPanel: () => void
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
      {showLayersButton && (
        <button
          type="button"
          aria-label={isLayersPanelOpen ? 'Hide map layers' : 'Show map layers'}
          aria-pressed={isLayersPanelOpen}
          onClick={onToggleLayersPanel}
          className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-[0_2px_10px_rgba(26,32,44,0.08)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary ${
            isLayersPanelOpen
              ? 'bg-relaive-primary text-white hover:bg-relaive-primary-hover'
              : 'bg-white text-relaive-navy hover:bg-slate-50'
          }`}
        >
          <LayersIcon />
        </button>
      )}
    </div>
  )
}

/**
 * Geocodes the typed (or picked) address and recenters the map — lives
 * inside <Map> for map access. Also drives the address-suggestion dropdown:
 * suggestions come from /api/places/autocomplete (autocomplete.ts),
 * debounced as the user types, and picking one re-runs the exact same
 * geocode path as typing + hitting Enter, just with clean Google-provided
 * text instead of whatever the user typed — the actual point of adding
 * this, since a typo'd address is what used to come back as "not found".
 */
function AddressSearchBar({
  onLocate,
  panelOpen,
}: {
  onLocate: (pos: google.maps.LatLngLiteral, formatted: string) => void
  /** Shifts the bar right so it stays centered in the space next to the open Map Layers panel. */
  panelOpen: boolean
}) {
  const map = useMap()
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  // One id per "typing session" (Google's term) — first keystroke through
  // picking a result or searching directly. Kept in a ref, not state: it
  // never drives a render, it's just a value threaded through to the API.
  const sessionTokenRef = useRef<string | null>(null)

  const getSessionToken = useCallback(() => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = crypto.randomUUID()
    }
    return sessionTokenRef.current
  }, [])

  const endSession = useCallback(() => {
    sessionTokenRef.current = null
  }, [])

  // Debounced suggestions fetch as the user types.
  useEffect(() => {
    if (query.trim().length < SUGGESTION_MIN_LENGTH) {
      setSuggestions([])
      setIsSuggestionsOpen(false)
      return
    }

    let cancelled = false
    const timer = setTimeout(() => {
      getAddressSuggestions(query, getSessionToken())
        .then((results) => {
          if (cancelled) return
          setSuggestions(results)
          setIsSuggestionsOpen(results.length > 0)
          setHighlightedIndex(-1)
        })
        .catch(() => {
          // Secondary feature — fail quietly. The user can still hit Enter
          // and search the raw typed text exactly as before this existed.
          if (cancelled) return
          setSuggestions([])
          setIsSuggestionsOpen(false)
        })
    }, SUGGESTION_DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, getSessionToken])

  const runSearch = useCallback(
    async (value: string) => {
      setError(null)
      if (!value.trim()) return

      try {
        //routed through our backend*/
        const result = await geocodeAddress(value)
        const pos: google.maps.LatLngLiteral = { lat: result.lat, lng: result.lng }
        map?.panTo(pos)
        map?.setZoom(16)
        onLocate(pos, result.formattedAddress)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not search that address right now')
      }
    },
    [map, onLocate],
  )

  const closeSuggestions = useCallback(() => {
    setSuggestions([])
    setIsSuggestionsOpen(false)
    setHighlightedIndex(-1)
  }, [])

  const handleSearch = useCallback(
    (value: string) => {
      closeSuggestions()
      endSession()
      void runSearch(value)
    },
    [closeSuggestions, endSession, runSearch],
  )

  const selectSuggestion = useCallback(
    (suggestion: AddressSuggestion) => {
      setQuery(suggestion.description)
      closeSuggestions()
      endSession()
      void runSearch(suggestion.description)
    },
    [closeSuggestions, endSession, runSearch],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!isSuggestionsOpen || suggestions.length === 0) {
        if (event.key === 'Enter') handleSearch(query)
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setHighlightedIndex((i) => (i + 1) % suggestions.length)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setHighlightedIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
      } else if (event.key === 'Enter') {
        event.preventDefault()
        if (highlightedIndex >= 0) {
          selectSuggestion(suggestions[highlightedIndex])
        } else {
          handleSearch(query)
        }
      } else if (event.key === 'Escape') {
        closeSuggestions()
      }
    },
    [isSuggestionsOpen, suggestions, highlightedIndex, query, handleSearch, selectSuggestion, closeSuggestions],
  )

  return (
    <div
      className={`absolute top-0 z-10 flex flex-col items-center gap-1 px-6 pt-6 transition-[left] ${
        panelOpen ? 'left-64 right-0' : 'inset-x-0'
      }`}
    >
      <div
        className="relative w-full max-w-md"
        // Closes the dropdown once focus truly leaves this wrapper (input or
        // any suggestion button) — not on every blur, since clicking a
        // suggestion blurs the input first.
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            closeSuggestions()
          }
        }}
      >
        <AddressSearch
          value={query}
          onChange={(value) => {
            setQuery(value)
            setIsSuggestionsOpen(true)
          }}
          onSearch={handleSearch}
          onKeyDown={handleKeyDown}
        />
        {isSuggestionsOpen && suggestions.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-20 mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-black/5 bg-white py-1.5 shadow-[0_4px_24px_rgba(26,32,44,0.12)]">
            {suggestions.map((suggestion, index) => (
              <li key={suggestion.placeId}>
                <button
                  type="button"
                  // Keeps the input focused through the click so this fires
                  // before the wrapper's onBlur would otherwise close the list.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectSuggestion(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`flex w-full flex-col items-start gap-0.5 px-4 py-2 text-left transition-colors ${
                    index === highlightedIndex ? 'bg-relaive-primary/10' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm text-relaive-navy">{suggestion.mainText}</span>
                  {suggestion.secondaryText && (
                    <span className="text-xs text-relaive-gray">{suggestion.secondaryText}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <span className="rounded-full bg-white px-3 py-1 text-xs text-red-600 shadow-sm">{error}</span>}
    </div>
  )
}

export function MapCard() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [marker, setMarker] = useState<google.maps.LatLngLiteral | null>(null)
  const [radiusMeters, setRadiusMeters] = useState(DEFAULT_RADIUS_METERS)
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>(DEFAULT_LAYER_VISIBILITY)
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Every category except the ones a toggle has explicitly turned off.
  // Categories the panel never mentions (park, other) always stay in this
  // set, matching how the map behaved before this panel existed — the panel
  // only ever removes Transport/Education/Healthcare/Dining/Grocery.
  // Doubles as the map's only amenity legend now — the old bottom-left
  // AmenityLegend was removed because it kept its own color choices and
  // drifted out of sync with this panel's; the toggle rows (which pull
  // colors from the same CATEGORY_COLOR as the markers) are the legend now.
  const visibleCategories = useMemo(() => {
    const hidden = new Set(
      TOGGLEABLE_CATEGORIES.filter((category: ToggleableCategory) => !layerVisibility[category]),
    )
    return new Set(ALL_AMENITY_CATEGORIES.filter((category) => !hidden.has(category as ToggleableCategory)))
  }, [layerVisibility])

  const toggleLayer = useCallback((category: ToggleableCategory) => {
    setLayerVisibility((prev) => ({ ...prev, [category]: !prev[category] }))
  }, [])

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
          {marker && (
            <>
              <RadiusCircle center={marker} radiusMeters={radiusMeters} />
              <AmenityMarkers center={marker} radiusMeters={radiusMeters} visibleCategories={visibleCategories} />
            </>
          )}
          <AddressSearchBar
            panelOpen={isLayersPanelOpen && Boolean(marker)}
            onLocate={(pos) => setMarker(pos)}
          />
          <MapControls
            isExpanded={isExpanded}
            onToggleExpand={() => setIsExpanded((v) => !v)}
            showLayersButton={Boolean(marker)}
            isLayersPanelOpen={isLayersPanelOpen}
            onToggleLayersPanel={() => setIsLayersPanelOpen((v) => !v)}
          />
        </Map>
      </APIProvider>
      {marker && isLayersPanelOpen && (
        <LayersPanel
          radiusMeters={radiusMeters}
          onRadiusChange={setRadiusMeters}
          layerVisibility={layerVisibility}
          onToggleLayer={toggleLayer}
          onClose={() => setIsLayersPanelOpen(false)}
        />
      )}
    </div>
  )
}
