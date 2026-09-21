import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { DuplicateEmailError, toFrontendUser, type AuthResponseData } from '../types/auth.types.js'
import { registrationSchema, type RegistrationInput } from '../validators/registration.validator.js'
import { createUser, findRoleIdByName, findUserByEmail } from './user.service.js'
import { consumeOtp, verifyOtp } from './otp.service.js'
import { signAccessToken, signRefreshToken } from './jwt.service.js'
import { CaptchaRequiredError, verifyTurnstileToken } from './turnstile.service.js'
import {
  isRegisterCaptchaRequired,
  recordRegisterFailure,
  recordRegisterSuccess,
} from './auth-risk.service.js'

const SALT_ROUNDS = 12

/**
 * Validates input, checks for an existing account, hashes the password,
 * stores the new user, and — matching the frontend's expected auth
 * contract (see mock handlers) — immediately issues tokens so the caller
 * is logged in right after registering, not required to log in separately.
 *
 * Throws a ZodError on invalid input, or DuplicateEmailError if the
 * email is already registered.
 */
export async function registerUser(input: RegistrationInput, remoteIp?: string): Promise<AuthResponseData> {
  const {
    fullName,
    email,
    password,
    role,
    turnstileToken,
    otp,
  } = registrationSchema.parse(input)
  const risk = { ip: remoteIp }

  if (isRegisterCaptchaRequired(risk)) {
    if (!turnstileToken) throw new CaptchaRequiredError()
    await verifyTurnstileToken(turnstileToken, remoteIp)
  }

  const existing = await findUserByEmail(email)
  if (existing) {
    recordRegisterFailure(risk)
    throw new DuplicateEmailError(email, isRegisterCaptchaRequired(risk))
  }

  // Proves control of the email. Checked before hashing the password (bcrypt is
  // the expensive step) and consumed only after the user row exists, so a
  // failed insert doesn't burn the code.
  const otpId = await verifyOtp(email, otp)

  const roleId = await findRoleIdByName(role)
  if (roleId === null) {
    // Seed data missing — this is a setup problem, not a user error.
    throw new Error(`Role "${role}" not found — run "npm run prisma:seed"`)
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const stored = await createUser({ fullName, email, passwordHash, roleId })
  await consumeOtp(otpId)
  recordRegisterSuccess(risk)

  const tokenPayload = { userId: stored.userId, email: stored.email, roles: [stored.roleName] }

  return {
    user: toFrontendUser(stored),
    accessToken: signAccessToken(tokenPayload),
    refreshToken: signRefreshToken(tokenPayload),
    expiresIn: env.jwt.accessExpiresInSeconds,
  }
}
