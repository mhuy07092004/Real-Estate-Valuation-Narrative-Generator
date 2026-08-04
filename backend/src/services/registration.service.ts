import bcrypt from 'bcrypt'
import { env } from '../config/env.js'
import { DuplicateEmailError, toFrontendUser, type AuthResponseData } from '../types/auth.types.js'
import { registrationSchema, type RegistrationInput } from '../validators/registration.validator.js'
import { createUser, ensureRoleIdByName, findUserByEmail } from './user.service.js'
import { signAccessToken, signRefreshToken } from './jwt.service.js'

const SALT_ROUNDS = 12
const DEFAULT_ROLE_NAME = 'user'

/**
 * Validates input, checks for an existing account, hashes the password,
 * stores the new user, and — matching the frontend's expected auth
 * contract (see mock handlers) — immediately issues tokens so the caller
 * is logged in right after registering, not required to log in separately.
 *
 * Throws a ZodError on invalid input, or DuplicateEmailError if the
 * email is already registered.
 */
export async function registerUser(input: RegistrationInput): Promise<AuthResponseData> {
  const { fullName, email, password, role = DEFAULT_ROLE_NAME } = registrationSchema.parse(input)

  const existing = await findUserByEmail(email)
  if (existing) {
    throw new DuplicateEmailError(email)
  }

  // Keep registration reliable even if role seed has not been run yet.
  const roleId = await ensureRoleIdByName(role)

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const stored = await createUser({ fullName, email, passwordHash, roleId })

  const tokenPayload = { userId: stored.userId, email: stored.email, roles: [stored.roleName] }

  return {
    user: toFrontendUser(stored),
    accessToken: signAccessToken(tokenPayload),
    refreshToken: signRefreshToken(tokenPayload),
    expiresIn: env.jwt.accessExpiresInSeconds,
  }
}
