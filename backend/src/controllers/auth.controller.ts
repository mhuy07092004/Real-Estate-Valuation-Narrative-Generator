import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { verifyAccessToken } from '../services/jwt.service.js'
import { forgotPasswordSchema } from '../validators/auth.validator.js'
import { getMe, loginUser, refreshSession } from '../services/auth.service.js'
import { InvalidCredentialsError, type ApiResponse, type AuthResponseData, type FrontendUser } from '../types/auth.types.js'

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
    const data = await loginUser(req.body)
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

    if (err instanceof InvalidCredentialsError) {
      const body: ApiResponse<never> = { success: false, message: err.message }
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
