import { Link, useNavigate } from 'react-router-dom'
import { Card } from '../../../components/ui/card/card'

export type RecentReport = {
  id: string
  title: string
  detail: string
  timeAgo: string
  clientName?: string
}

type RecentReportsPanelProps = {
  reports: RecentReport[]
  className?: string
  title?: string
  viewAllTo?: string
  generateReportBase?: string
  variant?: 'default' | 'agent' | 'inspection'
  showGenerateNewLink?: boolean
  generateNewLabel?: string
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

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 3.5v3M16 3.5v3M4 9.5h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ViewAllLink({ to }: { to?: string }) {
  const className =
    'shrink-0 text-sm font-medium text-relaive-primary transition-colors hover:text-relaive-primary-hover'

  if (to) {
    return (
      <Link to={to} className={className}>
        View all
      </Link>
    )
  }

  return (
    <a href="#" className={className} onClick={(event) => event.preventDefault()}>
      View All ↗
    </a>
  )
}

export function RecentReportsPanel({
  reports,
  className = '',
  title = 'Recent Reports',
  viewAllTo,
  generateReportBase = '/dashboard/agent/generate-report',
  variant = 'default',
  showGenerateNewLink = false,
  generateNewLabel = '+ Generate new report',
}: RecentReportsPanelProps) {
  const navigate = useNavigate()
  const isAgent = variant === 'agent'
  const isInspection = variant === 'inspection'

  return (
    <Card className={className}>
      <header className="flex items-center justify-between gap-3 border-b border-black/5 pb-4">
        <h3 className="text-lg font-semibold text-black sm:text-xl">{title}</h3>
        <ViewAllLink to={viewAllTo} />
      </header>

      <ul className="pt-1">
        {reports.slice(0, 4).map((report) => {
          const price = getReportPrice(report.detail)
          const status = getReportStatus(report.detail)
          const subtitle = report.clientName
            ? `${report.clientName} · ${report.timeAgo}`
            : report.timeAgo

          return (
            <li
              key={report.id}
              className="flex items-center gap-3 border-b border-black/5 py-4 last:border-b-0"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-relaive-primary/10 text-relaive-primary">
                <HouseIcon />
              </span>

              {isInspection ? (
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-black">{report.title}</span>
                    <span className="mt-0.5 block truncate text-sm text-relaive-gray">{report.detail}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-relaive-gray">
                      <span className="shrink-0 text-relaive-gray/80">
                        <CalendarIcon />
                      </span>
                      {report.timeAgo}
                    </span>
                  </span>
                  <span className="shrink-0 text-relaive-gray/60">
                    <ChevronIcon />
                  </span>
                </div>
              ) : isAgent ? (
                <button
                  type="button"
                  aria-label={`Open report: ${report.title}`}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() =>
                    navigate(
                      `${generateReportBase}?step=5&ready=1&reportId=${encodeURIComponent(report.id)}`,
                    )
                  }
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-black">{report.title}</span>
                    <span className="mt-0.5 block truncate text-sm text-relaive-gray">{subtitle}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-black">{price}</span>
                  <span className="shrink-0 text-relaive-gray/60">
                    <ChevronIcon />
                  </span>
                </button>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      aria-label={`Open report: ${report.title}`}
                      className="block max-w-full truncate text-left text-sm font-semibold text-black transition-colors hover:text-relaive-primary hover:underline"
                      onClick={() => {}}
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
                </>
              )}
            </li>
          )
        })}
      </ul>

      {showGenerateNewLink ? (
        <button
          type="button"
          className="mt-1 inline-flex text-sm font-medium text-relaive-primary transition-colors hover:text-relaive-primary-hover"
          onClick={() => navigate(generateReportBase)}
        >
          {generateNewLabel}
        </button>
      ) : null}
    </Card>
  )
}
