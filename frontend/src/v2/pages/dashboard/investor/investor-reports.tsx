import { useMemo, useState } from 'react'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getInvestorReportListMockData } from '../../../../services/investor'
import { InvestorReportStatusBadge } from '../../../../components/ui/table/status-badge'
import { ReportListCard } from '../../../features/dashboard/components/reports/report-list-card'
import { useOpenReport } from '../../../services/report-navigation'

// v2 reskin of the Investor Reports list (figma: InvestmentReportsPage.tsx). Same card
// layout pattern as agent-report.tsx (§9.4), but sourced from the existing
// /api/investor/reports mock endpoint — per §10, this stays on the existing backend
// mock data rather than the real Prisma Report model (that's a backend TODO item, see
// backend/V2_BACKEND_TODO.md).
//
// Phase 2: rows now use the shared ReportListCard/InvestorReportStatusBadge and are
// clickable (previously plain, unclickable <div>s). TODO(backend): `report.id` here comes
// from the /api/investor/reports mock array, a separate id namespace from the real `Report`
// model — NOT guaranteed to resolve via GET /api/reports/:id (getPersistedReport). Wired
// through anyway via buildReportViewPath (better than the previous zero-click state), but
// until Investor reports carry a real reportId foreign key, opening one may land on the
// wizard's "Loading saved report..." state indefinitely. See backend/V2_BACKEND_TODO.md
// (Investor section).

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'shared', label: 'Shared' },
] as const

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(value)
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

function TrendingUpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 19h16M6 16l4-5 3 3 5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 7h3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function InvestorReportsV2() {
  const openReport = useOpenReport('investor')
  const { data: reports } = useAsyncData(getInvestorReportListMockData, [])
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('all')
  const [search, setSearch] = useState('')

  const visible = useMemo(() => {
    if (!reports) return []

    const byTab = reports.filter((report) => {
      if (tab === 'draft') return report.status === 'draft'
      if (tab === 'shared') return report.status === 'shared'
      return true
    })

    const query = search.trim().toLowerCase()
    if (!query) return byTab

    return byTab.filter(
      (report) => report.propertyName.toLowerCase().includes(query) || report.suburb.toLowerCase().includes(query),
    )
  }, [reports, tab, search])

  if (!reports) {
    return <div className="p-6 text-sm text-relaive-gray sm:p-8">Loading reports…</div>
  }

  return (
    <div className="flex flex-col">
      <header className="flex flex-col gap-4 px-4 pt-4 font-sans sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">Investment Reports</h1>
          <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">Your generated investment analyses</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search reports, suburbs..."
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
          <ReportListCard
            key={report.id}
            icon={<TrendingUpIcon />}
            title={report.propertyName}
            subtitle={`${report.suburb} · ${report.reportType} · ${relativeTime(report.updatedAt)}`}
            price={formatCurrency(report.purchaseValue)}
            secondaryStat={report.grossYield !== null ? `${report.grossYield.toFixed(1)}% gross yield` : undefined}
            statusBadge={<InvestorReportStatusBadge status={report.status} />}
            onClick={() => openReport(report.id)}
          />
        ))}

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-black/5 bg-white py-16 text-center">
            <p className="text-sm font-medium text-relaive-navy">No reports found</p>
            <p className="mt-1 text-sm text-relaive-gray">
              {reports.length === 0 ? 'Generate an investment report to see it here.' : 'Try a different search or tab.'}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
