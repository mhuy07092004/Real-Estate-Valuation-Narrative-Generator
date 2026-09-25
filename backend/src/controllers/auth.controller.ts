import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { verifyAccessToken } from '../services/jwt.service.js'
import { forgotPasswordSchema } from '../validators/auth.validator.js'
import { getMe, loginUser, refreshSession, selectUserRole, updateProfile as updateProfileService } from '../services/auth.service.js'
import { CaptchaRequiredError, TurnstileVerificationError } from '../services/turnstile.service.js'
import { InvalidCredentialsError, RoleAlreadySetError, type ApiResponse, type AuthResponseData, type FrontendUser } from '../types/auth.types.js'

/**
 * Converts Zod validation errors into the frontend's field-error response shape.
 */
function toFieldErrorResponse(err: ZodError): ApiResponse<never> {
  const fieldErrors = err.flatten().fieldErrors
  const errors: Record<string, string> = {}

  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages?.[0]) errors[field] = messages[0]
  }

  return { success: false, message: 'Validation failed.', errors }
}

/**
 * Reads bearer token from Authorization header.
 */
function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) return null
  return header.slice(7)
}

/**
 * Authenticates user credentials and returns a full auth session payload.
 */
export async function login(req: Request, res: Response) {
  try {
    const data = await loginUser(req.body, req.ip)
    const body: ApiResponse<AuthResponseData> = {
      success: true,
      message: 'Login successful.',
      data,
    }
    res.status(200).json(body)
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json(toFieldErrorResponse(err))
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

    if (err instanceof InvalidCredentialsError) {
      const body: ApiResponse<never> = {
        success: false,
        message: err.message,
        captchaRequired: err.captchaRequired,
      }
      res.status(401).json(body)
      return
    }

    throw err
  }
}

/**
 * Prototype endpoint that validates email format and always acknowledges reset flow.
 */
export function forgotPassword(req: Request, res: Response) {
  try {
    forgotPasswordSchema.parse(req.body)
    const body: ApiResponse<{ acknowledged: true }> = {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
      data: { acknowledged: true },
    }
    res.status(200).json(body)
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json(toFieldErrorResponse(err))
      return
    }

    throw err
  }
}

/**
 * Returns the current authenticated user from access token.
 */
export async function me(req: Request, res: Response) {
  const token = getBearerToken(req)

  if (!token) {
    const body: ApiResponse<never> = {
      success: false,
      message: 'Authentication required. Please provide a valid token.',
    }
    res.status(401).json(body)
    return
  }

  try {
    const payload = verifyAccessToken(token)
    const user = await getMe(payload.userId)

    if (!user) {
      const body: ApiResponse<never> = { success: false, message: 'User not found.' }
      res.status(404).json(body)
      return
    }

    const body: ApiResponse<{ user: FrontendUser }> = {
      success: true,
      data: { user },
    }

    res.status(200).json(body)
  } catch {
    const body: ApiResponse<never> = {
      success: false,
      message: 'Token is invalid or has expired.',
    }
    res.status(401).json(body)
  }
}

/**
 * Updates the current authenticated user's Personal Information (Settings
 * > Personal Information). Mounted behind requireAuth, unlike /me above,
 * which does its own token parsing — this reads the userId requireAuth
 * already put in res.locals.
 */
export async function updateProfile(req: Request, res: Response) {
  try {
    const user = await updateProfileService(res.locals.userId, req.body)

    if (!user) {
      const body: ApiResponse<never> = { success: false, message: 'User not found.' }
      res.status(404).json(body)
      return
    }

    const body: ApiResponse<{ user: FrontendUser }> = {
      success: true,
      message: 'Profile updated successfully.',
      data: { user },
    }
    res.status(200).json(body)
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json(toFieldErrorResponse(err))
      return
    }

    throw err
  }
}

/**
 * Exchanges a refresh token for a new access/refresh token pair.
 */
export async function refreshToken(req: Request, res: Response) {
  try {
    const data = await refreshSession(req.body)
    const body: ApiResponse<AuthResponseData> = {
      success: true,
      message: 'Token refreshed successfully.',
      data,
    }
    res.status(200).json(body)
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json(toFieldErrorResponse(err))
      return
    }

    if (err instanceof InvalidCredentialsError) {
      const body: ApiResponse<never> = {
        success: false,
        message: 'Refresh token is invalid or has expired.',
      }
      res.status(401).json(body)
      return
    }

    const body: ApiResponse<never> = {
      success: false,
      message: 'Refresh token is invalid or has expired.',
    }
    res.status(401).json(body)
  }
}

/**
 * Sets the user's dashboard role (first-time only) and returns a fresh session.
 */
export async function selectRole(req: Request, res: Response) {
  try {
    const data = await selectUserRole(res.locals.userId, req.body)
    const body: ApiResponse<AuthResponseData> = {
      success: true,
      message: 'Role selected successfully.',
      data,
    }
    res.status(200).json(body)
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json(toFieldErrorResponse(err))
      return
    }

    if (err instanceof RoleAlreadySetError) {
      const body: ApiResponse<never> = {
        success: false,
        message: err.message,
      }
      res.status(409).json(body)
      return
    }

    if (err instanceof InvalidCredentialsError) {
      const body: ApiResponse<never> = {
        success: false,
        message: 'User not found.',
      }
      res.status(404).json(body)
      return
    }

    throw err
  }
}
