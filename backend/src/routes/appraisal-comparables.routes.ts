import { Router } from 'express'
import { getComparables, submitComparables } from '../controllers/appraisal-comparables.controller.js'

export const comparablesRouter = Router()

comparablesRouter.get('/comparable-sales', getComparables)
comparablesRouter.post('/comparables/:draftId', submitComparables)
