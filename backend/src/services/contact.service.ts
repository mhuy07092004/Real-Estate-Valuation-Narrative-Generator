// Author: The Long Tran
import { sendContactEmail } from './email.service.js'
import type { ContactInput } from '../validators/contact.validator.js'

const MAX_PER_HOUR = 5
const WINDOW_MS = 60 * 60_000
const MAX_TRACKED_IPS = 10_000

export class ContactRateLimitError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super('Too many messages. Please try again later.')
    this.name = 'ContactRateLimitError'
  }
}

// In-memory per-IP limiter: best-effort spam brake for a public form. It resets
// on restart and is per Cloud Run instance, which is fine for this purpose.
const sends = new Map<string, number[]>()

function checkRateLimit(ip: string, now: number): void {
  if (sends.size >= MAX_TRACKED_IPS) {
    for (const [key, times] of sends) {
      if (times.every((t) => now - t >= WINDOW_MS)) sends.delete(key)
    }
  }

  const recent = (sends.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_HOUR) {
    throw new ContactRateLimitError(Math.ceil((recent[0] + WINDOW_MS - now) / 1000))
  }
  recent.push(now)
  sends.set(ip, recent)
}

/** Test hook: forget every recorded send. */
export function resetContactRateLimit(): void {
  sends.clear()
}

/** Emails a validated contact enquiry to the team inbox. */
export async function submitContactMessage(
  input: ContactInput,
  attachment: { filename: string; content: Buffer; mimeType: string } | undefined,
  ip: string,
): Promise<void> {
  checkRateLimit(ip, Date.now())

  // CONTACT_EMAIL_TO falls back to the sender address until a team inbox exists.
  const to = process.env.CONTACT_EMAIL_TO || process.env.SENDGRID_FROM_EMAIL
  if (!to) throw new Error('Contact email is not configured (missing CONTACT_EMAIL_TO/SENDGRID_FROM_EMAIL).')

  await sendContactEmail({ ...input, to, attachment })
}
