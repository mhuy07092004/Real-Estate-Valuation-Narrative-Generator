import { Router } from 'express'
import { register } from '../controllers/registration.controller.js'
import { forgotPassword, login, me, refreshToken } from '../controllers/auth.controller.js'
import { asyncHandler } from '../middleware/async-handler.js'

// Auth endpoints consumed by frontend sign-in/sign-up and session flows.
export const registrationRouter = Router()

registrationRouter.post('/register', asyncHandler(register))
registrationRouter.post('/login', asyncHandler(login))
registrationRouter.post('/forgot-password', asyncHandler(forgotPassword))
registrationRouter.get('/me', asyncHandler(me))
registrationRouter.post('/refresh-token', asyncHandler(refreshToken))
