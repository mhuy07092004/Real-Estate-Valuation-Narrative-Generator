import {
  AuthError,
  type ApiResponse,
  type AuthSession,
  type AuthTokenPayload,
  type LoginCredentials,
  type LoginResponseData,
  type RegisterCredentials,
} from '../types/auth'

const API_BASE = '/api/auth'
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

function toSession(body: ApiResponse<LoginResponseData>): AuthSession {
  if (!body.success) {
    throw new AuthError(body.message, body.errors)
  }

  return {
    user: body.data.user,
    accessToken: body.data.accessToken,
    refreshToken: body.data.refreshToken,
    expiresIn: body.data.expiresIn,
  }
}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

  const body = (await response.json()) as ApiResponse<LoginResponseData>
  const session = toSession(body)

  persistSession(session)
  return session
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
