// Mounted at /api/valuer/cases alongside report-list.routes' GET handlers.
import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { asyncHandler } from '../middleware/async-handler.js'
import { updateCase } from '../controllers/case-status.controller.js'

export const caseStatusRouter = Router()

caseStatusRouter.patch('/:reportId', requireAuth, asyncHandler(updateCase))
