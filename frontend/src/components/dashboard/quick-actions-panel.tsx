import type { ReactNode } from 'react'
import { Card, CardTitle } from '../ui/card/card'

export type QuickActionTone = 'blue' | 'teal' | 'orange'

export type QuickAction = {
  id: string
  title: string
  subtitle: string
  tone: QuickActionTone
  icon: ReactNode
}

type QuickActionsPanelProps = {
  actions: QuickAction[]
  className?: string
}

const TONE_STYLES: Record<
  QuickActionTone,
  { iconWrap: string; icon: string }
> = {
  blue: {
    iconWrap: 'bg-relaive-primary/10',
    icon: 'text-relaive-primary',
  },
  teal: {
    iconWrap: 'bg-relaive-secondary/15',
    icon: 'text-relaive-secondary',
  },
  orange: {
    iconWrap: 'bg-orange-100',
    icon: 'text-orange-500',
  },
}

function QuickActionButton({ action }: { action: QuickAction }) {
  const styles = TONE_STYLES[action.tone]

  return (
    <button
      type="button"
      className="flex w-full items-center gap-3.5 rounded-2xl border border-black/5 bg-white px-4 py-4 text-left transition-colors hover:border-relaive-primary/20 hover:bg-[#5193b3]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.iconWrap} ${styles.icon}`}
      >
        {action.icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-relaive-navy">{action.title}</span>
        <span className="mt-0.5 block text-sm text-relaive-gray">{action.subtitle}</span>
      </span>
    </button>
  )
}

export function QuickActionsPanel({ actions, className = '' }: QuickActionsPanelProps) {
  return (
    <Card className={className}>
      <div className="mb-5">
        <CardTitle>Quick Actions</CardTitle>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {actions.map((action) => (
          <QuickActionButton key={action.id} action={action} />
        ))}
      </div>
    </Card>
  )
}
