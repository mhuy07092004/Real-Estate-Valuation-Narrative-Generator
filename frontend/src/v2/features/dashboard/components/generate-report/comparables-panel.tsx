import { Card, CardTitle } from '../../../../../components/ui/card/card'
import { useAsyncData } from '../../../../../hooks/use-async-data'
import { getComparableSalesV2 } from '../../../../../v2/services/common'
import { BuildingIcon } from '../../../../../features/dashboard/components/generate-report/generate-report-icons'
import { StepActions } from '../../../../../features/dashboard/components/generate-report/step-actions'
import { ComparableSalesView } from '../comparable-sales/comparable-sales-view'
import type { WizardRole } from './wizard-config'

// v2 wizard-step wrapper — thin: fetches (address already set by step 1) and renders the
// shared ComparableSalesView core in compact mode. Role-aware title only: figma's Step2
// renders this exact same step for Valuer too, just titled "Evidence Centre" (isValuer
// title swap in GenerateAppraisalPage.tsx) — everything else about the step is identical
// across roles. See §4.5/§9.1/§10.2.

type ComparablesPanelProps = {
  role?: WizardRole
  onBack: () => void
  onContinue: () => void
}

export function ComparablesPanelV2({ role = 'agent', onBack, onContinue }: ComparablesPanelProps) {
  const { data: sales } = useAsyncData(getComparableSalesV2, [])
  const isValuer = role === 'valuer'

  return (
    <Card>
      <div className="flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8FD4D8] to-relaive-secondary-hover text-white shadow-md shadow-relaive-secondary/30">
          <BuildingIcon />
        </span>
        <div>
          <CardTitle>{isValuer ? 'Evidence Centre' : 'Comparable Sales'}</CardTitle>
          <p className="mt-0.5 text-sm text-relaive-gray">
            {isValuer ? 'Selected evidence records' : 'Selected similar properties'}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <ComparableSalesView sales={sales ?? []} variant="compact" />
      </div>

      <StepActions onBack={onBack} onContinue={onContinue} />
    </Card>
  )
}
