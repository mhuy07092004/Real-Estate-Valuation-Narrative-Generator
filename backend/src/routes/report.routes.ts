import { Router } from 'express'
import { createReport, deleteReport, getReport, listReports, updateReport } from '../controllers/reports.controller.js'
import { requireAuth } from '../middleware/require-auth.js'
import { asyncHandler } from '../middleware/async-handler.js'

export const reportRouter = Router()

// Owner-only report CRUD for backend Postman testing.
reportRouter.use(requireAuth)
reportRouter.get('/', asyncHandler(listReports))
reportRouter.get('/:reportId', asyncHandler(getReport))
reportRouter.post('/', asyncHandler(createReport))
reportRouter.patch('/:reportId', asyncHandler(updateReport))
reportRouter.delete('/:reportId', asyncHandler(deleteReport))
