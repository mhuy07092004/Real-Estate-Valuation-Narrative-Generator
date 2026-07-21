import { Router } from 'express'
import { getConfig, getDemo, startDemo } from '../controllers/navigation.controller.js'

export const navigationRouter = Router()

navigationRouter.get('/config', getConfig)
navigationRouter.post('/demo/start', startDemo)
navigationRouter.get('/demo/:sessionId', getDemo)
