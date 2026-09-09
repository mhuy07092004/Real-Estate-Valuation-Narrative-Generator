// Inspection endpoints — list, create, full-checklist update — all behind
// requireAuth since every inspection is owned by a specific buyer.
import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { asyncHandler } from '../middleware/async-handler.js'
import {
    createInspection,
    listInspections,
    updateInspection,
} from '../controllers/inspection.controller.js'

export const inspectionRouter = Router()

inspectionRouter.get('/', requireAuth, asyncHandler(listInspections))
inspectionRouter.post('/', requireAuth, asyncHandler(createInspection))
inspectionRouter.put('/:inspectionId', requireAuth, asyncHandler(updateInspection))
