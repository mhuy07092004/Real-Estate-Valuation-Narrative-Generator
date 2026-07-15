import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'
import { AuthProvider } from './features/auth/hooks/use-auth'
import { SmoothScrollProvider } from './lib/smooth-scroll'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SmoothScrollProvider>
          <AppRoutes />
        </SmoothScrollProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
