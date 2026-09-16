// Deliberately NOT behind requireAuth — this is the whole point of a share
// link: a client with no Relaive account can view one report using only the
// unguessable token in the URL. See getPublicReport's own comment for what
// this endpoint does and doesn't expose.
import { Router } from 'express'
import { asyncHandler } from '../middleware/async-handler.js'
import { getPublicReport } from '../controllers/report.controller.js'

export const publicReportRouter = Router()

publicReportRouter.get('/:token', asyncHandler(getPublicReport))
