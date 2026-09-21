import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { registerUser } from '../services/registration.service.js'
import { issueOtp, InvalidOtpError, OtpRateLimitError } from '../services/otp.service.js'
import { sendOtpEmail } from '../services/email.service.js'
import { findUserByEmail } from '../services/user.service.js'
import { sendOtpSchema } from '../validators/registration.validator.js'
import { CaptchaRequiredError, TurnstileVerificationError } from '../services/turnstile.service.js'
import { DuplicateEmailError } from '../types/auth.types.js'
import type { ApiResponse, AuthResponseData } from '../types/auth.types.js'

export async function register(req: Request, res: Response) {
  try {
    const data = await registerUser(req.body, req.ip)
    const body: ApiResponse<AuthResponseData> = {
      success: true,
      message: 'Account created successfully.',
      data,
    }
    res.status(201).json(body)
  } catch (err) {
    if (err instanceof ZodError) {
      // Flatten zod's fieldErrors (string[] per field) down to one message per
      // field, matching the frontend's Record<string, string> error shape.
      const fieldErrors = err.flatten().fieldErrors
      const errors: Record<string, string> = {}
      for (const [field, messages] of Object.entries(fieldErrors)) {
        if (messages?.[0]) errors[field] = messages[0]
      }
      const body: ApiResponse<never> = { success: false, message: 'Validation failed.', errors }
      res.status(400).json(body)
      return
    }
    if (err instanceof CaptchaRequiredError) {
      const body: ApiResponse<never> = {
        success: false,
        message: err.message,
        captchaRequired: true,
      }
      res.status(403).json(body)
      return
    }
    if (err instanceof TurnstileVerificationError) {
      const body: ApiResponse<never> = {
        success: false,
        message: err.message,
        errors: { turnstileToken: err.message },
        captchaRequired: true,
      }
      res.status(400).json(body)
      return
    }
    if (err instanceof InvalidOtpError) {
      const body: ApiResponse<never> = {
        success: false,
        message: err.message,
        errors: { otp: err.message },
      }
      res.status(400).json(body)
      return
    }
    if (err instanceof DuplicateEmailError) {
      const body: ApiResponse<never> = {
        success: false,
        message: 'An account with this email already exists.',
        errors: { email: 'Email already in use' },
        captchaRequired: err.captchaRequired,
      }
      res.status(409).json(body)
      return
    }
    throw err // caught by the app-level error handler
  }
}

export async function sendOtp(req: Request, res: Response) {
  try {
    const { email } = sendOtpSchema.parse(req.body)

    if (await findUserByEmail(email)) {
      const body: ApiResponse<never> = {
        success: false,
        message: 'An account with this email already exists.',
        errors: { email: 'Email already in use' },
      }
      res.status(409).json(body)
      return
    }

    const code = await issueOtp(email)

    // Dev convenience: lets teammates without SendGrid keys still sign up.
    // Never in production — logs there are readable by more people than the
    // inbox owner. (Dockerfile sets NODE_ENV=production.)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[dev] OTP for ${email}: ${code}`)
    }

    try {
      await sendOtpEmail({ to: email, code })
    } catch (err) {
      if (process.env.NODE_ENV === 'production') throw err
      console.warn('[dev] OTP email not sent:', (err as Error).message)
    }

    res.json({ success: true, message: 'Verification code sent.' })
  } catch (err) {
    if (err instanceof ZodError) {
      const errors: Record<string, string> = {}
      for (const [field, messages] of Object.entries(err.flatten().fieldErrors)) {
        if (messages?.[0]) errors[field] = messages[0]
      }
      res.status(400).json({ success: false, message: 'Validation failed.', errors })
      return
    }
    if (err instanceof OtpRateLimitError) {
      res.status(429).json({
        success: false,
        message: err.message,
        retryAfterSeconds: err.retryAfterSeconds,
      })
      return
    }
    throw err
  }
}
