import { Card } from '../../../components/ui/card/card'

export type RecentReport = {
  id: string
  title: string
  detail: string
  timeAgo: string
}

type RecentReportsPanelProps = {
  reports: RecentReport[]
  className?: string
  /** Called with the clicked report's id. When omitted, the title button is inert. */
  onOpenReport?: (reportId: string) => void
  /** Called when "View All" is clicked. When omitted, the link is inert. */
  onViewAll?: () => void
}

function getReportPrice(detail: string) {
  return detail.split(' • ')[0]?.trim() ?? detail
}

function getReportStatus(detail: string) {
  return detail.split(' • ')[1]?.trim() ?? ''
}

function HouseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function RecentReportsPanel({ reports, className = '', onOpenReport, onViewAll }: RecentReportsPanelProps) {
  return (
    <Card className={className}>
      <header className="flex items-center justify-between gap-3 border-b border-black/5 pb-4">
        <h3 className="text-lg font-semibold text-black sm:text-xl">Recent Reports</h3>
        <a
          href="#"
          className="shrink-0 text-sm font-medium text-relaive-primary transition-colors hover:text-relaive-primary-hover"
          onClick={(event) => {
            event.preventDefault()
            onViewAll?.()
          }}
        >
          View All ↗
        </a>
      </header>

      <ul className="pt-1">
        {reports.slice(0, 4).map((report) => {
          const price = getReportPrice(report.detail)
          const status = getReportStatus(report.detail)

          return (
            <li
              key={report.id}
              className="flex items-center gap-3 border-b border-black/5 py-4 last:border-b-0"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-relaive-primary/10 text-relaive-primary">
                <HouseIcon />
              </span>

              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  aria-label={`Open report: ${report.title}`}
                  className="block max-w-full truncate text-left text-sm font-semibold text-black transition-colors hover:text-relaive-primary hover:underline"
                  onClick={() => onOpenReport?.(report.id)}
                >
                  {report.title}
                </button>
                <p className="mt-0.5 truncate text-sm text-relaive-gray">{price}</p>
                <p className="mt-0.5 truncate text-xs text-relaive-gray/80">{report.timeAgo}</p>
              </div>

              {status ? (
                <span className="shrink-0 rounded-full bg-relaive-primary/10 px-2.5 py-1 text-right text-xs font-medium text-relaive-primary">
                  {status}
                </span>
              ) : null}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
