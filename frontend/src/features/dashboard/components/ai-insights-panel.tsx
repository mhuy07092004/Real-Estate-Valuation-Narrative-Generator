import { Card, CardTitle } from '../../../components/ui/card/card'

export type InsightBadgeTone = 'teal' | 'orange' | 'blue'

export type AiInsight = {
  id: string
  title: string
  description: string
  badge: string
  tone: InsightBadgeTone
}

type AiInsightsPanelProps = {
  insights: AiInsight[]
  className?: string
}

const BADGE_STYLES: Record<InsightBadgeTone, string> = {
  teal: 'bg-relaive-secondary/15 text-relaive-secondary',
  orange: 'bg-orange-100 text-orange-600',
  blue: 'bg-relaive-primary/10 text-relaive-primary',
}

function SparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l1.2 5.3L18.5 9.5 13.2 10.7 12 16l-1.2-5.3L5.5 9.5l5.3-1.2L12 3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 15.5l.6 2.4 2.4.6-2.4.6-.6 2.4-.6-2.4-2.4-.6 2.4-.6.6-2.4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function AiInsightsPanel({ insights, className = '' }: AiInsightsPanelProps) {
  return (
    <Card className={className}>
      <div className="mb-5 flex items-center gap-2">
        <span className="text-relaive-secondary">
          <SparkleIcon />
        </span>
        <CardTitle>AI Insights</CardTitle>
      </div>

      <ul className="flex flex-col gap-3">
        {insights.map((insight) => (
          <li
            key={insight.id}
            className="flex items-start justify-between gap-3 rounded-2xl bg-[#F8F9FB] px-4 py-3.5"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-relaive-navy">{insight.title}</p>
              <p className="mt-0.5 text-sm text-relaive-gray">{insight.description}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${BADGE_STYLES[insight.tone]}`}
            >
              {insight.badge}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
