import type { ReactNode } from 'react'

// Shared report/case list card — consolidates the near-identical card markup that used
// to be copy-pasted (and mostly left un-clickable) across agent-report.tsx,
// valuation-cases.tsx and investor-reports.tsx. Visual design is based on
// agent-report.tsx's existing card (already close to the figma reference,
// ClientReportsPage.tsx: icon chip, truncated title/subtitle, right-aligned stat
// column, status badge, trailing chevron, hover shadow). Status is passed as a
// pre-rendered badge node rather than a fixed status type, since each role's status
// vocabulary is a different type (CaseStatus vs InvestorReportStatus) with its own
// existing badge component (StatusBadge / InvestorReportStatusBadge) — this keeps the
// card config-driven without inventing a new unified status enum.

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export type ReportListCardProps = {
  /** Small icon rendered in the leading chip (e.g. a home/scale/trend-up glyph). */
  icon: ReactNode
  /** Primary line — report title / property address. */
  title: string
  /** Secondary line — client/suburb/purpose/time, already formatted by the caller. */
  subtitle: string
  /** Right-aligned primary stat (e.g. formatted currency). Hidden below sm if omitted. */
  price?: string
  /** Right-aligned secondary stat, shown under `price` (e.g. beds/baths/land, confidence, yield). */
  secondaryStat?: string
  /** Pre-rendered status badge node, e.g. `<StatusBadge status={item.status} />`. */
  statusBadge?: ReactNode
  onClick: () => void
  className?: string
}

export function ReportListCard({
  icon,
  title,
  subtitle,
  price,
  secondaryStat,
  statusBadge,
  onClick,
  className = '',
}: ReportListCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-black/5 bg-white px-5 py-4 text-left transition-all hover:border-relaive-primary/20 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary ${className}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-relaive-primary/10 text-relaive-primary">
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-relaive-navy">{title}</p>
        <p className="truncate text-xs text-relaive-gray">{subtitle}</p>
      </div>

      {price || secondaryStat ? (
        <div className="hidden shrink-0 text-right sm:block">
          {price ? <p className="text-sm font-bold text-relaive-navy">{price}</p> : null}
          {secondaryStat ? <p className="text-[10px] text-relaive-gray">{secondaryStat}</p> : null}
        </div>
      ) : null}

      {statusBadge ? <span className="shrink-0">{statusBadge}</span> : null}

      <span className="shrink-0 text-relaive-gray/50">
        <ChevronRightIcon />
      </span>
    </button>
  )
}
