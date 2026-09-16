import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { geocodeAddress, GeocodeError } from '../services/geocode.service.js'
import { geocodeQuerySchema } from '../validators/geocode.validator.js'
import { formatZodError } from '../utils/zod-error.js'

export async function getGeocode(req: Request, res: Response) {
  try {
    const { address } = geocodeQuerySchema.parse(req.query)
    const result = await geocodeAddress(address)
    res.json(result)
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) })
      return
    }
    if (err instanceof GeocodeError) {
      res.status(err.status).json({ error: err.message })
      return
    }
    throw err
  }
}
