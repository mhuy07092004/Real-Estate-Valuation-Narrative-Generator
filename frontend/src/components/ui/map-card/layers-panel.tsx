import type { AmenityCategory } from '../../../services/places'
import { CATEGORY_COLOR, CATEGORY_LABEL } from './amenity-markers'

// The five amenity categories this panel exposes a toggle for. 'park' and
// 'other' (services/places.ts has both) aren't mentioned anywhere in this
// panel, so they're left alone and always render, same as before this panel
// existed — only these five are ever hidden/shown here. Labels and colors
// come from amenity-markers.tsx (CATEGORY_LABEL/CATEGORY_COLOR) rather than
// being redefined here, so this panel can never drift out of sync with what
// the map markers actually look like.
export const TOGGLEABLE_CATEGORIES = ['transit', 'school', 'healthcare', 'dining', 'grocery'] as const satisfies readonly AmenityCategory[]
export type ToggleableCategory = (typeof TOGGLEABLE_CATEGORIES)[number]

export type LayerVisibility = Record<ToggleableCategory, boolean>

export const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  transit: true,
  school: true,
  healthcare: true,
  dining: true,
  grocery: true,
}

const MIN_RADIUS_METERS = 0
const MAX_RADIUS_METERS = 5000
const RADIUS_STEP_METERS = 500

function formatKm(meters: number): string {
  const km = meters / 1000
  // Whole numbers show as "5 km", halves as "0.5 km" — no trailing zeros.
  return `${Number.isInteger(km) ? km : km.toFixed(1)} km`
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12C2.5 12 5.75 5.5 12 5.5C18.25 5.5 21.5 12 21.5 12C21.5 12 18.25 18.5 12 18.5C5.75 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12C2.5 12 5.75 5.5 12 5.5C18.25 5.5 21.5 12 21.5 12C21.5 12 18.25 18.5 12 18.5C5.75 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 4L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function TransportIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="4" width="14" height="12" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 11H19" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8.5" cy="19" r="1.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="15.5" cy="19" r="1.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 19H6.5M17 19H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function SchoolIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4L21 8.5L12 13L3 8.5L12 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 10.5V15C7 15 9 17 12 17C15 17 17 15 17 15V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M21 8.5V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function HospitalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="6" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 6L12 2L20 6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 9.5V15.5M9 12.5H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function DiningIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 2.5V11M4 2.5V8C4 9.10457 4.89543 10 6 10V10M8 2.5V8C8 9.10457 7.10457 10 6 10V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 2.5C15.3431 2.5 14 4.567 14 7.5C14 9.933 14.9153 11.982 16.1667 12.584L16 21.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10V21.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function GroceryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 7H21L19.5 19.5C19.4 20.4 18.6 21 17.7 21H6.3C5.4 21 4.6 20.4 4.5 19.5L3 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 7V5.5C8 3.567 9.79086 2 12 2C14.2091 2 16 3.567 16 5.5V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

const LAYER_ICON = {
  transit: TransportIcon,
  school: SchoolIcon,
  healthcare: HospitalIcon,
  dining: DiningIcon,
  grocery: GroceryIcon,
} satisfies Record<ToggleableCategory, () => ReturnType<typeof TransportIcon>>

type LayersPanelProps = {
  radiusMeters: number
  onRadiusChange: (meters: number) => void
  layerVisibility: LayerVisibility
  onToggleLayer: (category: ToggleableCategory) => void
  onClose: () => void
}

/**
 * Left-side panel opened via the 5th map control button (see MapControls in
 * map-card.tsx) once a search has placed a marker. Controls the amenity
 * search radius and which amenity categories render as markers — both
 * plumbed through as plain state in MapCard, this component has no state
 * or fetching of its own.
 */
export function LayersPanel({ radiusMeters, onRadiusChange, layerVisibility, onToggleLayer, onClose }: LayersPanelProps) {
  return (
    <div className="absolute inset-y-0 left-0 z-20 flex w-64 flex-col gap-4 overflow-y-auto rounded-l-3xl border-r border-black/5 bg-white p-5 shadow-[0_4px_24px_rgba(26,32,44,0.08)]">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-relaive-navy">Map Layers</h3>
        <button
          type="button"
          aria-label="Close layers panel"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full text-relaive-gray transition-colors hover:bg-slate-100 hover:text-relaive-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="rounded-2xl bg-relaive-navy/[0.04] px-4 py-3.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-relaive-navy">Search Radius</span>
          <span className="text-xs font-medium text-relaive-navy">{formatKm(radiusMeters)}</span>
        </div>
        <input
          type="range"
          aria-label="Search radius in kilometres"
          min={MIN_RADIUS_METERS}
          max={MAX_RADIUS_METERS}
          step={RADIUS_STEP_METERS}
          value={radiusMeters}
          onChange={(event) => onRadiusChange(Number(event.target.value))}
          className="mt-3 w-full accent-relaive-primary"
        />
      </div>

      <div className="flex flex-col gap-2.5">
        {TOGGLEABLE_CATEGORIES.map((category) => {
          const isVisible = layerVisibility[category]
          const Icon = LAYER_ICON[category]
          return (
            <button
              key={category}
              type="button"
              onClick={() => onToggleLayer(category)}
              aria-pressed={isVisible}
              className={`flex items-center justify-between rounded-2xl border px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary ${
                isVisible
                  ? 'border-relaive-primary/20 bg-relaive-primary/10'
                  : 'border-black/5 bg-[#FBFBFB] hover:bg-slate-50'
              }`}
            >
              <span
                className={`flex items-center gap-2.5 text-sm ${
                  isVisible ? 'font-medium text-relaive-navy' : 'text-relaive-navy/60'
                }`}
              >
                {/* Same color used for this category's dots on the map — the whole
                    point of pulling from CATEGORY_COLOR instead of a separate palette
                    here is that this swatch can never mismatch the markers. */}
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLOR[category] }}
                />
                <Icon />
                {CATEGORY_LABEL[category]}
              </span>
              <span className={isVisible ? 'text-relaive-primary' : 'text-relaive-gray'}>
                {isVisible ? <EyeIcon /> : <EyeOffIcon />}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
