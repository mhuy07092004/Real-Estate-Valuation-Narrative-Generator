// Shared HTTP helper. Every service function resolves through this so swapping
// in a real backend only requires pointing at the same `/api/...` paths.

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

  const response = await fetch(path, { ...init, headers })
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`)
  }
  return (await response.json()) as T
}
