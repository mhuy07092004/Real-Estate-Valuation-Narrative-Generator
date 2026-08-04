import bcrypt from 'bcrypt'
import { env } from '../config/env.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './jwt.service.js'
import { toFrontendUser, type AuthResponseData, InvalidCredentialsError } from '../types/auth.types.js'
import { loginSchema, refreshTokenSchema, type LoginInput } from '../validators/auth.validator.js'
import { findUserByEmail, findUserById } from './user.service.js'

// Auth service stays DB-backed for users while the rest of the product can
// use mock data routes.
function buildAuthResponse(user: {
  userId: string
  fullName: string
  email: string
  roleName: string
  createdAt: Date
}): AuthResponseData {
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

/** Validates credentials and returns a ready-to-store frontend session payload. */
export async function loginUser(input: LoginInput): Promise<AuthResponseData> {
  const { email, password } = loginSchema.parse(input)
  const user = await findUserByEmail(email)

  if (!user?.passwordHash) {
    throw new InvalidCredentialsError()
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatches) {
    throw new InvalidCredentialsError()
  }

  return buildAuthResponse(user)
}

/** Resolves the current user profile for /auth/me responses. */
export async function getMe(userId: string) {
  const user = await findUserById(userId)
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
