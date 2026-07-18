import type { ReactNode } from 'react'

type StatTone = 'blue' | 'teal' | 'orange' | 'sky'

type StatCardProps = {
  icon: ReactNode
  label: string
  value: string
  trend: string
  tone?: StatTone
  className?: string
}

const TONE_STYLES: Record<
  StatTone,
  { iconWrap: string; icon: string; trend: string }
> = {
  blue: {
    iconWrap: 'bg-relaive-primary/10',
    icon: 'text-relaive-primary',
    trend: 'text-relaive-primary',
  },
  teal: {
    iconWrap: 'bg-relaive-secondary/15',
    icon: 'text-relaive-secondary',
    trend: 'text-relaive-secondary',
  },
  orange: {
    iconWrap: 'bg-orange-100',
    icon: 'text-orange-500',
    trend: 'text-orange-500',
  },
  sky: {
    iconWrap: 'bg-sky-100',
    icon: 'text-sky-500',
    trend: 'text-sky-500',
  },
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  tone = 'blue',
  className = '',
}: StatCardProps) {
  const styles = TONE_STYLES[tone]

  return (
    <article
      className={`flex flex-col rounded-3xl border border-black/5 bg-white p-5 shadow-[0_4px_24px_rgba(26,32,44,0.06)] sm:p-6 ${className}`}
    >
      <div
        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${styles.iconWrap} ${styles.icon}`}
      >
        {icon}
      </div>
      <p className="text-sm text-relaive-gray">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-relaive-navy sm:text-3xl">
        {value}
      </p>
      <p className={`mt-3 text-sm font-medium ${styles.trend}`}>{trend}</p>
    </article>
  )
}
