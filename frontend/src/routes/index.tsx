import { Route, Routes, useParams, Navigate } from 'react-router-dom'
import Landing from '../pages/Landing'
import SignInPageRoute from '../pages/signin'
import SignUpPageRoute from '../pages/signup'
import ForgotPasswordPageRoute from '../pages/forgot-password'
import {
  DashboardLayout,
  DashboardRoleGuard,
  DashboardRoleHome,
  DashboardRoleRedirect,
  RoleGate,
} from '../pages/dashboard'
import MockPageRoute from '../pages/mock'
import { SearchProperty } from '../pages/dashboard/buyer/search-property'
import { SavedProperty } from '../pages/dashboard/saved-property'
import { Inspections } from '../pages/dashboard/buyer/inspections'
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
import { ComparableSales } from '../pages/dashboard/comparable-sales'
import { MarketComparison } from '../pages/dashboard/investor/market-comparision'
import { ProtectedRoute } from '../features/auth/components/protected-route'
import SharedReportPage from '../pages/shared-report'

function DashboardReport() {
  const { role } = useParams<{ role: string }>()
  if (role === 'investor') return <InvestorReport />
  if (role === 'valuer') return <ValuerReport />
  if (role === 'buyer') return <BuyerReport />
  return <AgentReport />
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
      <Route path="/about" element={<Navigate to="/" replace />} />
      <Route path="/features" element={<Navigate to="/" replace />} />
      <Route path="/plans" element={<Navigate to="/" replace />} />
      <Route path="/signin" element={<SignInPageRoute />} />
      <Route path="/signup" element={<SignUpPageRoute />} />
      <Route path="/forgot-password" element={<ForgotPasswordPageRoute />} />
      <Route path="/shared-report/:token" element={<SharedReportPage />} />
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
          <Route
            path="valuation-cases"
            element={
              <RoleGate role="valuer">
                <ValuationCases />
              </RoleGate>
            }
          />
          <Route
            path="clients"
            element={
              <RoleGate role="agent">
                <ClientAgent />
              </RoleGate>
            }
          />
          <Route path="market-insights" element={<DashboardMarketInsights />} />
          <Route path="suburb-explorer" element={<DashboardSuburbExplorer />} />
          <Route path="report" element={<DashboardReport />} />
          <Route
            path="evidence-centre"
            element={
              <RoleGate role="valuer">
                <ComparableSales emptyStateDescription="Search a property address to find comparable evidence" />
              </RoleGate>
            }
          />
          <Route
            path="search-properties"
            element={
              <RoleGate role="buyer">
                <SearchProperty />
              </RoleGate>
            }
          />
          <Route path="saved" element={<SavedProperty />} />
          <Route
            path="inspections"
            element={
              <RoleGate role="buyer">
                <Inspections />
              </RoleGate>
            }
          />
          <Route path="saved-properties" element={<SavedProperty />} />
          <Route path="saved-evidence" element={<SavedProperty />} />
          <Route path="settings" element={<Settings />} />
          <Route path="copilot" element={<Copilot />} />
          <Route
            path="roi-calculation"
            element={
              <RoleGate role="investor">
                <RoiCalculation />
              </RoleGate>
            }
          />
          <Route
            path="affortability-calculation"
            element={
              <RoleGate role="buyer">
                <AffordabilityCalculation />
              </RoleGate>
            }
          />
          <Route path="notifications" element={<NotificationPage />} />
          <Route path="generate-report" element={<GenerateReport />} />
          <Route path="comparable-sales" element={<ComparableSales />} />
          <Route
            path="market-comparison"
            element={
              <RoleGate role="investor">
                <MarketComparison />
              </RoleGate>
            }
          />
          <Route path="mock" element={<MockPageRoute />} />
        </Route>
      </Route>
    </Routes>
  )
}
