// Report REST endpoints — list, get one, create — behind requireAuth
// since every report is owned by a specific user.
import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { asyncHandler } from '../middleware/async-handler.js'
import {
    createReport,
    createShareLink,
    getReport,
    listReports,
    sendReportEmail,
} from '../controllers/report.controller.js'

export const reportRouter = Router()

reportRouter.get('/', requireAuth, asyncHandler(listReports))
reportRouter.get('/:reportId', requireAuth, asyncHandler(getReport))
reportRouter.post('/', requireAuth, asyncHandler(createReport))
reportRouter.post('/:reportId/share-link', requireAuth, asyncHandler(createShareLink))
reportRouter.post('/:reportId/send-email', requireAuth, asyncHandler(sendReportEmail))
