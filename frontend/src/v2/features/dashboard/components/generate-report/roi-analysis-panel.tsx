import { useState } from 'react'
import { Card, CardTitle } from '../../../../../components/ui/card/card'
import { StepActions } from '../../../../../features/dashboard/components/generate-report/step-actions'
import { RoiAnalysisView } from '../roi-analysis/roi-analysis-view'
import { getRoiScenario, setRoiScenario } from '../roi-analysis/roi-scenario-store'

// v2 wizard-step wrapper for Investor's extra "ROI Analysis" step (figma: StepROI, only
// investor's flow has this step — see figma-ui-migration-plan.md §10.1/§10.2). Thin: owns
// the scenario's persistence via roi-scenario-store so the final report step can read the
// same values, renders the shared RoiAnalysisView core.

function TrendingUpIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 19h16M6 16l4-5 3 3 5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 7h3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

type RoiAnalysisPanelProps = {
  onBack: () => void
  onContinue: () => void
}

export function RoiAnalysisPanelV2({ onBack, onContinue }: RoiAnalysisPanelProps) {
  const [scenario, setScenario] = useState(getRoiScenario)

  function handleScenarioChange(next: typeof scenario) {
    setScenario(next)
    setRoiScenario(next)
  }

  return (
    <Card>
      <div className="flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8FD4D8] to-relaive-secondary-hover text-white shadow-md shadow-relaive-secondary/30">
          <TrendingUpIcon />
        </span>
        <div>
          <CardTitle>ROI Analysis</CardTitle>
          <p className="mt-0.5 text-sm text-relaive-gray">Model the investment financials — results will be included in your report</p>
        </div>
      </div>

      <div className="mt-6">
        <RoiAnalysisView scenario={scenario} onScenarioChange={handleScenarioChange} />
      </div>

      <StepActions onBack={onBack} onContinue={onContinue} continueLabel="Next: Report Type" />
    </Card>
  )
}
