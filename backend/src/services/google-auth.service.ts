import { OAuth2Client } from 'google-auth-library'
import { env } from '../config/env.js'
import { signAccessToken, signRefreshToken } from './jwt.service.js'
import { toFrontendUser, type AuthResponseData, type StoredUser } from '../types/auth.types.js'
import { googleAuthSchema } from '../validators/auth.validator.js'
import { createUser, findUserByEmail } from './user.service.js'

// Lazily constructed so a missing GOOGLE_OAUTH_CLIENT_ID doesn't crash the
// process at import time — verifyGoogleIdToken below checks env first and
// fails with a clear 503 instead.
let client: OAuth2Client | null = null
function getClient(): OAuth2Client {
  if (!client) client = new OAuth2Client(env.googleOAuth.clientId)
  return client
}

/** Thrown for any Google sign-in failure; `status` is the HTTP status the controller should return. */
export class GoogleAuthError extends Error {
  status: number

  constructor(message: string, status = 401) {
    super(message)
    this.status = status
  }
}

type GoogleProfile = {
  email: string
  fullName: string
}

/**
 * Verifies a Google Identity Services ID token against Google's public keys
 * (no network call to Google needed beyond the library's cached key fetch —
 * this is NOT the Authorization Code flow, so there's no client secret and
 * no token exchange). `audience` must match the same Client ID the frontend
 * initialized with, or a token minted for a different app would be accepted.
 */
async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  if (!env.googleOAuth.clientId) {
    throw new GoogleAuthError('Google sign-in is not configured on the server', 503)
  }

  let payload
  try {
    const ticket = await getClient().verifyIdToken({
      idToken,
      audience: env.googleOAuth.clientId,
    })
    payload = ticket.getPayload()
  } catch {
    throw new GoogleAuthError('Invalid or expired Google credential')
  }

  if (!payload?.email || !payload.email_verified) {
    throw new GoogleAuthError('Google account has no verified email address')
  }

  return {
    email: payload.email.toLowerCase(),
    fullName: payload.name || payload.email,
  }
}

/**
 * Verifies the Google credential and either logs into an existing account
 * or creates a new one, then issues the same JWT session pair as local
 * login/registration.
 *
 * Account linking: if the email already has an account — whether it was
 * created via local password signup or a previous Google sign-in — this
 * logs into that same account rather than erroring or creating a
 * duplicate. Google has already verified the email address, so a matching
 * email is treated as proof of ownership (team decision — see the map PR's
 * follow-up conversation).
 *
 * New accounts are created role-less, same as local OTP registration —
 * ProtectedRoute redirects any role-less user to /select-role, so Google
 * sign-up doesn't need to collect a role upfront either.
 */
export async function loginOrRegisterWithGoogle(input: unknown, remoteIp?: string): Promise<AuthResponseData> {
  const { credential } = googleAuthSchema.parse(input)
  const profile = await verifyGoogleIdToken(credential)

  const existing = await findUserByEmail(profile.email)
  const stored: StoredUser =
    existing ??
    (await createUser({
      fullName: profile.fullName,
      email: profile.email,
      authProvider: 'google',
    }))

  const frontendUser = toFrontendUser(stored)
  const tokenPayload = { userId: stored.userId, email: stored.email, roles: frontendUser.roles }

  return {
    user: frontendUser,
    accessToken: signAccessToken(tokenPayload),
    refreshToken: signRefreshToken(tokenPayload),
    expiresIn: env.jwt.accessExpiresInSeconds,
  }
}
