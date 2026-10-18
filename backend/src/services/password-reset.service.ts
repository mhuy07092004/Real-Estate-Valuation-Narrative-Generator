import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { sendPasswordResetEmail } from './email.service.js'

const RESET_TTL_MS = 30 * 60_000
const RESEND_COOLDOWN_MS = 60_000
const MAX_REQUESTS_PER_HOUR = 5
const SALT_ROUNDS = 10

export class InvalidResetTokenError extends Error {
  constructor() {
    super('This reset link is invalid or has expired.')
    this.name = 'InvalidResetTokenError'
  }
}

// Plain SHA-256 is enough here (unlike the 6-digit OTP): the token is 256 bits
// of randomness, so it can't be brute-forced from a leaked hash.
export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function logSkipped(email: string, reason: string): void {
  // Dev only: the HTTP response is deliberately identical either way, so this
  // is the only way to see why no email went out.
  if (process.env.NODE_ENV !== 'production') console.log(`[dev] Password reset skipped for ${email}: ${reason}`)
}

/**
 * Emails a reset link when `email` belongs to an active, password-based
 * account. Always resolves silently otherwise (unknown email, Google-only
 * account, throttled) so the endpoint never reveals which emails are registered.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return logSkipped(email, 'no account with this email')
  if (!user.isActive) return logSkipped(email, 'account is deactivated')
  if (!user.passwordHash) return logSkipped(email, 'account has no password (Google sign-in)')

  const now = Date.now()
  const latest = await prisma.passwordResetToken.findFirst({
    where: { userId: user.userId },
    orderBy: { createdAt: 'desc' },
  })
  if (latest && latest.createdAt.getTime() + RESEND_COOLDOWN_MS > now) return logSkipped(email, 'requested again within 60s')

  const sentLastHour = await prisma.passwordResetToken.count({
    where: { userId: user.userId, createdAt: { gt: new Date(now - 60 * 60_000) } },
  })
  if (sentLastHour >= MAX_REQUESTS_PER_HOUR) return logSkipped(email, 'hourly limit reached')

  const token = randomBytes(32).toString('base64url')

  // Only the newest link is ever valid.
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.userId, usedAt: null },
    data: { usedAt: new Date() },
  })
  await prisma.passwordResetToken.create({
    data: {
      userId: user.userId,
      tokenHash: hashResetToken(token),
      expiresAt: new Date(now + RESET_TTL_MS),
    },
  })

  const resetUrl = `${process.env.PUBLIC_APP_URL ?? 'http://localhost:5173'}/reset-password?token=${token}`

  // Dev convenience, same as the sign-up OTP: never log the link in production.
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[dev] Password reset link for ${email}: ${resetUrl}`)
  }

  try {
    await sendPasswordResetEmail({ to: email, resetUrl })
  } catch (err) {
    if (process.env.NODE_ENV === 'production') throw err
    console.warn('[dev] Password reset email not sent:', (err as Error).message)
  }
}

/** Sets a new password from a valid link, burns every open link, and ends old sessions. */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    include: { user: true },
  })

  if (!record || record.usedAt || record.expiresAt <= new Date() || !record.user.isActive) {
    throw new InvalidResetTokenError()
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
  const now = new Date()

  // Claim the link inside the transaction so two concurrent submits can't both win.
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: now },
    })
    if (claimed.count === 0) throw new InvalidResetTokenError()

    await tx.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: now },
    })
    await tx.user.update({
      where: { userId: record.userId },
      data: { passwordHash, passwordChangedAt: now },
    })
  })
}
