import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'
import { SmoothScrollProvider } from './lib/smooth-scroll'

function App() {
  return (
    <BrowserRouter>
      <SmoothScrollProvider>
        <AppRoutes />
      </SmoothScrollProvider>
    </BrowserRouter>
  )
}

export default App
