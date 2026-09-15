// Adaptive captcha scoring. A captcha is a tax on every honest user, so it is
// only demanded once a request starts looking automated: repeated failures
// against one account, repeated failures from one IP, a burst of attempts from
// one IP (credential spraying), or repeat signups from one IP.
//
// Counters are fixed windows held in this process's memory, so a restart
// forgives everyone and a multi-instance deploy scores each instance
// separately. Move to Redis before running more than one backend instance.

const MINUTE = 60_000

interface Rule {
  windowMs: number
  threshold: number
}

const RULES = {
  // Someone guessing one account's password.
  loginFailuresPerEmail: { windowMs: 15 * MINUTE, threshold: 3 },
  // Same, but from one source across any number of accounts. Higher threshold
  // because offices and mobile carriers share an IP behind NAT.
  loginFailuresPerIp: { windowMs: 15 * MINUTE, threshold: 8 },
  // Volume alone is suspicious even when the attempts "succeed" — no human
  // signs in this often from one address.
  loginAttemptsPerIp: { windowMs: MINUTE, threshold: 12 },
  // Bulk account creation.
  registrationsPerIp: { windowMs: 60 * MINUTE, threshold: 2 },
  // Duplicate-email responses are also how bots enumerate existing accounts.
  registerFailuresPerIp: { windowMs: 60 * MINUTE, threshold: 3 },
} satisfies Record<string, Rule>

interface Counter {
  count: number
  expiresAt: number
}

// Hard cap so a spray attack across many emails cannot grow the map forever.
const MAX_COUNTERS = 10_000

const counters = new Map<string, Counter>()

function prune(now: number): void {
  for (const [key, counter] of counters) {
    if (counter.expiresAt <= now) counters.delete(key)
  }
}

function read(key: string): number {
  const counter = counters.get(key)
  if (!counter) return 0
  if (counter.expiresAt <= Date.now()) {
    counters.delete(key)
    return 0
  }
  return counter.count
}

function bump(key: string, rule: Rule): void {
  const now = Date.now()
  const existing = counters.get(key)

  if (!existing || existing.expiresAt <= now) {
    if (counters.size >= MAX_COUNTERS) prune(now)
    counters.set(key, { count: 1, expiresAt: now + rule.windowMs })
    return
  }

  existing.count += 1
}

function exceeded(key: string, rule: Rule): boolean {
  return read(key) >= rule.threshold
}

const loginFailEmailKey = (email: string) => `login:fail:email:${email.trim().toLowerCase()}`
const loginFailIpKey = (ip: string) => `login:fail:ip:${ip}`
const loginAttemptIpKey = (ip: string) => `login:attempt:ip:${ip}`
const registerOkIpKey = (ip: string) => `register:ok:ip:${ip}`
const registerFailIpKey = (ip: string) => `register:fail:ip:${ip}`

export interface LoginRiskContext {
  ip?: string
  email?: string
}

export interface RegisterRiskContext {
  ip?: string
}

/** True when this sign-in attempt has to solve a captcha before being processed. */
export function isLoginCaptchaRequired({ ip, email }: LoginRiskContext): boolean {
  // Disabled on hold — TURNSTILE_SECRET_KEY isn't configured, so
  // verifyTurnstileToken always fails closed once this returns true,
  // permanently locking out anyone who trips the risk threshold. Uncomment
  // below once a real Turnstile secret is set.
  return false
  // if (email && exceeded(loginFailEmailKey(email), RULES.loginFailuresPerEmail)) return true
  // if (!ip) return false
  // return (
  //   exceeded(loginFailIpKey(ip), RULES.loginFailuresPerIp) ||
  //   exceeded(loginAttemptIpKey(ip), RULES.loginAttemptsPerIp)
  // )
}

/** Counts every sign-in request, successful or not, to catch attempt velocity. */
export function recordLoginAttempt({ ip }: LoginRiskContext): void {
  if (ip) bump(loginAttemptIpKey(ip), RULES.loginAttemptsPerIp)
}

export function recordLoginFailure({ ip, email }: LoginRiskContext): void {
  if (email) bump(loginFailEmailKey(email), RULES.loginFailuresPerEmail)
  if (ip) bump(loginFailIpKey(ip), RULES.loginFailuresPerIp)
}

/**
 * Clears failure history after a genuine sign-in so a user who simply mistyped
 * their password is not challenged on their next visit.
 */
export function recordLoginSuccess({ ip, email }: LoginRiskContext): void {
  if (email) counters.delete(loginFailEmailKey(email))
  if (ip) counters.delete(loginFailIpKey(ip))
}

/** True when this sign-up attempt has to solve a captcha before being processed. */
export function isRegisterCaptchaRequired({ ip }: RegisterRiskContext): boolean {
  // Disabled on hold — see isLoginCaptchaRequired above for why.
  return false
  // if (!ip) return false
  // return (
  //   exceeded(registerOkIpKey(ip), RULES.registrationsPerIp) ||
  //   exceeded(registerFailIpKey(ip), RULES.registerFailuresPerIp)
  // )
}

export function recordRegisterSuccess({ ip }: RegisterRiskContext): void {
  if (ip) bump(registerOkIpKey(ip), RULES.registrationsPerIp)
}

export function recordRegisterFailure({ ip }: RegisterRiskContext): void {
  if (ip) bump(registerFailIpKey(ip), RULES.registerFailuresPerIp)
}
