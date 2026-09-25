import { Router } from 'express'
import { register, sendOtp } from '../controllers/registration.controller.js'
import { forgotPassword, login, me, refreshToken, selectRole, updateProfile } from '../controllers/auth.controller.js'
import { asyncHandler } from '../middleware/async-handler.js'
import { requireAuth } from '../middleware/require-auth.js'

// Auth endpoints consumed by frontend sign-in/sign-up and session flows.
export const registrationRouter = Router()

registrationRouter.post('/send-otp', asyncHandler(sendOtp))
registrationRouter.post('/register', asyncHandler(register))
registrationRouter.post('/login', asyncHandler(login))
registrationRouter.post('/forgot-password', asyncHandler(forgotPassword))
registrationRouter.get('/me', asyncHandler(me))
registrationRouter.patch('/me', requireAuth, asyncHandler(updateProfile))
registrationRouter.post('/select-role', requireAuth, asyncHandler(selectRole))
registrationRouter.post('/refresh-token', asyncHandler(refreshToken))
