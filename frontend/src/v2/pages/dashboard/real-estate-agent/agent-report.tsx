import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getAgentReportCards } from '../../../services/agent'
import { StatusBadge } from '../../../../components/ui/table/status-badge'

// v2 reskin of the Agent Client Reports page (figma: ClientReportsPage.tsx).
// Card layout instead of a table, plus real fields (estimated value, beds/baths/land)
// that v1's CaseTable doesn't read. Status stays real/derived (draft vs exported) —
// figma's page had a manual "mark as sent" toggle with no backing field, which isn't
// carried over since there's nothing real to persist it against.
// See figma-ui-migration-plan.md §9.1 / §9.4 step 3.

const TABS = [
  { id: 'recent', label: 'Recent' },
  { id: 'draft', label: 'Draft' },
  { id: 'exported', label: 'Exported' },
] as const

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(value)
}

function relativeTime(isoDate: string): string {
  const timestamp = new Date(isoDate).getTime()
  if (!Number.isFinite(timestamp)) return ''
  const deltaMs = Date.now() - timestamp
  const minutes = Math.max(0, Math.floor(deltaMs / (60 * 1000)))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

function HomeIcon() {
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

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function AgentReportV2() {
  const navigate = useNavigate()
  const { data: reports } = useAsyncData(getAgentReportCards, [])
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('recent')
  const [search, setSearch] = useState('')
  const [sortDesc, setSortDesc] = useState(true)

  const visible = useMemo(() => {
    if (!reports) return []

    const byTab = reports.filter((report) => {
      if (tab === 'draft') return report.status === 'draft'
      if (tab === 'exported') return report.status === 'exported'
      return true
    })

    const query = search.trim().toLowerCase()
    const bySearch = query
      ? byTab.filter(
          (report) =>
            report.address.toLowerCase().includes(query) ||
            report.suburb.toLowerCase().includes(query) ||
            (report.clientName ?? '').toLowerCase().includes(query),
        )
      : byTab

    return [...bySearch].sort((a, b) => {
      const delta = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      return sortDesc ? -delta : delta
    })
  }, [reports, tab, search, sortDesc])

  if (!reports) {
    return <div className="p-6 text-sm text-relaive-gray sm:p-8">Loading reports…</div>
  }

  return (
    <div className="flex flex-col">
      <header className="flex flex-col gap-4 px-4 pt-4 font-sans sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">Client Reports</h1>
            <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">Manage, share and export your appraisal reports</p>
          </div>
          <button
            type="button"
            onClick={() => setSortDesc((prev) => !prev)}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-relaive-navy hover:border-relaive-primary/30"
          >
            {sortDesc ? 'Recent first' : 'Oldest first'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search reports, properties, clients..."
            className="max-w-xs flex-grow rounded-xl border border-black/10 px-4 py-2.5 text-sm text-relaive-navy placeholder:text-relaive-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
          />
          <div className="flex items-center gap-1 rounded-xl border border-black/10 bg-white p-1">
            {TABS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setTab(option.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  tab === option.id ? 'bg-relaive-primary text-white' : 'text-relaive-gray hover:bg-black/5'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-3 p-4 sm:p-6 lg:p-8">
        {visible.map((report) => (
          <button
            key={report.id}
            type="button"
            onClick={() =>
              navigate(`/dashboard/agent/generate-report?step=4&ready=1&reportId=${encodeURIComponent(report.id)}`)
            }
            className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white px-5 py-4 text-left transition-all hover:border-relaive-primary/20 hover:shadow-sm"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-relaive-primary/10 text-relaive-primary">
              <HomeIcon />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-relaive-navy">{report.title}</p>
              <p className="truncate text-xs text-relaive-gray">
                {report.clientName ?? 'No client linked'} · {report.suburb} · {relativeTime(report.updatedAt)}
              </p>
            </div>

            <div className="hidden shrink-0 text-right sm:block">
              <p className="text-sm font-bold text-relaive-navy">{formatCurrency(report.estimatedValue)}</p>
              <p className="text-[10px] text-relaive-gray">
                {report.bedrooms}b · {report.bathrooms}ba · {report.landSizeSqm}m²
              </p>
            </div>

            <StatusBadge status={report.status} className="shrink-0" />
            <span className="shrink-0 text-relaive-gray/50">
              <ChevronRightIcon />
            </span>
          </button>
        ))}

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-black/5 bg-white py-16 text-center">
            <p className="text-sm font-medium text-relaive-navy">No reports found</p>
            <p className="mt-1 text-sm text-relaive-gray">
              {reports.length === 0 ? 'Generate an appraisal to see it here.' : 'Try a different search or tab.'}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

