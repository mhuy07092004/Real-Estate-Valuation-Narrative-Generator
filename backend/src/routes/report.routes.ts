import { Router } from 'express'
import { createReport, deleteReport, getReport, listReports, updateReport } from '../controllers/reports.controller.js'
import { requireAuth } from '../middleware/require-auth.js'

export const reportRouter = Router()

// Owner-only report CRUD for backend Postman testing.
reportRouter.use(requireAuth)
reportRouter.get('/', listReports)
reportRouter.get('/:reportId', getReport)
reportRouter.post('/', createReport)
reportRouter.patch('/:reportId', updateReport)
reportRouter.delete('/:reportId', deleteReport)
