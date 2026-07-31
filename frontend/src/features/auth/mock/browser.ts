import { setupWorker } from 'msw/browser'
import { dashboardHandlers } from '../../dashboard/mock/handlers'
import { authHandlers } from './handlers'

/**
 * MSW browser worker instance.
 * Registers all mock API handlers for the browser environment.
 */
export const worker = setupWorker(...authHandlers, ...dashboardHandlers)

/**
 * Conditionally start the MSW mock server.
 *
 * Only starts when `VITE_ENABLE_MOCKS` is set to `"true"`.
 * This allows developers to toggle between mock and real backend
 * without changing any application code.
 *
 * @example
 * // In main.tsx (already configured):
 * await startMockServer()
 *
 * @example
 * // Enable mocks via .env.development:
 * VITE_ENABLE_MOCKS=true
 *
 * // Disable mocks (use real backend):
 * VITE_ENABLE_MOCKS=false
 */
export async function startMockServer(): Promise<void> {
  const enableMocks = import.meta.env.VITE_ENABLE_MOCKS

  if (enableMocks !== 'true') {
    console.log(
      '%c[MSW] Mocking disabled — requests will go to real backend.',
      'color: #888; font-style: italic;'
    )
    return
  }

  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: false,
  })

  console.log(
    '%c[MSW] ✅ Mocking enabled — intercepting API requests.',
    'color: #4CAF50; font-weight: bold;'
  )
}
