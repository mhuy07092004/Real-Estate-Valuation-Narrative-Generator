import { useMemo, useState } from 'react'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getValuerCaseListMockData } from '../../../../services/valuer'
import type { CaseItem } from '../../../../services/dashboard'
import { getCaseStatusLabel } from '../../../../components/ui/table/status-badge'

// v2 build of Valuer's Audit Trail (figma: AuditTrailPage.tsx, read in full) — net-new,
// zero v1 equivalent. The figma page is a hand-authored, per-field edit/override log
// (old value → new value, AI-suggested vs manually-overridden comparables, accept/reject
// decisions with reasons) tied to individual field edits inside a case. No such granular
// edit-history endpoint exists anywhere in the backend (checked `services/valuer.ts`,
// `services/common.ts`, and `backend/src/routes/mock.routes.ts` for "audit"/"activity"/
// "history" — nothing beyond EvidenceCategory's unrelated 'history' tag). Composing a
// real, non-fabricated log instead from `getValuerCaseListMockData()` — each case's
// `status`/`updatedAt`/`confidence` becomes a single "status changed to X" / "confidence
// score computed" event. This is coarser than the figma's per-field edit log (we don't have
// old/new field values or reviewer names to attribute), but every entry traces to real case
// data rather than invented users/reasons. See backend/V2_BACKEND_TODO.md for the real
// audit-log endpoint this should be replaced with.

type AuditEventType = 'status' | 'confidence' | 'warning'

type AuditEvent = {
  id: string
  timestamp: string
  caseId: string
  address: string
  type: AuditEventType
  summary: string
  detail: string
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

function buildAuditEvents(cases: CaseItem[]): AuditEvent[] {
  const events: AuditEvent[] = []

  for (const item of cases) {
    events.push({
      id: `${item.id}-status`,
      timestamp: item.updatedAt,
      caseId: item.id,
      address: item.address,
      type: 'status',
      summary: `Status changed to "${getCaseStatusLabel(item.status)}"`,
      detail: `${item.clientName} · ${item.suburb} · ${item.purpose}`,
    })

    if (item.confidence !== null) {
      events.push({
        id: `${item.id}-confidence`,
        timestamp: item.updatedAt,
        caseId: item.id,
        address: item.address,
        type: 'confidence',
        summary: `AI confidence score computed: ${item.confidence}%`,
        detail: `${item.clientName} · ${item.suburb}`,
      })
    }

    if (item.hasWarning) {
      events.push({
        id: `${item.id}-warning`,
        timestamp: item.updatedAt,
        caseId: item.id,
        address: item.address,
        type: 'warning',
        summary: 'Flagged for review — evidence or confidence warning',
        detail: `${item.clientName} · ${item.suburb}`,
      })
    }
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

const TYPE_STYLES: Record<AuditEventType, { bg: string; text: string; label: string }> = {
  status: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Status' },
  confidence: { bg: 'bg-teal-50', text: 'text-teal-600', label: 'AI' },
  warning: { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Warning' },
}

type FilterType = 'All' | 'Status Changes' | 'AI Events' | 'Warnings'

export function AuditTrailPageV2() {
  const { data: cases } = useAsyncData(getValuerCaseListMockData, [])
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('All')
  const [caseFilter, setCaseFilter] = useState('All')

  const events = useMemo(() => (cases ? buildAuditEvents(cases) : []), [cases])
  const caseOptions = useMemo(() => ['All', ...(cases ?? []).map((item) => item.id)], [cases])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return events.filter((event) => {
      const matchesSearch =
        !query ||
        event.summary.toLowerCase().includes(query) ||
        event.address.toLowerCase().includes(query) ||
        event.caseId.toLowerCase().includes(query)
      const matchesCase = caseFilter === 'All' || event.caseId === caseFilter
      const matchesFilter =
        activeFilter === 'All' ||
        (activeFilter === 'Status Changes' && event.type === 'status') ||
        (activeFilter === 'AI Events' && event.type === 'confidence') ||
        (activeFilter === 'Warnings' && event.type === 'warning')
      return matchesSearch && matchesCase && matchesFilter
    })
  }, [events, search, caseFilter, activeFilter])

  if (!cases) {
    return <div className="p-6 text-sm text-relaive-gray sm:p-8">Loading audit trail…</div>
  }

  const statusChanges = events.filter((e) => e.type === 'status').length
  const aiEvents = events.filter((e) => e.type === 'confidence').length
  const warnings = events.filter((e) => e.type === 'warning').length

  return (
    <div className="flex flex-col gap-6 p-4 font-sans sm:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">Audit Trail</h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">
          {events.length} recorded events across {cases.length} cases
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Events', value: events.length, color: 'text-relaive-primary' },
          { label: 'Status Changes', value: statusChanges, color: 'text-blue-600' },
          { label: 'AI Confidence Events', value: aiEvents, color: 'text-teal-600' },
          { label: 'Warnings Flagged', value: warnings, color: 'text-orange-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-black/5 bg-white p-4">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="mt-0.5 text-xs text-relaive-gray">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search events, addresses, cases…"
          className="max-w-xs flex-grow rounded-xl border border-black/10 px-4 py-2.5 text-sm text-relaive-navy placeholder:text-relaive-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
        />

        <div className="flex items-center gap-1 rounded-xl border border-black/5 bg-white p-1">
          {(['All', 'Status Changes', 'AI Events', 'Warnings'] as FilterType[]).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeFilter === filter ? 'bg-relaive-primary text-white' : 'text-relaive-gray hover:bg-black/5'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <select
          value={caseFilter}
          onChange={(event) => setCaseFilter(event.target.value)}
          className="rounded-xl border border-black/10 px-3.5 py-2.5 text-sm text-relaive-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
        >
          {caseOptions.map((id) => (
            <option key={id} value={id}>
              {id === 'All' ? 'All Cases' : id}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        {filtered.map((event) => {
          const styles = TYPE_STYLES[event.type]
          return (
            <div key={event.id} className="flex items-start gap-4 rounded-2xl border border-black/5 bg-white px-5 py-4">
              <span className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles.bg} ${styles.text}`}>
                {styles.label}
              </span>
              <div className="min-w-0 flex-grow">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-relaive-navy">{event.summary}</span>
                  <span className="font-mono text-[10px] text-relaive-primary">{event.caseId}</span>
                </div>
                <p className="mt-0.5 text-xs text-relaive-gray">
                  {event.address} · {event.detail} · {relativeTime(event.timestamp)}
                </p>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-black/5 bg-white py-16 text-center">
            <p className="text-sm font-medium text-relaive-navy">No events match your filters</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
