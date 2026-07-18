import { Card, CardTitle } from '../ui/card/card'

export type RecentReport = {
  id: string
  title: string
  detail: string
  timeAgo: string
}

type RecentReportsPanelProps = {
  reports: RecentReport[]
  className?: string
}

function DocumentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3.5h7l4 4V20.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M14 3.5V8h4.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 12h6M9 15.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 8v4.5l3 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function RecentReportsPanel({ reports, className = '' }: RecentReportsPanelProps) {
  return (
    <Card className={className}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <CardTitle>Recent Reports</CardTitle>
        <a
          href="#"
          className="shrink-0 text-sm font-medium text-relaive-primary transition-colors hover:text-relaive-primary-hover"
          onClick={(event) => event.preventDefault()}
        >
          View All ↗
        </a>
      </div>

      <ul className="flex flex-col gap-4">
        {reports.map((report) => (
          <li key={report.id} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-relaive-primary/10 text-relaive-primary">
              <DocumentIcon />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-relaive-navy">{report.title}</p>
              <p className="mt-0.5 truncate text-sm text-relaive-gray">{report.detail}</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-relaive-gray">
                <ClockIcon />
                {report.timeAgo}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
