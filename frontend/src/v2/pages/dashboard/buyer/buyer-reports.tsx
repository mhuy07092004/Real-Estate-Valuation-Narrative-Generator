import { useMemo, useState } from 'react'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getBuyerReportListMockData } from '../../../../services/buyer'
import { StatusBadge } from '../../../../components/ui/table/status-badge'
import { ReportListCard } from '../../../features/dashboard/components/reports/report-list-card'
import { useOpenReport } from '../../../services/report-navigation'

// Net-new v2 Reports list page for Buyer (Phase 2) — Buyer previously had no v2 Reports
// page at all; DashboardReport() in routes/index.tsx hardcoded the v1 <BuyerReport />
// (which itself rendered <CaseTable> without the onRowClick it already supports, so rows
// were unclickable there too). Modeled on agent-report.tsx's structure — the working
// reference pattern for this consolidation, not figma's BuyerReportsPage.tsx from scratch.
//
// TODO(backend): getBuyerReportListMockData() (GET /api/buyer/reports) is a mock-only
// array — a separate id namespace from the real `Report` model, same caveat as Valuer/
// Investor. Wired through anyway via buildReportViewPath (better than the previous
// zero-click state), but ids here are NOT guaranteed to resolve via GET /api/reports/:id
// (getPersistedReport) until Buyer Reports is backed by the real /api/reports CRUD. See
// backend/V2_BACKEND_TODO.md (Buyer section, "Buyer Reports" row).

const TABS = [
  { id: 'recent', label: 'Recent' },
  { id: 'draft', label: 'Draft' },
  { id: 'exported', label: 'Shared' },
] as const

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

export function BuyerReportsV2() {
  const openReport = useOpenReport('buyer')
  const { data: cases } = useAsyncData(getBuyerReportListMockData, [])
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('recent')
  const [search, setSearch] = useState('')

  const visible = useMemo(() => {
    if (!cases) return []

    const byTab = cases.filter((item) => {
      if (tab === 'draft') return item.status === 'draft'
      if (tab === 'exported') return item.status === 'exported'
      return true
    })

    const query = search.trim().toLowerCase()
    if (!query) return byTab

    return byTab.filter(
      (item) =>
        item.address.toLowerCase().includes(query) ||
        item.suburb.toLowerCase().includes(query) ||
        item.clientName.toLowerCase().includes(query),
    )
  }, [cases, tab, search])

  if (!cases) {
    return <div className="p-6 text-sm text-relaive-gray sm:p-8">Loading reports…</div>
  }

  return (
    <div className="flex flex-col">
      <header className="flex flex-col gap-4 px-4 pt-4 font-sans sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">Buyer Report</h1>
          <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">Manage, share and export your appraisal reports</p>
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
        {visible.map((item) => (
          <ReportListCard
            key={item.id}
            icon={<HomeIcon />}
            title={item.address}
            subtitle={`${item.clientName} · ${item.suburb} · ${item.purpose} · ${relativeTime(item.updatedAt)}`}
            secondaryStat={item.confidence !== null ? `${item.confidence}% confidence` : undefined}
            statusBadge={<StatusBadge status={item.status} />}
            onClick={() => openReport(item.id)}
          />
        ))}

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-black/5 bg-white py-16 text-center">
            <p className="text-sm font-medium text-relaive-navy">No reports found</p>
            <p className="mt-1 text-sm text-relaive-gray">
              {cases.length === 0 ? 'Generate an appraisal to see it here.' : 'Try a different search or tab.'}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
