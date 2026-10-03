import { Router } from 'express'
import { getNearbyPlaces } from '../controllers/places.controller.js'
import { getAddressSuggestions } from '../controllers/autocomplete.controller.js'

export const placesRouter = Router()

// GET /api/places/nearby?lat=&lng=&radiusMeters=
placesRouter.get('/nearby', getNearbyPlaces)
// GET /api/places/autocomplete?input=&sessionToken=
placesRouter.get('/autocomplete', getAddressSuggestions)
