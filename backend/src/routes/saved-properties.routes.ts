import { Router } from 'express'
import {
  createSavedProperty,
  deleteSavedProperty,
  getSavedProperty,
  listSavedProperties,
  updateSavedProperty,
} from '../controllers/saved-properties.controller.js'
import { requireAuth } from '../middleware/require-auth.js'
import { asyncHandler } from '../middleware/async-handler.js'

export const savedPropertiesRouter = Router()

// Owner-only saved-search CRUD for backend Postman testing.
savedPropertiesRouter.use(requireAuth)
savedPropertiesRouter.get('/', asyncHandler(listSavedProperties))
savedPropertiesRouter.get('/:savedPropertyId', asyncHandler(getSavedProperty))
savedPropertiesRouter.post('/', asyncHandler(createSavedProperty))
savedPropertiesRouter.patch('/:savedPropertyId', asyncHandler(updateSavedProperty))
savedPropertiesRouter.delete('/:savedPropertyId', asyncHandler(deleteSavedProperty))
