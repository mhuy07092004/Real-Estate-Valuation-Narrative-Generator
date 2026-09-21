import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'

const OTP_TTL_MS = 10 * 60_000
const RESEND_COOLDOWN_MS = 60_000
const MAX_SENDS_PER_HOUR = 5
const MAX_ATTEMPTS = 5

export class OtpRateLimitError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super('Please wait before requesting another code.')
    this.name = 'OtpRateLimitError'
  }
}

export class InvalidOtpError extends Error {
  constructor(message = 'Invalid or expired code.') {
    super(message)
    this.name = 'InvalidOtpError'
  }
}

// Keyed hash, not a bare SHA: a 6-digit code has only 1M possibilities, so an
// unkeyed hash could be reversed instantly if the table ever leaked.
function hashCode(email: string, code: string): string {
  return createHmac('sha256', env.jwt.accessSecret).update(`${email}:${code}`).digest('hex')
}

/** Creates and stores a fresh code for `email`; returns the plain code to email out. */
export async function issueOtp(email: string): Promise<string> {
  const now = Date.now()

  const latest = await prisma.emailOtp.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
  })
  if (latest) {
    const waitMs = latest.createdAt.getTime() + RESEND_COOLDOWN_MS - now
    if (waitMs > 0) throw new OtpRateLimitError(Math.ceil(waitMs / 1000))
  }

  const sentLastHour = await prisma.emailOtp.count({
    where: { email, createdAt: { gt: new Date(now - 60 * 60_000) } },
  })
  if (sentLastHour >= MAX_SENDS_PER_HOUR) throw new OtpRateLimitError(60 * 60)

  const code = randomInt(0, 1_000_000).toString().padStart(6, '0')

  // Only the newest code is ever valid.
  await prisma.emailOtp.updateMany({
    where: { email, consumedAt: null },
    data: { consumedAt: new Date() },
  })
  await prisma.emailOtp.create({
    data: { email, codeHash: hashCode(email, code), expiresAt: new Date(now + OTP_TTL_MS) },
  })

  return code
}

/**
 * Checks `code` against the latest live code for `email`. Returns the record id
 * to pass to consumeOtp() once the account is actually created. Wrong guesses
 * count toward the attempt limit.
 */
export async function verifyOtp(email: string, code: string): Promise<string> {
  const record = await prisma.emailOtp.findFirst({
    where: { email, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
  if (!record || record.attempts >= MAX_ATTEMPTS) throw new InvalidOtpError()

  const expected = Buffer.from(record.codeHash, 'hex')
  const actual = Buffer.from(hashCode(email, code), 'hex')
  if (!timingSafeEqual(expected, actual)) {
    await prisma.emailOtp.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } })
    throw new InvalidOtpError()
  }

  return record.id
}

export async function consumeOtp(id: string): Promise<void> {
  await prisma.emailOtp.update({ where: { id }, data: { consumedAt: new Date() } })
}
