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
import { InvestorReportsV2 } from '../v2/pages/dashboard/investor/investor-reports'
import { RoiCalculatorPageV2 } from '../v2/pages/dashboard/investor/roi-calculator'
import { InvestmentIntelligencePageV2 } from '../v2/pages/dashboard/investor/investment-intelligence'
import { EvidenceCentrePageV2 } from '../v2/pages/dashboard/property-valuer/evidence-centre'
import { ValuationCasesV2 } from '../v2/pages/dashboard/property-valuer/valuation-cases'
import { AffordabilityCalculatorPageV2 } from '../v2/pages/dashboard/buyer/affordability-calculator'
import { SavedPropertiesPageV2 } from '../v2/pages/dashboard/buyer/saved-properties'
import { BuyerReportsV2 } from '../v2/pages/dashboard/buyer/buyer-reports'
import { SettingsPageV2 } from '../v2/pages/dashboard/settings'
import { NotificationsPageV2 } from '../v2/pages/dashboard/notifications'
import { CopilotPageV2 } from '../v2/pages/dashboard/copilot'
import { AuditTrailPageV2 } from '../v2/pages/dashboard/property-valuer/audit-trail'
import { ExplainableAIPageV2 } from '../v2/pages/dashboard/property-valuer/explainable-ai'
import { TeamWorkspacePageV2 } from '../v2/pages/dashboard/shared/team-workspace'
import { PropertyTimelinePageV2 } from '../v2/pages/dashboard/shared/property-timeline'
import { WatchlistPageV2 } from '../v2/pages/dashboard/investor/watchlist'
import { MarketComparisonPageV2 } from '../v2/pages/dashboard/investor/market-comparison'
import { SuburbExplorerPageV2 } from '../v2/pages/dashboard/shared-market/suburb-explorer'
import { ComparePropertiesPageV2 } from '../v2/pages/dashboard/buyer/compare-properties'
import { InspectionsPageV2 } from '../v2/pages/dashboard/buyer/inspections'
import { SharedSavedPropertiesPageV2 } from '../v2/pages/dashboard/shared/saved-properties'
import { SavedEvidencePageV2 } from '../v2/pages/dashboard/property-valuer/saved-evidence'

function DashboardReport() {
  const { role } = useParams<{ role: string }>()
  if (role === 'investor') return <VersionSwitch v1={<InvestorReport />} v2={<InvestorReportsV2 />} />
  if (role === 'valuer') return <ValuerReport />
  if (role === 'buyer') return <VersionSwitch v1={<BuyerReport />} v2={<BuyerReportsV2 />} />
  // Only Valuer has no v2 report page yet — see figma-ui-migration-plan.md §9/§10.
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
          <Route path="valuation-cases" element={<VersionSwitch v1={<ValuationCases />} v2={<ValuationCasesV2 />} />} />
          <Route path="clients" element={<VersionSwitch v1={<ClientAgent />} v2={<ClientsV2 />} />} />
          <Route path="report" element={<DashboardReport />} />
          <Route path="evidence-centre" element={<VersionSwitch v1={<EvidenceCentre />} v2={<EvidenceCentrePageV2 />} />} />
          <Route path="search-properties" element={<SearchProperty />} />
          <Route path="saved" element={<VersionSwitch v1={<SavedProperty />} v2={<SavedPropertiesPageV2 />} />} />
          <Route path="settings" element={<VersionSwitch v1={<Settings />} v2={<SettingsPageV2 />} />} />
          <Route path="copilot" element={<VersionSwitch v1={<Copilot />} v2={<CopilotPageV2 />} />} />
          <Route path="roi-calculation" element={<VersionSwitch v1={<RoiCalculation />} v2={<RoiCalculatorPageV2 />} />} />
          <Route path="affortability-calculation" element={<VersionSwitch v1={<AffordabilityCalculation />} v2={<AffordabilityCalculatorPageV2 />} />} />
          <Route path="notifications" element={<VersionSwitch v1={<NotificationPage />} v2={<NotificationsPageV2 />} />} />
          <Route path="generate-report" element={<VersionSwitch v1={<GenerateReport />} v2={<GenerateReportV2 />} />} />
          <Route path="comparable-sales" element={<ComparableSalesPageV2 />} />
          <Route path="investment-intelligence" element={<InvestmentIntelligencePageV2 />} />
          <Route path="market-intelligence" element={<MarketIntelligencePageV2 />} />
          <Route path="audit-trail" element={<AuditTrailPageV2 />} />
          <Route path="explainable-ai" element={<ExplainableAIPageV2 />} />
          <Route path="team" element={<TeamWorkspacePageV2 />} />
          <Route path="timeline" element={<PropertyTimelinePageV2 />} />
          <Route path="watchlist" element={<WatchlistPageV2 />} />
          <Route path="market-comparison" element={<MarketComparisonPageV2 />} />
          <Route path="suburb-explorer" element={<SuburbExplorerPageV2 />} />
          <Route path="compare-properties" element={<ComparePropertiesPageV2 />} />
          <Route path="inspections" element={<InspectionsPageV2 />} />
          <Route path="saved-properties" element={<SharedSavedPropertiesPageV2 />} />
          <Route path="saved-evidence" element={<SavedEvidencePageV2 />} />
          <Route path="mock" element={<MockPageRoute />} />
        </Route>
      </Route>
    </Routes>
  )
}
