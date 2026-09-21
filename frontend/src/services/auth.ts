import {
  AuthError,
  type ApiResponse,
  type AuthSession,
  type AuthTokenPayload,
  type LoginCredentials,
  type LoginResponseData,
  type RegisterCredentials,
  type User,
} from '../types/auth'
import { API_BASE_URL, fetchJson, getAccessToken } from './api-client'

// Not routed through fetchJson (api-client.ts) because these calls must never
// attach a stale Authorization header before a session exists — but they still
// need the same API_BASE_URL prefix so they hit the deployed backend, not
// whatever origin the frontend itself is served from.
const API_BASE = `${API_BASE_URL}/api/auth`
const SESSION_KEY = 'relaive_auth'

function decodeToken(token: string): AuthTokenPayload | null {
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null

    // JWT payload is base64url encoded, not standard base64.
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const payload = JSON.parse(atob(padded)) as AuthTokenPayload

    // JWT exp is seconds since epoch.
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

function isValidSession(session: AuthSession): boolean {
  return decodeToken(session.accessToken) !== null
}

function readValidSession(storage: Storage): AuthSession | null {
  const raw = storage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    const session = JSON.parse(raw) as AuthSession
    if (!isValidSession(session)) {
      storage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    storage.removeItem(SESSION_KEY)
    return null
  }
}

function resolveActiveStorage(): Storage | null {
  if (readValidSession(localStorage)) return localStorage
  if (readValidSession(sessionStorage)) return sessionStorage
  return null
}

export function getStoredSession(): AuthSession | null {
  const storage = resolveActiveStorage()
  return storage ? readValidSession(storage) : null
}

export function persistSession(session: AuthSession, remember = true): void {
  const target = remember ? localStorage : sessionStorage
  const other = remember ? sessionStorage : localStorage
  target.setItem(SESSION_KEY, JSON.stringify(session))
  other.removeItem(SESSION_KEY)
}

/** Merges an updated user into the stored session (e.g. after a profile edit). */
function persistSessionUser(user: AuthSession['user']): void {
  const storage = resolveActiveStorage()
  if (!storage) return
  const session = readValidSession(storage)
  if (!session) return
  storage.setItem(SESSION_KEY, JSON.stringify({ ...session, user }))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}

export function isAuthenticated(): boolean {
  return getStoredSession() !== null
}

function toSession(body: ApiResponse<LoginResponseData>): AuthSession {
  if (!body.success) {
    throw new AuthError(body.message, body.errors, body.captchaRequired)
  }

  return {
    user: body.data.user,
    accessToken: body.data.accessToken,
    refreshToken: body.data.refreshToken,
    expiresIn: body.data.expiresIn,
  }
}

export async function login(
  credentials: LoginCredentials,
  options?: { rememberMe?: boolean },
): Promise<AuthSession> {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

  const body = (await response.json()) as ApiResponse<LoginResponseData>
  const session = toSession(body)

  persistSession(session, options?.rememberMe ?? true)
  return session
}

export type UpdateProfileInput = {
  fullName: string
  phone?: string
  company?: string
}

export async function updateProfile(input: UpdateProfileInput): Promise<User> {
  const body = await fetchJson<ApiResponse<{ user: User }>>(`${API_BASE}/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!body.success) {
    throw new AuthError(body.message, body.errors)
  }

  persistSessionUser(body.data.user)
  return body.data.user
}

export async function sendOtp(email: string): Promise<void> {
  const response = await fetch(`${API_BASE}/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  const body = (await response.json()) as
    | { success: true }
    | { success: false; message: string; errors?: Record<string, string>; retryAfterSeconds?: number }
  if (!body.success) {
    throw new AuthError(body.message, body.errors)
  }
}

export async function register(credentials: RegisterCredentials): Promise<AuthSession> {
  const response = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

  const body = (await response.json()) as ApiResponse<LoginResponseData>
  const session = toSession(body)

  persistSession(session)
  return session
}

export async function selectRole(
  role: 'agent' | 'valuer' | 'investor' | 'buyer',
): Promise<AuthSession> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE}/select-role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ role }),
  })

  const body = (await response.json()) as ApiResponse<LoginResponseData>
  const session = toSession(body)

  persistSession(session, resolveActiveStorage() !== sessionStorage)
  return session
}
