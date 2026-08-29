import { Link } from 'react-router-dom'
import { Card } from '../../../components/ui/card/card'
import type { AgentPipeline } from '../../../services/dashboard'

type AppraisalPipelinePanelProps = {
  data: AgentPipeline
  className?: string
}

const STAGES: Array<{
  key: keyof AgentPipeline
  label: string
  barClassName: string
}> = [
  { key: 'prospecting', label: 'Prospecting', barClassName: 'bg-[#4A5568]' },
  { key: 'appraisalSent', label: 'Appraisal Sent', barClassName: 'bg-relaive-secondary' },
  { key: 'listing', label: 'Listing', barClassName: 'bg-relaive-primary' },
  { key: 'sold', label: 'Sold', barClassName: 'bg-relaive-navy' },
]

export function AppraisalPipelinePanel({ data, className = '' }: AppraisalPipelinePanelProps) {
  const maxCount = Math.max(data.prospecting, data.appraisalSent, data.listing, data.sold, 0)

  return (
    <Card className={className}>
      <h3 className="text-lg font-semibold text-black sm:text-xl">Appraisal Pipeline</h3>
      <div className="mt-5 flex flex-col gap-4">
        {STAGES.map((stage) => {
          const count = data[stage.key]
          const percent = maxCount > 0 ? Math.min(100, (count / maxCount) * 100) : 0

          return (
            <div key={stage.key}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-relaive-gray">{stage.label}</p>
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
      <Link
        to="/dashboard/agent/clients"
        className="mt-5 inline-flex text-sm font-medium text-relaive-primary transition-colors hover:text-relaive-primary-hover"
      >
        View all clients →
      </Link>
    </Card>
  )
}
