import { z } from 'zod'

export const nearbyPlacesQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  // Defaults to 5km; capped at 50km (Google's own max for this API).
  radiusMeters: z.coerce.number().min(1).max(50000).default(5000),
})
