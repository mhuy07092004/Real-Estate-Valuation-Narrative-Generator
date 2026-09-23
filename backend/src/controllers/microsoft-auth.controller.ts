import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { MicrosoftAuthError, loginOrRegisterWithMicrosoft } from '../services/microsoft-auth.service.js'
import { formatZodError } from '../utils/zod-error.js'
import type { ApiResponse, AuthResponseData } from '../types/auth.types.js'

/**
 * Handles POST /api/auth/microsoft. Same envelope as google-auth.controller.ts's
 * googleAuth and login/register in auth.controller.ts.
 */
export async function microsoftAuth(req: Request, res: Response) {
  try {
    const data = await loginOrRegisterWithMicrosoft(req.body, req.ip)
    const body: ApiResponse<AuthResponseData> = {
      success: true,
      message: 'Signed in with Microsoft.',
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

    if (err instanceof MicrosoftAuthError) {
      const body: ApiResponse<never> = { success: false, message: err.message }
      res.status(err.status).json(body)
      return
    }

    throw err
  }
}
