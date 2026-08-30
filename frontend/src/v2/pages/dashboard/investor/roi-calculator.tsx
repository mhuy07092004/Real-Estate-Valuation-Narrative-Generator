import { useState } from 'react'
import { RoiAnalysisView } from '../../../features/dashboard/components/roi-analysis/roi-analysis-view'
import { getRoiScenario, setRoiScenario } from '../../../features/dashboard/components/roi-analysis/roi-scenario-store'

// New standalone page (net-new route, no v1 counterpart) — figma: ROICalculatorPage.tsx.
// Shares its core with the generate-report wizard's Investor ROI Analysis step via
// RoiAnalysisView (§4.5) rather than duplicating it. Pure client-side math, no backend
// endpoint — see figma-ui-migration-plan.md §10.2/§10.4 (the old /api/investor/roi-calculation
// mock endpoint is not used here, and is a candidate for retirement per backend/V2_BACKEND_TODO.md).
// Figma's page also had decorative "Save Scenario"/"Export" buttons with no real behavior
// wired anywhere — not ported, consistent with this project's no-fabrication rule.

export function RoiCalculatorPageV2() {
  const [scenario, setScenario] = useState(getRoiScenario)

  function handleScenarioChange(next: typeof scenario) {
    setScenario(next)
    setRoiScenario(next)
  }

  return (
    <div className="flex flex-col">
      <header className="font-sans px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
          ROI &amp; Cash Flow Calculator
        </h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">
          Analyse rental return, cash flow, and investment viability
        </p>
      </header>

      <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
        <RoiAnalysisView scenario={scenario} onScenarioChange={handleScenarioChange} />
      </div>
    </div>
  )
}
