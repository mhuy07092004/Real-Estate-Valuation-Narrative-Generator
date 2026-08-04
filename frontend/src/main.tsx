import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './lib/gsap'
import './index.css'
import App from './App.tsx'

async function bootstrap() {
  // Start MSW mock server in development when VITE_ENABLE_MOCKS=true
  if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    const { startMockServer } = await import(
      './features/auth/mock/browser.ts'
    )
    await startMockServer()
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

bootstrap()
