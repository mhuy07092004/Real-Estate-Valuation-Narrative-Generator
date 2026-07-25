import { Router } from 'express'
import { register } from '../controllers/registration.controller.js'

export const registrationRouter = Router()

registrationRouter.post('/register', register)
