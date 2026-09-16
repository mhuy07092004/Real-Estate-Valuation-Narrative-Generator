import { Router } from 'express'
import { getGeocode } from '../controllers/geocode.controller.js'

export const geocodeRouter = Router()

// GET /api/geocode?address=...
geocodeRouter.get('/', getGeocode)
