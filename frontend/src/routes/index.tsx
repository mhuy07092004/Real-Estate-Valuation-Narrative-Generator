import { Route, Routes, useParams } from 'react-router-dom'
import Landing from '../pages/Landing'
import SignInPageRoute from '../pages/signin'
import SignUpPageRoute from '../pages/signup'
import ForgotPasswordPageRoute from '../pages/forgot-password'
import PlansPageRoute from '../pages/plans'
import AboutPageRoute from '../pages/about'
import FeaturesPageRoute from '../pages/features'
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
import { NotificationPage } from '../pages/dashboard/notification'
import { GenerateReport } from '../pages/dashboard/generate-report'
import { ProtectedRoute } from '../features/auth/components/protected-route'
import { VersionSwitch } from '../v2/VersionSwitch'
import { ClientsV2 } from '../v2/pages/dashboard/real-estate-agent/clients'
import { AgentReportV2 } from '../v2/pages/dashboard/real-estate-agent/agent-report'
import { GenerateReportV2 } from '../v2/pages/dashboard/generate-report'
import { ComparableSalesPageV2 } from '../v2/pages/dashboard/real-estate-agent/comparable-sales'
import { MarketIntelligencePageV2 } from '../v2/pages/dashboard/real-estate-agent/market-intelligence'

function DashboardReport() {
  const { role } = useParams<{ role: string }>()
  if (role === 'investor') return <InvestorReport />
  if (role === 'valuer') return <ValuerReport />
  if (role === 'buyer') return <BuyerReport />
  // Only the agent role has a v2 report page so far — see figma-ui-migration-plan.md §9.
  return <VersionSwitch v1={<AgentReport />} v2={<AgentReportV2 />} />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/plans" element={<PlansPageRoute />} />
      <Route path="/about" element={<AboutPageRoute />} />
      <Route path="/features" element={<FeaturesPageRoute />} />
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
          <Route path="clients" element={<VersionSwitch v1={<ClientAgent />} v2={<ClientsV2 />} />} />
          <Route path="report" element={<DashboardReport />} />
          <Route path="evidence-centre" element={<EvidenceCentre />} />
          <Route path="search-properties" element={<SearchProperty />} />
          <Route path="saved" element={<SavedProperty />} />
          <Route path="settings" element={<Settings />} />
          <Route path="copilot" element={<Copilot />} />
          <Route path="roi-calculation" element={<RoiCalculation />} />
          <Route path="affortability-calculation" element={<AffordabilityCalculation />} />
          <Route path="notifications" element={<NotificationPage />} />
          <Route path="generate-report" element={<VersionSwitch v1={<GenerateReport />} v2={<GenerateReportV2 />} />} />
          <Route path="comparable-sales" element={<ComparableSalesPageV2 />} />
          <Route path="market-intelligence" element={<MarketIntelligencePageV2 />} />
          <Route path="mock" element={<MockPageRoute />} />
        </Route>
      </Route>
    </Routes>
  )
}
