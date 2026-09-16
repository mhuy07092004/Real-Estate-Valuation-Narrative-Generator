import { useEffect, useRef } from 'react'
import { useMap } from '@vis.gl/react-google-maps'

type RadiusCircleProps = {
  center: google.maps.LatLngLiteral
  radiusMeters: number
}

/**
 * @vis.gl/react-google-maps doesn't ship a <Circle> component in its core
 * package (only Map / Marker / AdvancedMarker / InfoWindow) — so this wraps
 * google.maps.Circle by hand, the same imperative useMap() pattern
 * MapControls above already uses.
 */
export function RadiusCircle({ center, radiusMeters }: RadiusCircleProps) {
  const map = useMap()
  const circleRef = useRef<google.maps.Circle | null>(null)

  // Create once per map instance.
  useEffect(() => {
    if (!map) return

    const circle = new google.maps.Circle({
      map,
      center,
      radius: radiusMeters,
      fillColor: '#2563eb',
      fillOpacity: 0.06,
      strokeColor: '#2563eb',
      strokeOpacity: 0.4,
      strokeWeight: 1.5,
      clickable: false,
    })
    circleRef.current = circle

    return () => circle.setMap(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  // Keep it in sync without tearing the overlay down/up.
  useEffect(() => {
    circleRef.current?.setCenter(center)
    circleRef.current?.setRadius(radiusMeters)
  }, [center, radiusMeters])

  return null
}
