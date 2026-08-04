import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './lib/gsap'
import './index.css'
import App from './App.tsx'

function shouldEnableMocks(): boolean {
  const url = new URL(window.location.href)
  const runtimeOverride = url.searchParams.get('mocks')

  // Backend integration mode is the default.
  // Mocks are enabled only when explicitly requested via `?mocks=true`.
  return runtimeOverride === 'true'
}

async function stopMockServerIfRegistered() {
  if (!('serviceWorker' in navigator)) return

  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(
    registrations
      .filter((registration) => registration.active?.scriptURL.includes('mockServiceWorker.js'))
      .map((registration) => registration.unregister()),
  )
}

async function bootstrap() {
  // Runtime URL override makes switching deterministic:
  // ?mocks=true  -> force mocks on
  // ?mocks=false -> force mocks off (real backend via proxy)
  if (shouldEnableMocks()) {
    const { startMockServer } = await import(
      './features/auth/mock/browser.ts'
    )
    await startMockServer()
  } else {
    // If mocks were enabled previously, remove stale worker so /api calls
    // go through Vite proxy to backend.
    await stopMockServerIfRegistered()
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

bootstrap()
