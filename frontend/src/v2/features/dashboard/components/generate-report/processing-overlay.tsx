import { useEffect, useState } from 'react'
import { WIZARD_AI_STEPS, WIZARD_PROCESSING_TITLE, type WizardRole } from './wizard-config'

// v2 reskin of figma's ProcessingOverlay (GenerateAppraisalPage.tsx lines 1806-1854,
// AI_STEPS.<role>). Figma advances every step on a fixed setTimeout since its data is
// fully mocked; v2's narrative/comparables/summary calls are real network requests, so
// only the first few steps are decorative — the final step ("Finalising report…") holds
// until `dataReady` actually flips true before calling onDone. Role-parameterized so
// every role's wizard reuses this one component instead of four near-duplicates — see
// figma-ui-migration-plan.md §9.7 A.1 / §10.1.

const DECORATIVE_STEP_DELAYS_MS = [900, 700, 1200, 900]
const FINAL_STEP_HOLD_MS = 500

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

type ProcessingOverlayV2Props = {
  role: WizardRole
  dataReady: boolean
  onDone: () => void
}

export function ProcessingOverlayV2({ role, dataReady, onDone }: ProcessingOverlayV2Props) {
  const steps = WIZARD_AI_STEPS[role]
  const title = WIZARD_PROCESSING_TITLE[role]
  const [stepIndex, setStepIndex] = useState(0)
  const lastStepIndex = steps.length - 1

  useEffect(() => {
    if (stepIndex >= DECORATIVE_STEP_DELAYS_MS.length) return
    const timer = setTimeout(() => setStepIndex((index) => index + 1), DECORATIVE_STEP_DELAYS_MS[stepIndex])
    return () => clearTimeout(timer)
  }, [stepIndex])

  useEffect(() => {
    if (stepIndex < lastStepIndex || !dataReady) return
    const timer = setTimeout(onDone, FINAL_STEP_HOLD_MS)
    return () => clearTimeout(timer)
  }, [stepIndex, lastStepIndex, dataReady, onDone])

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-black/5 bg-white px-10 py-14">
      <div className="h-14 w-14 animate-spin rounded-full border-4 border-relaive-primary/10 border-t-relaive-primary" />

      <div className="space-y-1 text-center">
        <p className="text-base font-semibold text-relaive-navy">{title}</p>
        <p className="text-sm text-relaive-gray">{steps[stepIndex]}</p>
      </div>

      <div className="w-64 space-y-2">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`flex items-center gap-2 text-xs transition-all ${
              index < stepIndex
                ? 'text-relaive-primary'
                : index === stepIndex
                  ? 'font-medium text-relaive-navy'
                  : 'text-relaive-gray/50'
            }`}
          >
            {index < stepIndex ? (
              <CheckIcon />
            ) : index === stepIndex ? (
              <span className="h-3 w-3 flex-shrink-0 animate-spin rounded-full border border-relaive-primary border-t-transparent" />
            ) : (
              <span className="h-3 w-3 flex-shrink-0 rounded-full border border-black/10" />
            )}
            {step}
          </div>
        ))}
      </div>
    </div>
  )
}
