import { useState } from 'react'
import { Card, CardTitle } from '../../../../../components/ui/card/card'
import { StepActions } from '../../../../../features/dashboard/components/generate-report/step-actions'
import { AffordabilityView } from '../affordability/affordability-view'
import { getAffordabilityInputs, setAffordabilityInputs } from '../affordability/affordability-scenario-store'

// v2 wizard-step wrapper for Buyer's extra "Affordability" step (figma: StepAffordability,
// only buyer's flow has this step — see figma-ui-migration-plan.md §10.1/§10.2). Thin: owns
// the inputs' persistence via affordability-scenario-store so the final report step can
// read the same values, renders the shared AffordabilityView core.

function CalculatorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M16 15h0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

type AffordabilityPanelProps = {
  onBack: () => void
  onContinue: () => void
}

export function AffordabilityPanelV2({ onBack, onContinue }: AffordabilityPanelProps) {
  const [inputs, setInputs] = useState(getAffordabilityInputs)

  function handleInputsChange(next: typeof inputs) {
    setInputs(next)
    setAffordabilityInputs(next)
  }

  return (
    <Card>
      <div className="flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8FD4D8] to-relaive-secondary-hover text-white shadow-md shadow-relaive-secondary/30">
          <CalculatorIcon />
        </span>
        <div>
          <CardTitle>Affordability</CardTitle>
          <p className="mt-0.5 text-sm text-relaive-gray">Model your borrowing capacity — results will be included in your report</p>
        </div>
      </div>

      <div className="mt-6">
        <AffordabilityView inputs={inputs} onInputsChange={handleInputsChange} />
      </div>

      <StepActions onBack={onBack} onContinue={onContinue} continueLabel="Next: Report Type" />
    </Card>
  )
}
