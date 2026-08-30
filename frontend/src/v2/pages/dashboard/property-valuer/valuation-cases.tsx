import { useMemo, useState } from 'react'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getValuerCaseListMockData } from '../../../../services/valuer'
import { StatusBadge } from '../../../../components/ui/table/status-badge'
import { ReportListCard } from '../../../features/dashboard/components/reports/report-list-card'
import { useOpenReport } from '../../../services/report-navigation'

// v2 reskin of the Valuer Valuation Cases list (figma: ValuationCasesPage.tsx). Same card
// layout pattern as agent-report.tsx/investor-reports.tsx (§9.4/§10), sourced from the
// existing /api/valuer/cases mock endpoint. Figma's own status vocabulary
// (Draft/In Progress/Ready to Send/Revision Requested/Sent) differs from the backend's
// (valuer_review/evidence_collection/...) — using the real backend vocabulary via the
// existing StatusBadge component rather than inventing a mapping layer.
//
// Phase 2: rows now use the shared ReportListCard and are clickable (previously plain,
// unclickable <div>s — see the "clicking a report card does nothing" audit). TODO(backend):
// getValuerCaseListMockData()'s `item.id` is a mock-only case id (from the /api/valuer/cases
// mock array), not a real `Report` id — it is NOT guaranteed to resolve via
// GET /api/reports/:id (getPersistedReport). Wired through anyway via buildReportViewPath
// (better than the previous zero-click state), but until Valuer cases carry a real reportId
// foreign key, opening a case may land on the wizard's "Loading saved report..." state
// indefinitely. See backend/V2_BACKEND_TODO.md (Valuer section).

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

function ScaleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v18M7 7l-4 8a4 4 0 0 0 8 0l-4-8Zm10 0l-4 8a4 4 0 0 0 8 0l-4-8ZM5 7h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ValuationCasesV2() {
  const openReport = useOpenReport('valuer')
  const { data: cases } = useAsyncData(getValuerCaseListMockData, [])
  const [search, setSearch] = useState('')

  const visible = useMemo(() => {
    if (!cases) return []
    const query = search.trim().toLowerCase()
    if (!query) return cases
    return cases.filter(
      (item) =>
        item.address.toLowerCase().includes(query) ||
        item.suburb.toLowerCase().includes(query) ||
        item.clientName.toLowerCase().includes(query),
    )
  }, [cases, search])

  if (!cases) {
    return <div className="p-6 text-sm text-relaive-gray sm:p-8">Loading cases…</div>
  }

  return (
    <div className="flex flex-col">
      <header className="flex flex-col gap-4 px-4 pt-4 font-sans sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">Valuation Cases</h1>
          <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">Track every valuation case through to completion</p>
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search cases, clients, suburbs..."
          className="max-w-xs rounded-xl border border-black/10 px-4 py-2.5 text-sm text-relaive-navy placeholder:text-relaive-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
        />
      </header>

      <div className="flex flex-col gap-3 p-4 sm:p-6 lg:p-8">
        {visible.map((item) => (
          <ReportListCard
            key={item.id}
            icon={<ScaleIcon />}
            title={item.address}
            subtitle={`${item.clientName} · ${item.suburb} · ${item.purpose} · ${relativeTime(item.updatedAt)}`}
            secondaryStat={item.confidence !== null ? `${item.confidence}% confidence` : undefined}
            statusBadge={<StatusBadge status={item.status} />}
            onClick={() => openReport(item.id)}
          />
        ))}

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-black/5 bg-white py-16 text-center">
            <p className="text-sm font-medium text-relaive-navy">No cases found</p>
            <p className="mt-1 text-sm text-relaive-gray">Try a different search.</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
