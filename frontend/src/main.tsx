import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './lib/gsap'
import './index.css'
import App from './App.tsx'

async function bootstrap() {
  const enableMocks = import.meta.env.VITE_ENABLE_MOCKS === 'true'

  if (enableMocks) {
    const { startMockServer } = await import('./features/auth/mock/browser.ts')
    await startMockServer()
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

bootstrap()
