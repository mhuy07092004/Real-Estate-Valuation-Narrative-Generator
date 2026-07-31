// Shared HTTP helper. Every service function resolves through this so swapping
// in a real backend only requires pointing at the same `/api/...` paths.

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`)
  }
  return (await response.json()) as T
}
