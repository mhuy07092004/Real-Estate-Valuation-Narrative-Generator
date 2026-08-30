import { Link } from 'react-router-dom'
import { Card } from '../../../components/ui/card/card'
import type { DashboardPipelineCopy } from '../utils/dashboard-copy'
import type { AgentPipeline } from '../../../services/dashboard'

type AppraisalPipelinePanelProps = {
  data: AgentPipeline
  copy: DashboardPipelineCopy
  className?: string
  layout?: 'bars' | 'legend' | 'signals' | 'metrics'
}

const STAGE_STYLES: Array<{
  key: keyof AgentPipeline
  barClassName: string
  dotClassName: string
  signalToneClassName: string
  unit: string
}> = [
  {
    key: 'prospecting',
    barClassName: 'bg-[#4A5568]',
    dotClassName: 'bg-relaive-secondary',
    signalToneClassName: 'text-green-600',
    unit: '%',
  },
  {
    key: 'appraisalSent',
    barClassName: 'bg-relaive-secondary',
    dotClassName: 'bg-relaive-primary',
    signalToneClassName: 'text-green-600',
    unit: '%',
  },
  {
    key: 'listing',
    barClassName: 'bg-relaive-primary',
    dotClassName: 'bg-[#D4A574]',
    signalToneClassName: 'text-green-600',
    unit: '%',
  },
  {
    key: 'sold',
    barClassName: 'bg-relaive-navy',
    dotClassName: 'bg-relaive-navy',
    signalToneClassName: 'text-orange-500',
    unit: ' listings',
  },
]

export function AppraisalPipelinePanel({
  data,
  copy,
  className = '',
  layout = 'bars',
}: AppraisalPipelinePanelProps) {
  const maxCount = Math.max(data.prospecting, data.appraisalSent, data.listing, data.sold, 0)
  const isLegend = layout === 'legend'
  const isSignals = layout === 'signals'
  const isMetrics = layout === 'metrics'

  return (
    <Card className={className}>
      <h3 className="text-lg font-semibold text-black sm:text-xl">{copy.title}</h3>
      <div className={isLegend || isSignals || isMetrics ? 'mt-5 flex flex-col gap-5' : 'mt-5 flex flex-col gap-4'}>
        {STAGE_STYLES.map((stage) => {
          const count = data[stage.key]
          const percent = maxCount > 0 ? Math.min(100, (count / maxCount) * 100) : 0
          const label = copy[stage.key]
          if (!label) return null

          if (isMetrics) {
            return (
              <div key={stage.key} className="flex items-center justify-between gap-3">
                <p className="truncate text-sm text-relaive-gray">{label}</p>
                <div className="flex shrink-0 items-center gap-2">
                  <p className="text-sm font-semibold text-black">{copy.values?.[stage.key] ?? count}</p>
                  {copy.trends?.[stage.key] ? (
                    <span className="text-sm font-medium text-green-600">{copy.trends[stage.key]}</span>
                  ) : null}
                </div>
              </div>
            )
          }

          if (isSignals) {
            const subtitle = copy.subtitles?.[stage.key]
            return (
              <div key={stage.key} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-relaive-navy">{copy[stage.key]}</p>
                  {subtitle ? (
                    <p className="mt-0.5 truncate text-xs text-relaive-primary">{subtitle}</p>
                  ) : null}
                </div>
                <p className={`shrink-0 text-sm font-semibold ${stage.signalToneClassName}`}>
                  {count >= 0 ? '+' : ''}
                  {count}
                  {stage.unit}
                </p>
              </div>
            )
          }

          if (isLegend) {
            return (
              <div key={stage.key} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${stage.dotClassName}`} />
                  <p className="truncate text-sm text-relaive-gray">{copy[stage.key]}</p>
                </div>
                <p className="text-sm font-semibold text-relaive-navy">{count}</p>
              </div>
            )
          }

          return (
            <div key={stage.key}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-relaive-gray">{copy[stage.key]}</p>
                <p className="text-sm font-semibold text-relaive-navy">{count}</p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/5">
                <div
                  className={`h-full rounded-full ${stage.barClassName}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      {isLegend ? null : (
        <Link
          to={copy.viewAllTo}
          className="mt-5 inline-flex text-sm font-medium text-relaive-primary transition-colors hover:text-relaive-primary-hover"
        >
          {copy.viewAllLabel}
        </Link>
      )}
    </Card>
  )
}
