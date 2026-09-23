// Shared HTTP helper. Every service function resolves through this so swapping
// in a real backend only requires pointing at the same `/api/...` paths.

// In local dev this is left empty and Vite's dev proxy (see vite.config.ts)
// forwards relative `/api/...` calls to localhost:4000. In production, set
// VITE_API_BASE_URL (e.g. in the Vercel dashboard) to the deployed backend's
// origin, since there's no dev-proxy equivalent once both are deployed separately.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

// Reads the access token from wherever "Remember me" put the session:
// localStorage (remembered) or sessionStorage (this tab only).
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  for (const storage of [window.localStorage, window.sessionStorage]) {
    const rawSession = storage.getItem('relaive_auth')
    if (!rawSession) continue
    try {
      const parsed = JSON.parse(rawSession) as { accessToken?: string }
      if (parsed.accessToken) return parsed.accessToken
    } catch {
      // Ignore malformed session values; caller will receive normal auth errors.
    }
  }
  return null
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)

  if (!headers.has('Authorization')) {
    const token = getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const url = `${API_BASE_URL}${path}`
  const response = await fetch(url, { ...init, headers })
  if (!response.ok) {
    // Prefer the backend's own { success: false, message } body when present —
    // a generic "failed with status N" hides the actual reason (validation
    // error, upstream service failure, etc.) that the backend already knew.
    const body = await response.json().catch(() => null)
    const message = body && typeof body === 'object' && 'message' in body ? String(body.message) : null
    throw new Error(message ?? `Request to ${url} failed with status ${response.status}`)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}
