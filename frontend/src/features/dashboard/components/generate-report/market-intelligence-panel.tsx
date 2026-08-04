import { Card, CardTitle } from '../../../../components/ui/card/card'
import { useAsyncData } from '../../../../hooks/use-async-data'
import {
  getDemandSignals,
  getSuburbOverview,
  type DemandSignal,
  type DemandSignalTone,
  type SuburbOverviewMetric,
} from '../../../../services/common'
import { ChartTrendIcon } from './generate-report-icons'
import { StepActions } from './step-actions'

const SIGNAL_STYLES: Record<DemandSignalTone, { bar: string; label: string }> = {
  high: { bar: 'bg-emerald-500', label: 'text-emerald-600' },
  medium: { bar: 'bg-orange-400', label: 'text-orange-500' },
  strong: { bar: 'bg-emerald-500', label: 'text-emerald-600' },
}

function SuburbOverviewRow({ metric }: { metric: SuburbOverviewMetric }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-black/5 py-3 last:border-b-0">
      <span className="text-sm text-relaive-gray sm:text-[15px]">{metric.label}</span>
      <span
        className={`text-sm font-semibold sm:text-[15px] ${
          metric.tone === 'positive' ? 'text-emerald-600' : 'text-relaive-navy'
        }`}
      >
        {metric.value}
      </span>
    </div>
  )
}

function DemandSignalRow({ signal }: { signal: DemandSignal }) {
  const styles = SIGNAL_STYLES[signal.tone]

  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-relaive-navy sm:text-[15px]">{signal.label}</span>
        <span className={`text-sm font-semibold ${styles.label}`}>{signal.level}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${styles.bar}`}
          style={{ width: `${signal.percent}%` }}
        />
      </div>
    </div>
  )
}

type MarketIntelligencePanelProps = {
  onBack: () => void
  onContinue: () => void
}

export function MarketIntelligencePanel({ onBack, onContinue }: MarketIntelligencePanelProps) {
  const { data: suburbOverview } = useAsyncData(getSuburbOverview, [])
  const { data: demandSignals } = useAsyncData(getDemandSignals, [])

  return (
    <Card>
      <div className="flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8FD4D8] to-relaive-secondary-hover text-white shadow-md shadow-relaive-secondary/30">
          <ChartTrendIcon />
        </span>
        <div>
          <CardTitle>Market Intelligence</CardTitle>
          <p className="mt-0.5 text-sm text-relaive-gray">Suburb analytics and trends</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold text-relaive-navy sm:text-base">Suburb Overview</h4>
          <div className="mt-2">
            {(suburbOverview ?? []).map((metric) => (
              <SuburbOverviewRow key={metric.id} metric={metric} />
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-relaive-navy sm:text-base">Demand Signals</h4>
          <div className="mt-2">
            {(demandSignals ?? []).map((signal) => (
              <DemandSignalRow key={signal.id} signal={signal} />
            ))}
          </div>
        </div>
      </div>

      <StepActions onBack={onBack} onContinue={onContinue} />
    </Card>
  )
}
