// Shared HTTP helper. Every service function resolves through this so swapping
// in a real backend only requires pointing at the same `/api/...` paths.

// In local dev this is left empty and Vite's dev proxy (see vite.config.ts)
// forwards relative `/api/...` calls to localhost:4000. In production, set
// VITE_API_BASE_URL (e.g. in the Vercel dashboard) to the deployed backend's
// origin, since there's no dev-proxy equivalent once both are deployed separately.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)

  if (!headers.has('Authorization') && typeof window !== 'undefined') {
    const rawSession = window.localStorage.getItem('relaive_auth')
    if (rawSession) {
      try {
        const parsed = JSON.parse(rawSession) as { accessToken?: string }
        if (parsed.accessToken) {
          headers.set('Authorization', `Bearer ${parsed.accessToken}`)
        }
      } catch {
        // Ignore malformed session values; caller will receive normal auth errors.
      }
    }
  }

  const url = `${API_BASE_URL}${path}`
  const response = await fetch(url, { ...init, headers })
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with status ${response.status}`)
  }
  return (await response.json()) as T
}
