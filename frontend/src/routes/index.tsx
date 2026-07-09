import { Route, Routes } from 'react-router-dom'
import Landing from '../pages/Landing'
import SignInPageRoute from '../pages/signin'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<SignInPageRoute />} />
    </Routes>
  )
}
