import { Route, Routes, useParams, Navigate } from 'react-router-dom'
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
import { MarketInsights as AgentMarketInsights } from '../pages/dashboard/real-estate-agent/market-insights'
import { MarketInsights as ValuerMarketInsights } from '../pages/dashboard/property-valuer/market-insights'
import { SuburbExplorer as InvestorSuburbExplorer } from '../pages/dashboard/investor/suburb-explorer'
import { SuburbExplorer as BuyerSuburbExplorer } from '../pages/dashboard/buyer/subrub-explorer'
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
import { ComparableSales as AgentComparableSales } from '../pages/dashboard/real-estate-agent/comparable-sales'
import { SavedProperties as AgentSavedProperties } from '../pages/dashboard/real-estate-agent/saved-properties'
import { SavedProperties as InvestorSavedProperties } from '../pages/dashboard/investor/saved-properties'
import { SavedEvidence } from '../pages/dashboard/property-valuer/saved-evidence'
import { ComparableSales as InvestorComparableSales } from '../pages/dashboard/investor/comparable-sales'
import { ComparableSales as BuyerComparableSales } from '../pages/dashboard/buyer/comparable-sales'
import { ProtectedRoute } from '../features/auth/components/protected-route'

function DashboardReport() {
  const { role } = useParams<{ role: string }>()
  if (role === 'investor') return <InvestorReport />
  if (role === 'valuer') return <ValuerReport />
  if (role === 'buyer') return <BuyerReport />
  return <AgentReport />
}

function DashboardComparableSales() {
  const { role } = useParams<{ role: string }>()
  if (role === 'investor') return <InvestorComparableSales />
  if (role === 'buyer') return <BuyerComparableSales />
  return <AgentComparableSales />
}

function DashboardSavedProperties() {
  const { role } = useParams<{ role: string }>()
  if (role === 'investor') return <InvestorSavedProperties />
  return <AgentSavedProperties />
}

function DashboardMarketInsights() {
  const { role } = useParams<{ role: string }>()
  if (role === 'valuer') return <ValuerMarketInsights />
  if (role === 'agent') return <AgentMarketInsights />
  return <Navigate to={`/dashboard/${role ?? 'agent'}`} replace />
}

function DashboardSuburbExplorer() {
  const { role } = useParams<{ role: string }>()
  if (role === 'investor') return <InvestorSuburbExplorer />
  if (role === 'buyer') return <BuyerSuburbExplorer />
  return <Navigate to={`/dashboard/${role ?? 'buyer'}`} replace />
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
          <Route path="clients" element={<ClientAgent />} />
          <Route path="market-insights" element={<DashboardMarketInsights />} />
          <Route path="suburb-explorer" element={<DashboardSuburbExplorer />} />
          <Route path="report" element={<DashboardReport />} />
          <Route path="evidence-centre" element={<EvidenceCentre />} />
          <Route path="search-properties" element={<SearchProperty />} />
          <Route path="saved" element={<SavedProperty />} />
          <Route path="saved-properties" element={<DashboardSavedProperties />} />
          <Route path="saved-evidence" element={<SavedEvidence />} />
          <Route path="settings" element={<Settings />} />
          <Route path="copilot" element={<Copilot />} />
          <Route path="roi-calculation" element={<RoiCalculation />} />
          <Route path="affortability-calculation" element={<AffordabilityCalculation />} />
          <Route path="notifications" element={<NotificationPage />} />
          <Route path="generate-report" element={<GenerateReport />} />
          <Route path="comparable-sales" element={<DashboardComparableSales />} />
          <Route path="mock" element={<MockPageRoute />} />
        </Route>
      </Route>
    </Routes>
  )
}
