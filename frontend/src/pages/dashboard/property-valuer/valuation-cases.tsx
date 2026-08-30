import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { FilterButton } from '../../../components/ui/button/filter-button'
import { Card } from '../../../components/ui/card/card'
import { HomeIcon } from '../../../components/ui/navbar/dashboard-navbar-icons'
import { getCaseStatusLabel } from '../../../components/ui/table/status-badge'
import { useAsyncData } from '../../../hooks/use-async-data'
import type { CaseItem, CaseStatus } from '../../../services/dashboard'
import { getValuerCaseListMockData } from '../../../services/valuer'

dayjs.extend(relativeTime)

const CASE_STATUSES: CaseStatus[] = [
  'draft',
  'evidence_collection',
  'valuer_review',
  'reviewer_approval',
  'returned_for_revision',
  'approved',
  'exported',
]

const CASE_CARD_STATUS_STYLES: Record<CaseStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-[#EEF0F3]', text: 'text-[#4A5568]' },
  evidence_collection: { bg: 'bg-[#EEF0F3]', text: 'text-[#4A5568]' },
  valuer_review: { bg: 'bg-[#EEF0F3]', text: 'text-[#4A5568]' },
  reviewer_approval: { bg: 'bg-[#EEF0F3]', text: 'text-[#4A5568]' },
  returned_for_revision: { bg: 'bg-[#FDECEC]', text: 'text-[#C53030]' },
  approved: { bg: 'bg-[#E8F6EE]', text: 'text-[#2F855A]' },
  exported: { bg: 'bg-[#E8F6EE]', text: 'text-[#2F855A]' },
}

function CaseCardStatusBadge({ status }: { status: CaseStatus }) {
  const styles = CASE_CARD_STATUS_STYLES[status]

  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${styles.bg} ${styles.text}`}
    >
      {getCaseStatusLabel(status)}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 9l6 6 6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

function SortIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 6v12M5 9l3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 18V6M13 15l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20h4.5L19 9.5 14.5 5 4 15.5V20z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M13.5 6.5L17.5 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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

function confidenceLabel(confidence: number | null) {
  return confidence == null ? '—' : `${confidence}% conf.`
}

type ValuationCaseCardProps = {
  item: CaseItem
  timeAgo: string
  onAddressChange: (id: string, address: string) => void
  onStatusChange: (id: string, status: CaseStatus) => void
}

function ValuationCaseCard({
  item,
  timeAgo,
  onAddressChange,
  onStatusChange,
}: ValuationCaseCardProps) {
  const navigate = useNavigate()
  const { role } = useParams<{ role: string }>()
  const [isEditing, setIsEditing] = useState(false)
  const [draftAddress, setDraftAddress] = useState(item.address)

  function openCase() {
    navigate(
      `/dashboard/${role ?? 'valuer'}/generate-report?step=5&ready=1&reportId=${encodeURIComponent(item.id)}`,
    )
  }

  function commitAddress() {
    const next = draftAddress.trim()
    if (next && next !== item.address) onAddressChange(item.id, next)
    else setDraftAddress(item.address)
    setIsEditing(false)
  }

  return (
    <Card className="rounded-2xl p-4! sm:px-5! sm:py-4!">
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F2F8] text-relaive-primary">
          <HomeIcon width={18} height={18} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            {isEditing ? (
              <input
                autoFocus
                value={draftAddress}
                aria-label="Edit case address"
                className="w-full min-w-0 rounded-md border border-black/10 bg-white px-2 py-0.5 text-sm font-semibold text-[#1C2A38] focus:border-relaive-primary focus:outline-none"
                onChange={(event) => setDraftAddress(event.target.value)}
                onBlur={commitAddress}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') commitAddress()
                  if (event.key === 'Escape') {
                    setDraftAddress(item.address)
                    setIsEditing(false)
                  }
                }}
              />
            ) : (
              <button
                type="button"
                className="truncate text-left text-sm font-semibold tracking-tight text-[#1C2A38] hover:text-relaive-primary sm:text-[15px]"
                onClick={openCase}
              >
                {item.address}
              </button>
            )}
            <button
              type="button"
              aria-label={`Rename ${item.address}`}
              className="shrink-0 text-[#C5CDD6] transition-colors hover:text-relaive-navy"
              onClick={() => {
                setDraftAddress(item.address)
                setIsEditing(true)
              }}
            >
              <PencilIcon />
            </button>
          </div>
          <p className="mt-0.5 truncate text-xs text-relaive-gray sm:text-sm">
            {item.clientName} · {item.suburb} · {timeAgo}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#1C2A38] sm:hidden">
            {item.purpose}
            <span className="ml-2 font-normal text-relaive-gray">
              {confidenceLabel(item.confidence)}
              {item.hasWarning ? ' · Warning' : ''}
            </span>
          </p>
        </div>

        <button
          type="button"
          className="hidden shrink-0 text-right sm:block"
          onClick={openCase}
        >
          <span className="block text-sm font-semibold tracking-tight text-[#1C2A38]">
            {item.purpose}
          </span>
          <span className="mt-0.5 block text-xs text-relaive-gray sm:text-sm">
            {confidenceLabel(item.confidence)}
            {item.hasWarning ? ' · Warning' : ''}
          </span>
        </button>

        <label className="relative shrink-0">
          <span className="sr-only">Case status</span>
          <select
            value={item.status}
            aria-label={`Status for ${item.address}`}
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(event) => onStatusChange(item.id, event.target.value as CaseStatus)}
          >
            {CASE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getCaseStatusLabel(status)}
              </option>
            ))}
          </select>
          <CaseCardStatusBadge status={item.status} />
        </label>

        <button
          type="button"
          aria-label={`Open case: ${item.address}`}
          className="hidden shrink-0 text-relaive-gray/50 sm:block"
          onClick={openCase}
        >
          <ChevronIcon />
        </button>
      </div>
    </Card>
  )
}

export function ValuationCases() {
  const { data, isLoading } = useAsyncData(getValuerCaseListMockData, [])
  const [cases, setCases] = useState<CaseItem[]>([])
  const [recentFirst, setRecentFirst] = useState(true)

  useEffect(() => {
    if (data) setCases(data)
  }, [data])

  const sortedCases = useMemo(() => {
    return [...cases].sort((a, b) => {
      const delta = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      return recentFirst ? delta : -delta
    })
  }, [cases, recentFirst])

  function handleAddressChange(id: string, address: string) {
    setCases((current) =>
      current.map((item) => (item.id === id ? { ...item, address } : item)),
    )
  }

  function handleStatusChange(id: string, status: CaseStatus) {
    setCases((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1 flex-col gap-6 p-4 sm:gap-7 sm:p-6 lg:p-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
              Valuation Cases
            </h1>
            <p className="mt-1 text-sm text-relaive-gray sm:text-base">
              {cases.length} {cases.length === 1 ? 'case' : 'cases'}
            </p>
          </div>
          <FilterButton
            label={recentFirst ? 'Recent first' : 'Oldest first'}
            icon={<SortIcon />}
            onClick={() => setRecentFirst((current) => !current)}
          />
        </header>

        {isLoading && cases.length === 0 ? (
          <p className="text-sm text-relaive-gray">Loading cases…</p>
        ) : sortedCases.length === 0 ? (
          <p className="text-sm text-relaive-gray">No valuation cases yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {sortedCases.map((item) => (
              <li key={item.id}>
                <ValuationCaseCard
                  item={item}
                  timeAgo={dayjs(item.updatedAt).fromNow()}
                  onAddressChange={handleAddressChange}
                  onStatusChange={handleStatusChange}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
