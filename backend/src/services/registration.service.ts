import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { DuplicateEmailError, toFrontendUser, type AuthResponseData } from '../types/auth.types.js'
import { registrationSchema, type RegistrationInput } from '../validators/registration.validator.js'
import { createUser, findRoleIdByName, findUserByEmail } from './user.service.js'
import { signAccessToken, signRefreshToken } from './jwt.service.js'

const SALT_ROUNDS = 12
const DEFAULT_ROLE_NAME = 'user'

//*validates input, checks for an existing account, hashes the password, stores new user, match fe authen contract, issue token so logged in right after regis*/
//*throw error on invalid input, duplicateemailerror if email is registered alr*/
export async function registerUser(input: RegistrationInput): Promise<AuthResponseData> {
  const { fullName, email, password } = registrationSchema.parse(input)

  const existing = await findUserByEmail(email)
  if (existing) {
    throw new DuplicateEmailError(email)
  }

  const roleId = await findRoleIdByName(DEFAULT_ROLE_NAME)
  if (roleId === null) {
    //*seed data missing-set-up issue in case*/
    throw new Error(`Default role "${DEFAULT_ROLE_NAME}" not found — run "npm run prisma:seed"`)
  }

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
