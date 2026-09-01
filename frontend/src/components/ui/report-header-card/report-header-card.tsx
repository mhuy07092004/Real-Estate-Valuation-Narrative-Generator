import type { ReactNode } from 'react'

export type ReportHeaderStat = {
  id: string
  label: string
  value: string
  accent?: boolean
}

type ReportHeaderCardProps = {
  eyebrowIcon: ReactNode
  eyebrowLabel: string
  preparedByName: string
  date: string
  title: string
  subtitle: string
  stats: ReportHeaderStat[]
  className?: string
}

export function ReportHeaderCard({
  eyebrowIcon,
  eyebrowLabel,
  preparedByName,
  date,
  title,
  subtitle,
  stats,
  className = '',
}: ReportHeaderCardProps) {
  return (
    <section
      className={`rounded-3xl bg-relaive-navy px-5 py-6 text-white shadow-[0_4px_24px_rgba(26,32,44,0.12)] sm:px-7 sm:py-7 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs font-semibold tracking-[0.08em] text-relaive-secondary uppercase sm:text-sm">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-relaive-secondary/25 text-relaive-secondary">
            {eyebrowIcon}
          </span>
          {eyebrowLabel}
        </div>

        <div className="text-right text-xs text-white/60 sm:text-sm">
          <p className="uppercase tracking-[0.08em]">Prepared by</p>
          <p className="mt-0.5 font-semibold text-white">{preparedByName}</p>
          <p className="mt-0.5 text-white/60">{date}</p>
        </div>
      </div>

      <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      <p className="mt-1 text-sm text-white/70 sm:text-base">{subtitle}</p>

      <div className="mt-6 grid grid-cols-2 gap-5 border-t border-white/10 pt-5 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.id}>
            <p className="text-[11px] font-medium tracking-[0.08em] text-white/50 uppercase">
              {stat.label}
            </p>
            <p
              className={`mt-1 text-lg font-bold tracking-tight sm:text-xl ${
                stat.accent ? 'text-emerald-400' : 'text-white'
              }`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
