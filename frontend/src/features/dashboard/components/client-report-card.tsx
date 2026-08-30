import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '../../../components/ui/card/card'
import { HomeIcon } from '../../../components/ui/navbar/dashboard-navbar-icons'
import { AgentClientReportStatusBadge } from '../../../components/ui/table/status-badge'

export type ReportListCardStatus = 'generated' | 'shared'

export type ReportListCardData = {
  id: string
  address: string
  suburb: string
  clientName: string
  status: ReportListCardStatus
  estimatedValue: number
  beds: number
  baths: number
  areaSqm: number
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(value)
}

type ClientReportCardProps = {
  report: ReportListCardData
  timeAgo: string
  onAddressChange: (id: string, address: string) => void
  onStatusChange: (id: string, status: ReportListCardStatus) => void
}

export function ClientReportCard({
  report,
  timeAgo,
  onAddressChange,
  onStatusChange,
}: ClientReportCardProps) {
  const navigate = useNavigate()
  const { role } = useParams<{ role: string }>()
  const [isEditing, setIsEditing] = useState(false)
  const [draftAddress, setDraftAddress] = useState(report.address)

  function openReport() {
    navigate(
      `/dashboard/${role ?? 'agent'}/generate-report?step=5&ready=1&reportId=${encodeURIComponent(report.id)}`,
    )
  }

  function commitAddress() {
    const next = draftAddress.trim()
    if (next && next !== report.address) onAddressChange(report.id, next)
    else setDraftAddress(report.address)
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
                aria-label="Edit report address"
                className="w-full min-w-0 rounded-md border border-black/10 bg-white px-2 py-0.5 text-sm font-semibold text-[#1C2A38] focus:border-relaive-primary focus:outline-none"
                onChange={(event) => setDraftAddress(event.target.value)}
                onBlur={commitAddress}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') commitAddress()
                  if (event.key === 'Escape') {
                    setDraftAddress(report.address)
                    setIsEditing(false)
                  }
                }}
              />
            ) : (
              <button
                type="button"
                className="truncate text-left text-sm font-semibold tracking-tight text-[#1C2A38] hover:text-relaive-primary sm:text-[15px]"
                onClick={openReport}
              >
                {report.address}
              </button>
            )}
            <button
              type="button"
              aria-label={`Rename ${report.address}`}
              className="shrink-0 text-[#C5CDD6] transition-colors hover:text-relaive-navy"
              onClick={() => {
                setDraftAddress(report.address)
                setIsEditing(true)
              }}
            >
              <PencilIcon />
            </button>
          </div>
          <p className="mt-0.5 truncate text-xs text-relaive-gray sm:text-sm">
            {report.clientName} · {report.suburb} · {timeAgo}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#1C2A38] sm:hidden">
            {formatCurrency(report.estimatedValue)}
            <span className="ml-2 font-normal text-relaive-gray">
              {report.beds}b · {report.baths}ba · {report.areaSqm}m²
            </span>
          </p>
        </div>

        <button
          type="button"
          className="hidden shrink-0 text-right sm:block"
          onClick={openReport}
        >
          <span className="block text-sm font-semibold tracking-tight text-[#1C2A38]">
            {formatCurrency(report.estimatedValue)}
          </span>
          <span className="mt-0.5 block text-xs text-relaive-gray sm:text-sm">
            {report.beds}b · {report.baths}ba · {report.areaSqm}m²
          </span>
        </button>

        <label className="relative shrink-0">
          <span className="sr-only">Report status</span>
          <select
            value={report.status}
            aria-label={`Status for ${report.address}`}
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(event) =>
              onStatusChange(report.id, event.target.value as ReportListCardStatus)
            }
          >
            <option value="generated">Generated</option>
            <option value="shared">Shared</option>
          </select>
          <AgentClientReportStatusBadge status={report.status} />
        </label>

        <button
          type="button"
          aria-label={`Open report: ${report.address}`}
          className="hidden shrink-0 text-relaive-gray/50 sm:block"
          onClick={openReport}
        >
          <ChevronIcon />
        </button>
      </div>
    </Card>
  )
}
