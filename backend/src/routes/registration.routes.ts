import { Router } from 'express'
import { register } from '../controllers/registration.controller.js'
import { forgotPassword, login, me, refreshToken } from '../controllers/auth.controller.js'

// Auth endpoints consumed by frontend sign-in/sign-up and session flows.
export const registrationRouter = Router()

registrationRouter.post('/register', register)
registrationRouter.post('/login', login)
registrationRouter.post('/forgot-password', forgotPassword)
registrationRouter.get('/me', me)
registrationRouter.post('/refresh-token', refreshToken)
