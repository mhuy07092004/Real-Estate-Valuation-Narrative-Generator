import jwt from 'jsonwebtoken'
import jwksRsaFactory from 'jwks-rsa'
import { env } from '../config/env.js'
import { signAccessToken, signRefreshToken } from './jwt.service.js'
import { toFrontendUser, type AuthResponseData, type StoredUser } from '../types/auth.types.js'
import { microsoftAuthSchema } from '../validators/auth.validator.js'
import { createUser, findRoleIdByName, findUserByEmail } from './user.service.js'

// Microsoft's v2.0 signing keys are shared across the "common" multi-tenant
// endpoint — one JWKS URI verifies tokens for personal Microsoft accounts
// AND any work/school (Entra ID) tenant, so there's no need to look up a
// tenant-specific discovery endpoint per token.
const JWKS_URI = 'https://login.microsoftonline.com/common/discovery/v2.0/keys'

// Lazily constructed for the same reason as google-auth.service.ts's OAuth2Client.
let jwksClient: ReturnType<typeof jwksRsaFactory> | null = null
function getJwksClient() {
  if (!jwksClient) jwksClient = jwksRsaFactory({ jwksUri: JWKS_URI, cache: true, rateLimit: true })
  return jwksClient
}

// jsonwebtoken's callback-form `verify` calls this once per token to resolve
// the RSA public key matching the token header's `kid` — the standard
// jwks-rsa + jsonwebtoken integration pattern.
function getSigningKey(header: jwt.JwtHeader, callback: (err: Error | null, key?: string) => void) {
  if (!header.kid) {
    callback(new Error('Microsoft credential is missing a key id'))
    return
  }
  getJwksClient().getSigningKey(header.kid, (err, key) => {
    if (err || !key) {
      callback(err ?? new Error('Unable to resolve Microsoft signing key'))
      return
    }
    callback(null, key.getPublicKey())
  })
}

/** Thrown for any Microsoft sign-in failure; `status` is the HTTP status the controller should return. */
export class MicrosoftAuthError extends Error {
  status: number

  constructor(message: string, status = 401) {
    super(message)
    this.status = status
  }
}

type MicrosoftProfile = {
  email: string
  fullName: string
}

/**
 * Verifies an MSAL ID token against Microsoft's public keys (RS256, fetched
 * from JWKS_URI and cached) — this is the same "no client secret needed"
 * shape as Google's ID-token flow, just with a different JWKS endpoint.
 *
 * `audience` is pinned to our own Client ID. `iss` isn't a single fixed
 * string like Google's, because "common" spans personal accounts (a fixed
 * pseudo-tenant GUID) and every work/school tenant (one GUID per tenant) —
 * so instead of an exact match, we check that `iss` has the expected
 * Microsoft v2.0 issuer shape.
 */
async function verifyMicrosoftIdToken(idToken: string): Promise<MicrosoftProfile> {
  if (!env.microsoftOAuth.clientId) {
    throw new MicrosoftAuthError('Microsoft sign-in is not configured on the server', 503)
  }

  let payload: jwt.JwtPayload
  try {
    payload = await new Promise<jwt.JwtPayload>((resolve, reject) => {
      jwt.verify(
        idToken,
        getSigningKey,
        { audience: env.microsoftOAuth.clientId, algorithms: ['RS256'] },
        (err, decoded) => {
          if (err || !decoded || typeof decoded === 'string') {
            reject(err ?? new Error('Invalid Microsoft credential'))
            return
          }
          resolve(decoded)
        },
      )
    })
  } catch {
    throw new MicrosoftAuthError('Invalid or expired Microsoft credential')
  }

  if (!/^https:\/\/login\.microsoftonline\.com\/[^/]+\/v2\.0$/.test(payload.iss ?? '')) {
    throw new MicrosoftAuthError('Invalid or expired Microsoft credential')
  }

  // Personal Microsoft accounts always carry `email`. Work/school accounts
  // can lack a verified `email` claim if the tenant admin hasn't set one —
  // `preferred_username` is the UPN in that case, which is email-shaped for
  // the overwhelming majority of Entra ID tenants.
  const email = (payload.email as string | undefined) || (payload.preferred_username as string | undefined)
  if (!email) {
    throw new MicrosoftAuthError('Microsoft account has no usable email address')
  }

  return {
    email: email.toLowerCase(),
    fullName: (payload.name as string | undefined) || email,
  }
}

/**
 * Verifies the Microsoft credential and either logs into an existing account
 * or creates a new one, then issues the same JWT session pair as local
 * login/registration and loginOrRegisterWithGoogle.
 *
 * Account linking follows the same policy as Google: a matching email — from
 * a local password account, a prior Google sign-in, or a prior Microsoft
 * sign-in — logs into that account rather than erroring or duplicating it.
 * `role` is only required the first time we see this email.
 */
export async function loginOrRegisterWithMicrosoft(input: unknown, remoteIp?: string): Promise<AuthResponseData> {
  const { credential, role } = microsoftAuthSchema.parse(input)
  const profile = await verifyMicrosoftIdToken(credential)

  const existing = await findUserByEmail(profile.email)
  let stored: StoredUser

  if (existing) {
    stored = existing
  } else {
    if (!role) {
      throw new MicrosoftAuthError('Select a role to finish signing up with Microsoft', 422)
    }

    const roleId = await findRoleIdByName(role)
    if (roleId === null) {
      // Seed data missing — this is a setup problem, not a user error.
      throw new Error(`Role "${role}" not found — run "npm run prisma:seed"`)
    }

    stored = await createUser({
      fullName: profile.fullName,
      email: profile.email,
      roleId,
      authProvider: 'microsoft',
    })
  }

  const frontendUser = toFrontendUser(stored)
  const tokenPayload = { userId: stored.userId, email: stored.email, roles: frontendUser.roles }

  return {
    user: frontendUser,
    accessToken: signAccessToken(tokenPayload),
    refreshToken: signRefreshToken(tokenPayload),
    expiresIn: env.jwt.accessExpiresInSeconds,
  }
}
