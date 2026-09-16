import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { findNearbyAmenities, PlacesError } from '../services/places.service.js'
import { nearbyPlacesQuerySchema } from '../validators/places.validator.js'
import { formatZodError } from '../utils/zod-error.js'

export async function getNearbyPlaces(req: Request, res: Response) {
  try {
    const { lat, lng, radiusMeters } = nearbyPlacesQuerySchema.parse(req.query)
    const amenities = await findNearbyAmenities(lat, lng, radiusMeters)
    res.json({ amenities })
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) })
      return
    }
    if (err instanceof PlacesError) {
      res.status(err.status).json({ error: err.message })
      return
    }
    throw err
  }
}
