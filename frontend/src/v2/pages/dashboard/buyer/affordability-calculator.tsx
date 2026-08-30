import { useState } from 'react'
import { AffordabilityView } from '../../../features/dashboard/components/affordability/affordability-view'
import { getAffordabilityInputs, setAffordabilityInputs } from '../../../features/dashboard/components/affordability/affordability-scenario-store'

// New standalone page (v1 counterpart exists but has broken/mismatched inputs, see
// figma-ui-migration-plan.md §10 research — not a reskin base) — figma: AffordabilityPage.tsx.
// Shares its core with the generate-report wizard's Buyer Affordability step via
// AffordabilityView (§4.5) rather than duplicating it. Pure client-side math, no backend
// endpoint — the old /api/buyer/affordability-calculation mock endpoint returns
// investor-ROI-shaped data and isn't used here (candidate for retirement per
// backend/V2_BACKEND_TODO.md).

export function AffordabilityCalculatorPageV2() {
  const [inputs, setInputs] = useState(getAffordabilityInputs)

  function handleInputsChange(next: typeof inputs) {
    setInputs(next)
    setAffordabilityInputs(next)
  }

  return (
    <div className="flex flex-col">
      <header className="font-sans px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">Affordability Calculator</h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">Estimate your borrowing capacity and monthly repayments</p>
      </header>

      <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
        <AffordabilityView inputs={inputs} onInputsChange={handleInputsChange} />
      </div>
    </div>
  )
}
