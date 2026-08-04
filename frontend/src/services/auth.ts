import {
  AuthError,
  type ApiResponse,
  type AuthSession,
  type AuthTokenPayload,
  type LoginCredentials,
  type LoginResponseData,
  type RegisterCredentials,
  type RegisterResponseData,
} from '../types/auth'

// Frontend auth transport + session persistence layer.
const API_BASE = '/api/auth'
const SESSION_KEY = 'relaive_auth'

function decodeToken(token: string): AuthTokenPayload | null {
  function normalizePayload(payload: AuthTokenPayload): AuthTokenPayload | null {
    // Legacy browser mocks used ms timestamps; JWT uses epoch seconds.
    const expiresAtMs = payload.exp > 1_000_000_000_000 ? payload.exp : payload.exp * 1000
    if (expiresAtMs < Date.now()) return null
    return payload
  }

  // Legacy mock token format: base64(JSON payload)
  try {
    const payload = JSON.parse(atob(token)) as AuthTokenPayload
    const normalized = normalizePayload(payload)
    if (normalized) return normalized
  } catch {
    // Fall through to JWT format parser below.
  }

  // JWT format: header.payload.signature
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = payloadBase64.padEnd(Math.ceil(payloadBase64.length / 4) * 4, '=')
    const payload = JSON.parse(atob(padded)) as AuthTokenPayload
    return normalizePayload(payload)
  } catch {
    return null
  }
}

// Session is considered valid when the access token can be decoded and is unexpired.
function isValidSession(session: AuthSession): boolean {
  return decodeToken(session.accessToken) !== null
}

export function getStoredSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    const session = JSON.parse(raw) as AuthSession
    if (!isValidSession(session)) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function persistSession(session: AuthSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function isAuthenticated(): boolean {
  return getStoredSession() !== null
}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

  const body = (await response.json()) as ApiResponse<LoginResponseData>

  if (!body.success) {
    throw new AuthError(body.message, body.errors)
  }

  const session: AuthSession = {
    user: body.data.user,
    accessToken: body.data.accessToken,
    refreshToken: body.data.refreshToken,
    expiresIn: body.data.expiresIn,
  }

  persistSession(session)
  return session
}

// Register returns the same session payload shape as login.
export async function register(credentials: RegisterCredentials): Promise<AuthSession> {
  const response = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

  const body = (await response.json()) as ApiResponse<RegisterResponseData>

  if (!body.success) {
    throw new AuthError(body.message, body.errors)
  }

  const session: AuthSession = {
    user: body.data.user,
    accessToken: body.data.accessToken,
    refreshToken: body.data.refreshToken,
    expiresIn: body.data.expiresIn,
  }

  persistSession(session)
  return session
}
