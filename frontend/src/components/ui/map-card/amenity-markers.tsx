import { useEffect, useState } from 'react'
import { Marker } from '@vis.gl/react-google-maps'
import { getNearbyAmenities, type Amenity, type AmenityCategory } from '../../../services/places'

export const CATEGORY_COLOR: Record<AmenityCategory, string> = {
  school: '#2563eb',
  grocery: '#16a34a',
  park: '#65a30d',
  transit: '#7c3aed',
  healthcare: '#dc2626',
  dining: '#ea580c',
  other: '#64748b',
}

export const CATEGORY_LABEL: Record<AmenityCategory, string> = {
  school: 'Schools',
  grocery: 'Groceries',
  park: 'Parks',
  transit: 'Transit',
  healthcare: 'Healthcare',
  dining: 'Dining',
  other: 'Other',
}

type AmenityMarkersProps = {
  center: google.maps.LatLngLiteral
  radiusMeters: number
  /** Lets the parent (outside <Map>) keep a legend / count in sync. */
  onAmenitiesChange?: (amenities: Amenity[]) => void
}

/** Fetches amenities around `center` and renders one colored dot marker per result. */
export function AmenityMarkers({ center, radiusMeters, onAmenitiesChange }: AmenityMarkersProps) {
  const [amenities, setAmenities] = useState<Amenity[]>([])

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

    return () => {
      cancelled = true
    }
    // onAmenitiesChange intentionally excluded: only re-fetch when the location/radius actually changes, not on every parent re-render*/
  }, [center.lat, center.lng, radiusMeters])

  return (
    <>
      {amenities.map((amenity) => (
        <Marker
          key={amenity.id}
          position={{ lat: amenity.lat, lng: amenity.lng }}
          title={`${amenity.name} (${CATEGORY_LABEL[amenity.category]})`}
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
    </>
  )
}
