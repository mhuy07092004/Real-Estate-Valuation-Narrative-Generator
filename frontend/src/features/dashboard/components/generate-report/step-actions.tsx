import type { ReactNode } from 'react'
import { Button } from '../../../../components/ui/button/button'

type StepActionsProps = {
  onBack?: () => void
  onContinue?: () => void
  continueLabel?: ReactNode
  backLabel?: string
  continueDisabled?: boolean
}

export function StepActions({
  onBack,
  onContinue,
  continueLabel = 'Continue',
  backLabel = 'Back',
  continueDisabled = false,
}: StepActionsProps) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3 border-t border-black/5 pt-5">
      {onBack ? (
        <Button type="button" variant="outline" size="md" onClick={onBack}>
          {backLabel}
        </Button>
      ) : null}

      {onContinue ? (
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onContinue}
          disabled={continueDisabled}
          className="ml-auto"
        >
          {continueLabel}
        </Button>
      ) : null}
    </div>
  )
}
