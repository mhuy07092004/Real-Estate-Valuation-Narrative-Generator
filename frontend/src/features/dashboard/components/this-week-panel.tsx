import { Card } from '../../../components/ui/card/card'
import type { AgentThisWeek } from '../../../services/dashboard'

type ThisWeekPanelProps = {
  data: AgentThisWeek
  className?: string
}

function MetricRow({
  label,
  current,
  total,
  barClassName,
}: {
  label: string
  current: number
  total: number
  barClassName: string
}) {
  const percent = total > 0 ? Math.min(100, (current / total) * 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-relaive-gray">{label}</p>
        <p className="text-sm font-semibold text-relaive-navy">
          {current}/{total}
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/5">
        <div className={`h-full rounded-full ${barClassName}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export function ThisWeekPanel({ data, className = '' }: ThisWeekPanelProps) {
  return (
    <Card className={className}>
      <h3 className="text-lg font-semibold text-black sm:text-xl">This Week</h3>
      <div className="mt-5 flex flex-col gap-4">
        <MetricRow
          label="Reports Generated"
          current={data.reportsGenerated.current}
          total={data.reportsGenerated.total}
          barClassName="bg-relaive-primary"
        />
        <MetricRow
          label="Appraisals Sent"
          current={data.appraisalsSent.current}
          total={data.appraisalsSent.total}
          barClassName="bg-relaive-secondary"
        />
      </div>
    </Card>
  )
}
