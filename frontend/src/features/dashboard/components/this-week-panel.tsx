import { Link } from 'react-router-dom'
import { Card } from '../../../components/ui/card/card'
import type { DashboardThisWeekCopy } from '../utils/dashboard-copy'
import type { AgentThisWeek } from '../../../services/dashboard'

type ThisWeekPanelProps = {
  data: AgentThisWeek
  copy: DashboardThisWeekCopy
  className?: string
}

function MetricRow({
  label,
  current,
  total,
  barClassName,
  hideTotal = false,
}: {
  label: string
  current: number
  total: number
  barClassName: string
  hideTotal?: boolean
}) {
  const percent = total > 0 ? Math.min(100, (current / total) * 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-relaive-gray">{label}</p>
        <p className="text-sm font-semibold text-relaive-navy">
          {hideTotal ? current : `${current}/${total}`}
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/5">
        <div className={`h-full rounded-full ${barClassName}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function DotRow({
  label,
  value,
  dotClassName,
}: {
  label: string
  value: number
  dotClassName: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClassName}`} />
                  <p className="truncate text-sm text-black">{label}</p>
      </div>
      <p className="text-sm font-semibold text-relaive-navy">{value}</p>
    </div>
  )
}

export function ThisWeekPanel({ data, copy, className = '' }: ThisWeekPanelProps) {
  const isDots = copy.style === 'dots'

  return (
    <Card className={className}>
      <h3 className="text-lg font-semibold text-black sm:text-xl">{copy.title}</h3>
      <div className={isDots ? 'mt-5 flex flex-col gap-5' : 'mt-5 flex flex-col gap-4'}>
        {isDots ? (
          <>
            <DotRow
              label={copy.primaryLabel}
              value={data.reportsGenerated.current}
              dotClassName={copy.tertiaryLabel ? 'bg-relaive-navy' : 'bg-relaive-primary'}
            />
            <DotRow
              label={copy.secondaryLabel}
              value={data.appraisalsSent.current}
              dotClassName="bg-relaive-secondary"
            />
            {copy.tertiaryLabel && data.tertiary ? (
              <DotRow
                label={copy.tertiaryLabel}
                value={data.tertiary.current}
                dotClassName="bg-[#D4A574]"
              />
            ) : null}
          </>
        ) : (
          <>
            <MetricRow
              label={copy.primaryLabel}
              current={data.reportsGenerated.current}
              total={data.reportsGenerated.total}
              barClassName="bg-relaive-primary"
              hideTotal={copy.hideTotal}
            />
            <MetricRow
              label={copy.secondaryLabel}
              current={data.appraisalsSent.current}
              total={data.appraisalsSent.total}
              barClassName={copy.hideTotal ? 'bg-relaive-navy' : 'bg-relaive-secondary'}
              hideTotal={copy.hideTotal}
            />
          </>
        )}
      </div>
      {copy.viewAllLabel && copy.viewAllTo ? (
        <Link
          to={copy.viewAllTo}
          className="mt-5 inline-flex text-sm font-medium text-relaive-primary transition-colors hover:text-relaive-primary-hover"
        >
          {copy.viewAllLabel}
        </Link>
      ) : null}
    </Card>
  )
}
