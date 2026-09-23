import { useEffect, useState } from 'react'
import { InfoWindow, Marker } from '@vis.gl/react-google-maps'
import { getNearbyAmenities, type Amenity, type AmenityCategory } from '../../../services/places'

// Single source of truth for both the map markers and the Map Layers panel's
// toggle rows (layers-panel.tsx imports these directly) — they used to keep
// separate color/label choices and drifted out of sync with each other.
export const CATEGORY_COLOR: Record<AmenityCategory, string> = {
  school: '#16a34a', // Education — green
  grocery: '#2563eb', // Grocery — blue
  park: '#7c3aed', // purple — was going to be teal, but that read as "another green" next to Education; not user-facing (no toggle)
  transit: '#6b7280', // Transport — gray
  healthcare: '#dc2626', // Healthcare — red
  dining: '#ea580c', // Dining — orange
  other: '#64748b',
}

export const CATEGORY_LABEL: Record<AmenityCategory, string> = {
  school: 'Education',
  grocery: 'Grocery',
  park: 'Parks',
  transit: 'Transport',
  healthcare: 'Healthcare',
  dining: 'Dining',
  other: 'Other',
}

type AmenityMarkersProps = {
  center: google.maps.LatLngLiteral
  radiusMeters: number
  /**
   * Restricts which categories render as markers on the map — used by the
   * Map Layers panel's toggles. Omit to render every fetched category
   * (unchanged default behaviour for any other caller).
   */
  visibleCategories?: Set<AmenityCategory>
  /**
   * Lets the parent (outside <Map>) keep a legend / count in sync. Always
   * receives the full fetched list, not filtered by `visibleCategories` —
   * the parent decides what to do with categories that are toggled off.
   */
  onAmenitiesChange?: (amenities: Amenity[]) => void
}

/** Fetches amenities around `center` and renders one colored dot marker per result. */
export function AmenityMarkers({ center, radiusMeters, visibleCategories, onAmenitiesChange }: AmenityMarkersProps) {
  const [amenities, setAmenities] = useState<Amenity[]>([])
  // Which marker's InfoWindow is open — the dots looked clickable (round,
  // colored, cursor: pointer by default) but had no onClick at all before
  // this, so clicking one did nothing. `title` alone only ever gave a
  // native hover tooltip, which is easy to miss and doesn't work on touch.
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null)

  useEffect(() => {
    let cancelled = false

    getNearbyAmenities(center.lat, center.lng, radiusMeters)
      .then((results) => {
        if (cancelled) return
        setAmenities(results)
        onAmenitiesChange?.(results)
      })
      .catch(() => {
        // Secondary feature — fail quietly rather than blocking the map/search.
        if (cancelled) return
        setAmenities([])
        onAmenitiesChange?.([])
      })
    // A new search/radius means the old marker set (and whatever InfoWindow
    // was open on it) no longer applies.
    setSelectedAmenity(null)

    return () => {
      cancelled = true
    }
    // onAmenitiesChange intentionally excluded: only re-fetch when the location/radius actually changes, not on every parent re-render*/
  }, [center.lat, center.lng, radiusMeters])

  const visibleAmenities = visibleCategories
    ? amenities.filter((amenity) => visibleCategories.has(amenity.category))
    : amenities

  // Close the InfoWindow if its category gets toggled off in the Map Layers
  // panel while it's open, rather than leaving it floating over a hidden dot.
  const openAmenity = selectedAmenity && visibleAmenities.some((a) => a.id === selectedAmenity.id) ? selectedAmenity : null

  return (
    <>
      {visibleAmenities.map((amenity) => (
        <Marker
          key={amenity.id}
          position={{ lat: amenity.lat, lng: amenity.lng }}
          title={`${amenity.name} (${CATEGORY_LABEL[amenity.category]})`}
          onClick={() => setSelectedAmenity(amenity)}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: CATEGORY_COLOR[amenity.category],
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 1.5,
          }}
        />
      ))}
      {openAmenity && (
        <InfoWindow
          position={{ lat: openAmenity.lat, lng: openAmenity.lng }}
          onCloseClick={() => setSelectedAmenity(null)}
        >
          <div className="min-w-[160px] px-1 py-0.5">
            <p className="text-sm font-medium text-relaive-navy">{openAmenity.name}</p>
            <p className="text-xs text-relaive-gray">
              {CATEGORY_LABEL[openAmenity.category]}
              {typeof openAmenity.rating === 'number' ? ` · ★ ${openAmenity.rating.toFixed(1)}` : ''}
            </p>
          </div>
        </InfoWindow>
      )}
    </>
  )
}
