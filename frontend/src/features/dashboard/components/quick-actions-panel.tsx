import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

export type QuickActionTone = 'blue' | 'teal' | 'orange'

export type QuickAction = {
  id: string
  title: string
  subtitle?: string
  tone: QuickActionTone
  icon: ReactNode
  to?: string
}

type QuickActionsPanelProps = {
  actions: QuickAction[]
  className?: string
}

const TONE_STYLES: Record<QuickActionTone, { iconWrap: string; icon: string }> = {
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
  const navigate = useNavigate()
  const styles = TONE_STYLES[action.tone]

  return (
    <button
      type="button"
      className="flex min-h-[140px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-6 text-center shadow-[0_4px_24px_rgba(26,32,44,0.06)] transition-colors hover:border-relaive-primary/20 hover:bg-[#F8FBFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
      onClick={() => {
        if (action.to) navigate(action.to)
      }}
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${styles.iconWrap} ${styles.icon}`}
      >
        {action.icon}
      </span>
      <span className="text-sm font-semibold text-relaive-navy">{action.title}</span>
    </button>
  )
}

export function QuickActionsPanel({ actions, className = '' }: QuickActionsPanelProps) {
  return (
    <section className={className}>
      <h2 className="mb-3 text-xs font-semibold tracking-[0.14em] text-relaive-gray uppercase">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {actions.map((action) => (
          <QuickActionButton key={action.id} action={action} />
        ))}
      </div>
    </section>
  )
}
