import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { GoogleAuthError, loginOrRegisterWithGoogle } from '../services/google-auth.service.js'
import { formatZodError } from '../utils/zod-error.js'
import type { ApiResponse, AuthResponseData } from '../types/auth.types.js'

/**
 * Handles POST /api/auth/google. Follows the same { success, data } /
 * { success, message, errors } envelope as login/register in auth.controller.ts.
 */
export async function googleAuth(req: Request, res: Response) {
  try {
    const data = await loginOrRegisterWithGoogle(req.body, req.ip)
    const body: ApiResponse<AuthResponseData> = {
      success: true,
      message: 'Signed in with Google.',
      data,
    }
    res.status(200).json(body)
  } catch (err) {
    if (err instanceof ZodError) {
      const body: ApiResponse<never> = {
        success: false,
        message: 'Validation failed.',
        errors: formatZodError(err),
      }
      res.status(400).json(body)
      return
    }

    if (err instanceof GoogleAuthError) {
      const body: ApiResponse<never> = { success: false, message: err.message }
      res.status(err.status).json(body)
      return
    }

    throw err
  }
}
