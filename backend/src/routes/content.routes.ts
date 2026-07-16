import { Router } from 'express'
import { getHomepage } from '../controllers/content.controller.js'

export const contentRouter = Router()

contentRouter.get('/homepage', getHomepage)
