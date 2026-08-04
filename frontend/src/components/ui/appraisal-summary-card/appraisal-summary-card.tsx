import type { AppraisalSummary } from '../../../services/common'

type AppraisalSummaryCardProps = {
  summary: AppraisalSummary
  className?: string
}

export function AppraisalSummaryCard({
  summary,
  className = '',
}: AppraisalSummaryCardProps) {
  return (
    <section
      className={`rounded-3xl bg-gradient-to-r from-relaive-primary to-relaive-secondary px-5 py-6 text-white shadow-[0_4px_24px_rgba(26,32,44,0.08)] sm:px-7 sm:py-7 ${className}`}
    >
      <div className="flex items-start justify-between gap-4 text-[11px] font-semibold tracking-[0.08em] text-white/90 uppercase sm:text-xs">
        <p>{summary.eyebrow}</p>
        <p className="shrink-0 normal-case tracking-normal">{summary.date}</p>
      </div>

      <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
        {summary.street}
      </h2>
      <p className="mt-1 text-sm text-white/90 sm:text-base">{summary.suburbLine}</p>
      <p className="mt-3 text-sm text-white/85 sm:text-[15px]">{summary.featuresLine}</p>

      <div className="mt-5 rounded-2xl border border-white/35 bg-white/10 px-4 py-4 sm:px-5 sm:py-5">
        <p className="text-sm text-white/90">{summary.appraisalLabel}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-300 sm:text-[28px]">
          {summary.priceRange}
        </p>
        <p className="mt-1 text-sm text-white/90">{summary.midpointEstimate}</p>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-3">
          {summary.stats.map((stat) => (
            <div key={stat.id}>
              <p className="text-lg font-bold tracking-tight sm:text-xl">{stat.value}</p>
              <p className="mt-0.5 text-xs text-white/80 sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
