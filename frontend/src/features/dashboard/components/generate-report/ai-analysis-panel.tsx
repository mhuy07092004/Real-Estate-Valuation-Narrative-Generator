import { Card, CardTitle } from '../../../../components/ui/card/card'
import { Notification } from '../../../../components/notification/notification'
import { useAsyncData } from '../../../../hooks/use-async-data'
import {
  getAiAnalysisMetrics,
  getAiAnalysisSummaryNotification,
  type AiAnalysisMetric,
  type AiAnalysisMetricTone,
} from '../../../../services/common'
import { AiSparkleIcon } from './generate-report-icons'
import { StepActions } from './step-actions'

const TONE_STYLES: Record<AiAnalysisMetricTone, { value: string; bar: string }> = {
  blue: { value: 'text-relaive-primary', bar: 'bg-relaive-primary' },
  teal: { value: 'text-relaive-secondary', bar: 'bg-relaive-secondary' },
  orange: { value: 'text-orange-400', bar: 'bg-orange-300' },
  sky: { value: 'text-sky-600', bar: 'bg-sky-600' },
}

function MetricProgress({ metric }: { metric: AiAnalysisMetric }) {
  const styles = TONE_STYLES[metric.tone]

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-relaive-navy sm:text-[15px]">
          {metric.label}
        </span>
        <span className={`text-xl font-semibold tracking-tight sm:text-2xl ${styles.value}`}>
          {metric.value}
        </span>
      </div>
      <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${styles.bar}`}
          style={{ width: `${metric.value}%` }}
        />
      </div>
    </div>
  )
}

type AiAnalysisPanelProps = {
  onBack: () => void
  onContinue: () => void
}

export function AiAnalysisPanel({ onBack, onContinue }: AiAnalysisPanelProps) {
  const { data: summary } = useAsyncData(getAiAnalysisSummaryNotification, [])
  const { data: metrics } = useAsyncData(getAiAnalysisMetrics, [])

  return (
    <Card>
      <div className="flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8FD4D8] to-relaive-secondary-hover text-white shadow-md shadow-relaive-secondary/30">
          <AiSparkleIcon />
        </span>
        <div>
          <CardTitle>AI Property Analysis</CardTitle>
          <p className="mt-0.5 text-sm text-relaive-gray">Comprehensive property assessment</p>
        </div>
      </div>

      {summary ? (
        <Notification className="mt-6">
          <p className="font-semibold">{summary.title}</p>
          <p className="mt-1">{summary.message}</p>
        </Notification>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
        {(metrics ?? []).map((metric) => (
          <MetricProgress key={metric.id} metric={metric} />
        ))}
      </div>

      <StepActions onBack={onBack} onContinue={onContinue} />
    </Card>
  )
}
