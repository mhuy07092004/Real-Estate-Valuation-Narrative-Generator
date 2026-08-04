import { Router } from 'express'
import {
  createSavedProperty,
  deleteSavedProperty,
  getSavedProperty,
  listSavedProperties,
  updateSavedProperty,
} from '../controllers/saved-properties.controller.js'
import { requireAuth } from '../middleware/require-auth.js'

export const savedPropertiesRouter = Router()

// Owner-only saved-search CRUD for backend Postman testing.
savedPropertiesRouter.use(requireAuth)
savedPropertiesRouter.get('/', listSavedProperties)
savedPropertiesRouter.get('/:savedPropertyId', getSavedProperty)
savedPropertiesRouter.post('/', createSavedProperty)
savedPropertiesRouter.patch('/:savedPropertyId', updateSavedProperty)
savedPropertiesRouter.delete('/:savedPropertyId', deleteSavedProperty)
