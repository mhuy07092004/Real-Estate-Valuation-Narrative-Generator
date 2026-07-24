import { Route, Routes } from 'react-router-dom'
import Landing from '../pages/Landing'
import SignInPageRoute from '../pages/signin'
import SignUpPageRoute from '../pages/signup'
import ForgotPasswordPageRoute from '../pages/forgot-password'
import PlansPageRoute from '../pages/plans'
import AboutPageRoute from '../pages/about'
import {
  DashboardLayout,
  DashboardRoleGuard,
  DashboardRoleHome,
  DashboardRoleRedirect,
} from '../pages/dashboard'
import MockPageRoute from '../pages/mock'
import ValuationCasesPageRoute from '../pages/valuation-cases'
import { ProtectedRoute } from '../features/auth/components/protected-route'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/plans" element={<PlansPageRoute />} />
      <Route path="/about" element={<AboutPageRoute />} />
      <Route path="/signin" element={<SignInPageRoute />} />
      <Route path="/signup" element={<SignUpPageRoute />} />
      <Route path="/forgot-password" element={<ForgotPasswordPageRoute />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardRoleRedirect />} />
        <Route path=":role" element={<DashboardRoleGuard />}>
          <Route index element={<DashboardRoleHome />} />
          <Route path="valuation-cases" element={<ValuationCasesPageRoute />} />
          <Route path="mock" element={<MockPageRoute />} />
        </Route>
      </Route>
    </Routes>
  )
}
