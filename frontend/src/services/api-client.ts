// Placeholder for the real HTTP client. Every mock service function resolves
// through this helper so swapping in a real backend later only requires
// changing the function body (e.g. to `fetch(...)`), not any component.

export function simulateRequest<T>(data: T, delayMs = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delayMs))
}
