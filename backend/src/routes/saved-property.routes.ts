// SavedProperty endpoints. Two routers since the read side is mounted at 4
// different role-specific paths (same handler, per-page URL convention —
// see routes/index.ts) while create/delete share one path, not per-role.
import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { asyncHandler } from '../middleware/async-handler.js'
import {
    createSavedProperty,
    deleteSavedProperty,
    listSavedProperties,
} from '../controllers/saved-property.controller.js'

export const savedPropertyReadRouter = Router()
savedPropertyReadRouter.get('/', requireAuth, asyncHandler(listSavedProperties))

export const savedPropertyWriteRouter = Router()
savedPropertyWriteRouter.post('/', requireAuth, asyncHandler(createSavedProperty))
savedPropertyWriteRouter.delete('/:savedPropertyId', requireAuth, asyncHandler(deleteSavedProperty))
