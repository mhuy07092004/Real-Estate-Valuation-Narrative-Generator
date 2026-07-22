import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { registerUser } from '../services/registration.service.js'
import { DuplicateEmailError } from '../types/auth.types.js'
import type { ApiResponse, AuthResponseData } from '../types/auth.types.js'

export async function register(req: Request, res: Response) {
  try {
    const data = await registerUser(req.body)
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
    if (err instanceof DuplicateEmailError) {
      const body: ApiResponse<never> = {
        success: false,
        message: 'An account with this email already exists.',
        errors: { email: 'Email already in use' },
      }
      res.status(409).json(body)
      return
    }
    throw err // caught by the app-level error handler
  }
}
