import { Router } from 'express'
import { getNearbyPlaces } from '../controllers/places.controller.js'

export const placesRouter = Router()

// GET /api/places/nearby?lat=&lng=&radiusMeters=
placesRouter.get('/nearby', getNearbyPlaces)
