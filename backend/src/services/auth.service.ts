import bcrypt from 'bcrypt'
import { env } from '../config/env.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './jwt.service.js'
import { toFrontendUser, type AuthResponseData, type StoredUser, InvalidCredentialsError } from '../types/auth.types.js'
import { loginSchema, refreshTokenSchema, updateProfileSchema, type LoginInput } from '../validators/auth.validator.js'
import { findUserByEmail, findUserById, updateUserProfile } from './user.service.js'
import { CaptchaRequiredError, verifyTurnstileToken } from './turnstile.service.js'
import {
  isLoginCaptchaRequired,
  recordLoginAttempt,
  recordLoginFailure,
  recordLoginSuccess,
} from './auth-risk.service.js'

// Auth service stays DB-backed for users while the rest of the product can
// use mock data routes.
function buildAuthResponse(user: StoredUser): AuthResponseData {
  const frontendUser = toFrontendUser(user)
  const tokenPayload = {
    userId: user.userId,
    email: user.email,
    roles: frontendUser.roles,
  }

  return {
    user: frontendUser,
    accessToken: signAccessToken(tokenPayload),
    refreshToken: signRefreshToken(tokenPayload),
    expiresIn: env.jwt.accessExpiresInSeconds,
  }
}

/**
 * Validates credentials and returns a ready-to-store frontend session payload.
 * A captcha is only verified when risk scoring asks for one, so normal sign-ins
 * never pay for the challenge or the Cloudflare round trip.
 */
export async function loginUser(input: LoginInput, remoteIp?: string): Promise<AuthResponseData> {
  const { email, password, turnstileToken } = loginSchema.parse(input)
  const risk = { ip: remoteIp, email }

  recordLoginAttempt(risk)

  if (isLoginCaptchaRequired(risk)) {
    if (!turnstileToken) throw new CaptchaRequiredError()
    await verifyTurnstileToken(turnstileToken, remoteIp)
  }

  const user = await findUserByEmail(email)
  const passwordMatches = user?.passwordHash
    ? await bcrypt.compare(password, user.passwordHash)
    : false

  if (!user?.passwordHash || !passwordMatches) {
    recordLoginFailure(risk)
    // Tell the client whether the *next* attempt needs a captcha, so the widget
    // appears before the retry instead of costing an extra doomed submit.
    throw new InvalidCredentialsError(isLoginCaptchaRequired(risk))
  }

  recordLoginSuccess(risk)
  return buildAuthResponse(user)
}

/** Resolves the current user profile for /auth/me responses. */
export async function getMe(userId: string) {
  const user = await findUserById(userId)
  if (!user) return null
  return toFrontendUser(user)
}

/** Validates and persists Settings > Personal Information edits. */
export async function updateProfile(userId: string, input: unknown) {
  const { fullName, phone, company } = updateProfileSchema.parse(input)
  const user = await updateUserProfile(userId, {
    fullName,
    phone: phone && phone.length > 0 ? phone : null,
    company: company && company.length > 0 ? company : null,
  })
  if (!user) return null
  return toFrontendUser(user)
}

/** Validates refresh token and issues a fresh access/refresh pair. */
export async function refreshSession(input: unknown): Promise<AuthResponseData> {
  const { refreshToken } = refreshTokenSchema.parse(input)
  const payload = verifyRefreshToken(refreshToken)
  const user = await findUserById(payload.userId)

  if (!user) {
    throw new InvalidCredentialsError()
  }

  return buildAuthResponse(user)
}
