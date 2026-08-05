import { Router } from 'express'
import { getSteps } from '../controllers/appraisal-steps.controller.js'

export const appraisalStepsRouter = Router()
appraisalStepsRouter.get('/steps', getSteps)
