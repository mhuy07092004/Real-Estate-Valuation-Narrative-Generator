import { Router } from 'express'
import { getStatus } from '../controllers/report.controller.js'

export const reportRouter = Router()

reportRouter.get('/:reportId/status', getStatus)
