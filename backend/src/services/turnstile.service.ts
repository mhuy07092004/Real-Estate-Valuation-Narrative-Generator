import { env } from '../config/env.js'

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/** Thrown when a Turnstile captcha token fails Cloudflare verification. */
export class TurnstileVerificationError extends Error {
  constructor(message = 'Captcha verification failed. Please try again.') {
    super(message)
    this.name = 'TurnstileVerificationError'
  }
}

/**
 * Thrown when risk scoring demands a captcha but the client sent none — the
 * client's cue to reveal the widget and resubmit, not a user-facing failure.
 */
export class CaptchaRequiredError extends Error {
  constructor(message = 'Please complete the captcha challenge to continue.') {
    super(message)
    this.name = 'CaptchaRequiredError'
  }
}

interface TurnstileSiteverifyResponse {
  success: boolean
  'error-codes'?: string[]
}

/**
 * Verifies a Cloudflare Turnstile token server-side before allowing a
 * login/register attempt to proceed. Throws TurnstileVerificationError on
 * any failure (missing token, Cloudflare rejection, or network error).
 */
export async function verifyTurnstileToken(token: string | undefined, remoteIp?: string): Promise<void> {
  if (!token) {
    throw new TurnstileVerificationError('Captcha token is missing.')
  }

  if (!env.turnstile.secretKey) {
    // Fail closed in any environment where the secret isn't configured —
    // this is a setup problem, not something the user can work around.
    throw new TurnstileVerificationError('Captcha is not configured on the server.')
  }

  const body = new URLSearchParams({
    secret: env.turnstile.secretKey,
    response: token,
  })
  if (remoteIp) body.set('remoteip', remoteIp)

  let result: TurnstileSiteverifyResponse
  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    result = (await response.json()) as TurnstileSiteverifyResponse
  } catch {
    throw new TurnstileVerificationError('Could not reach the captcha verification service.')
  }

  if (!result.success) {
    throw new TurnstileVerificationError()
  }
}
