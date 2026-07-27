import type { CaseStatus } from '../../../services/mock-dashboard'
import type { ClientStatus } from '../../../services/mock-agent'
import type { EvidenceStatus } from '../../../services/mock-valuer'

const STATUS_STYLES: Record<CaseStatus, { bg: string; text: string; dot: string; label: string }> = {
  valuer_review: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    dot: 'bg-blue-500',
    label: 'Valuer Review',
  },
  evidence_collection: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    dot: 'bg-orange-500',
    label: 'Evidence Collection',
  },
  reviewer_approval: {
    bg: 'bg-teal-50',
    text: 'text-teal-600',
    dot: 'bg-teal-500',
    label: 'Reviewer Approval',
  },
  approved: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    dot: 'bg-emerald-500',
    label: 'Approved',
  },
  exported: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    dot: 'bg-emerald-600',
    label: 'Exported',
  },
  draft: {
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    dot: 'bg-gray-400',
    label: 'Draft',
  },
  returned_for_revision: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    dot: 'bg-red-500',
    label: 'Returned for Revision',
  },
}

export function getCaseStatusLabel(status: CaseStatus): string {
  return STATUS_STYLES[status].label
}

type StatusBadgeProps = {
  status: CaseStatus
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${styles.bg} ${styles.text} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} aria-hidden="true" />
      {styles.label}
    </span>
  )
}

const EVIDENCE_STATUS_STYLES: Record<
  EvidenceStatus,
  { bg: string; text: string; dot: string; label: string }
> = {
  verified: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    dot: 'bg-emerald-500',
    label: 'Verified',
  },
  pending: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    dot: 'bg-orange-500',
    label: 'Pending',
  },
  missing: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    dot: 'bg-red-500',
    label: 'Missing',
  },
}

export function getEvidenceStatusLabel(status: EvidenceStatus): string {
  return EVIDENCE_STATUS_STYLES[status].label
}

type EvidenceStatusBadgeProps = {
  status: EvidenceStatus
  className?: string
}

export function EvidenceStatusBadge({ status, className = '' }: EvidenceStatusBadgeProps) {
  const styles = EVIDENCE_STATUS_STYLES[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${styles.bg} ${styles.text} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} aria-hidden="true" />
      {styles.label}
    </span>
  )
}

const CLIENT_STATUS_STYLES: Record<
  ClientStatus,
  { bg: string; text: string; label: string }
> = {
  appraisal_sent: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    label: 'Appraisal Sent',
  },
  active: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    label: 'Active',
  },
  listing: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    label: 'Listing',
  },
  prospecting: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    label: 'Prospecting',
  },
  sold: {
    bg: 'bg-teal-50',
    text: 'text-teal-600',
    label: 'Sold',
  },
}

export function getClientStatusLabel(status: ClientStatus): string {
  return CLIENT_STATUS_STYLES[status].label
}

type ClientStatusBadgeProps = {
  status: ClientStatus
  className?: string
}

export function ClientStatusBadge({ status, className = '' }: ClientStatusBadgeProps) {
  const styles = CLIENT_STATUS_STYLES[status]

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${styles.bg} ${styles.text} ${className}`}
    >
      {styles.label}
    </span>
  )
}
