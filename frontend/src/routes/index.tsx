import { Route, Routes } from 'react-router-dom'
import Landing from '../pages/Landing'
import SignInPageRoute from '../pages/signin'
import SignUpPageRoute from '../pages/signup'
import ForgotPasswordPageRoute from '../pages/forgot-password'
import PlansPageRoute from '../pages/plans'
import Dashboard from '../pages/dashboard'
import { ProtectedRoute } from '../features/auth/components/protected-route'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/plans" element={<PlansPageRoute />} />
      <Route path="/signin" element={<SignInPageRoute />} />
      <Route path="/signup" element={<SignUpPageRoute />} />
      <Route path="/forgot-password" element={<ForgotPasswordPageRoute />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
