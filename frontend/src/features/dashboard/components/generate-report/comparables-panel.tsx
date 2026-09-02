import { Card, CardTitle } from '../../../../components/ui/card/card'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getComparableSales } from '../../../../services/common'
import { ComparableSaleRow } from '../comparable-sale-row'
import { BuildingIcon } from './generate-report-icons'
import { StepActions } from './step-actions'

type ComparablesPanelProps = {
  onBack: () => void
  onContinue: () => void
}

export function ComparablesPanel({ onBack, onContinue }: ComparablesPanelProps) {
  const { data: sales } = useAsyncData(getComparableSales, [])

  return (
    <Card>
      <div className="flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8FD4D8] to-relaive-secondary-hover text-white shadow-md shadow-relaive-secondary/30">
          <BuildingIcon />
        </span>
        <div>
          <CardTitle>Comparable Sales</CardTitle>
          <p className="mt-0.5 text-sm text-relaive-gray">Selected similar properties</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {(sales ?? []).map((sale) => (
          <ComparableSaleRow key={sale.id} sale={sale} />
        ))}
      </div>

      <StepActions onBack={onBack} onContinue={onContinue} />
    </Card>
  )
}
