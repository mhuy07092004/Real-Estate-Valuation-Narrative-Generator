import { Route, Routes, useParams } from 'react-router-dom'
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
import { EvidenceCentre } from '../pages/dashboard/property-valuer/evidence-centre'
import { SearchProperty } from '../pages/dashboard/buyer/search-property'
import { SavedProperty } from '../pages/dashboard/buyer/saved-property'
import { ValuationCases } from '../pages/dashboard/property-valuer/valuation-cases'
import { ClientAgent } from '../pages/dashboard/real-estate-agent/client-agent'
import { AgentReport } from '../pages/dashboard/real-estate-agent/agent-report'
import { Settings } from '../pages/dashboard/settings'
import { Copilot } from '../pages/dashboard/copilot'
import { InvestorReport } from '../pages/dashboard/investor/investor-report'
import { ValuerReport } from '../pages/dashboard/property-valuer/valuer-report'
import { BuyerReport } from '../pages/dashboard/buyer/buyer-report'
import { RoiCalculation } from '../pages/dashboard/investor/ROI-calculation'
import { AffordabilityCalculation } from '../pages/dashboard/buyer/affortability-calculation'
import { ProtectedRoute } from '../features/auth/components/protected-route'

function DashboardReport() {
  const { role } = useParams<{ role: string }>()
  if (role === 'investor') return <InvestorReport />
  if (role === 'valuer') return <ValuerReport />
  if (role === 'buyer') return <BuyerReport />
  return <AgentReport />
}

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
          <Route path="valuation-cases" element={<ValuationCases />} />
          <Route path="clients" element={<ClientAgent />} />
          <Route path="report" element={<DashboardReport />} />
          <Route path="evidence-centre" element={<EvidenceCentre />} />
          <Route path="search-properties" element={<SearchProperty />} />
          <Route path="saved" element={<SavedProperty />} />
          <Route path="settings" element={<Settings />} />
          <Route path="copilot" element={<Copilot />} />
          <Route path="roi-calculation" element={<RoiCalculation />} />
          <Route path="affortability-calculation" element={<AffordabilityCalculation />} />
          <Route path="mock" element={<MockPageRoute />} />
        </Route>
      </Route>
    </Routes>
  )
}
