import { Card, CardTitle } from '../../../../../components/ui/card/card'
import { useAsyncData } from '../../../../../hooks/use-async-data'
import { getMarketMetrics } from '../../../../services/common'
import { ChartTrendIcon } from '../../../../../features/dashboard/components/generate-report/generate-report-icons'
import { StepActions } from '../../../../../features/dashboard/components/generate-report/step-actions'
import { MarketIntelligenceView } from '../market-intelligence/market-intelligence-view'

// v2 wizard-step wrapper — thin: fetches (address already set by step 1) and
// renders the shared MarketIntelligenceView core in compact mode. See §4.5/§9.1.

type MarketIntelligencePanelProps = {
  onBack: () => void
  onContinue: () => void
}

export function MarketIntelligencePanelV2({ onBack, onContinue }: MarketIntelligencePanelProps) {
  const { data } = useAsyncData(getMarketMetrics, [])

  return (
    <Card>
      <div className="flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8FD4D8] to-relaive-secondary-hover text-white shadow-md shadow-relaive-secondary/30">
          <ChartTrendIcon />
        </span>
        <div>
          <CardTitle>Market Intelligence</CardTitle>
          <p className="mt-0.5 text-sm text-relaive-gray">Current market data for your suburb</p>
        </div>
      </div>

      <div className="mt-6">
        <MarketIntelligenceView metrics={data?.metrics ?? []} priceTrend={data?.priceTrend ?? []} variant="compact" />
      </div>

      <StepActions onBack={onBack} onContinue={onContinue} />
    </Card>
  )
}
