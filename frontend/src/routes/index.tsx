import { Route, Routes } from 'react-router-dom'
import Landing from '../pages/Landing'
import SignInPageRoute from '../pages/signin'
import SignUpPageRoute from '../pages/signup'
import ForgotPasswordPageRoute from '../pages/forgot-password'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<SignInPageRoute />} />
      <Route path="/signup" element={<SignUpPageRoute />} />
      <Route path="/forgot-password" element={<ForgotPasswordPageRoute />} />
    </Routes>
  )
}
