import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { ConfidenceBar } from '../../../components/ui/table/confidence-bar'
import { ClockIcon, DataTable } from '../../../components/ui/table/data-table'
import {
  EvidenceStatusBadge,
  getEvidenceStatusLabel,
} from '../../../components/ui/table/status-badge'
import { useAsyncData } from '../../../hooks/use-async-data'
import {
  getEvidenceCentreMockData,
  getEvidenceListMockData,
  type EvidenceCategory,
  type EvidenceItem,
} from '../../../services/valuer'

dayjs.extend(relativeTime)

const CATEGORY_LABELS: Record<EvidenceCategory, string> = {
  comparable: 'Comparable',
  market: 'Market',
  document: 'Document',
  history: 'History',
  missing: 'Missing',
}

export function EvidenceCentre() {
  const { data } = useAsyncData(getEvidenceCentreMockData, [])
  const { data: evidence } = useAsyncData(getEvidenceListMockData, [])

  const columns = useMemo<ColumnDef<EvidenceItem, unknown>[]>(
    () => [
      {
        id: 'evidence',
        header: 'Evidence/Detail',
        accessorFn: (row) => row.title,
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex flex-col gap-1 py-1">
              <span className="text-xs font-semibold text-relaive-primary">{item.id}</span>
              <span className="text-sm font-bold text-relaive-navy">{item.title}</span>
              <span className="text-xs text-relaive-gray">{item.detail}</span>
            </div>
          )
        },
      },
      {
        id: 'category',
        header: 'Category',
        accessorFn: (row) => CATEGORY_LABELS[row.category],
        cell: ({ row }) => (
          <span className="text-sm text-relaive-navy">{CATEGORY_LABELS[row.original.category]}</span>
        ),
      },
      {
        id: 'source',
        header: 'Source',
        accessorFn: (row) => row.source,
        enableSorting: false,
        cell: ({ row }) => <span className="text-sm text-relaive-navy">{row.original.source}</span>,
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => getEvidenceStatusLabel(row.status),
        cell: ({ row }) => <EvidenceStatusBadge status={row.original.status} />,
        sortingFn: (rowA, rowB) =>
          getEvidenceStatusLabel(rowA.original.status).localeCompare(
            getEvidenceStatusLabel(rowB.original.status),
          ),
      },
      {
        id: 'confidence',
        header: 'Confidence',
        accessorFn: (row) => row.confidence,
        cell: ({ row }) => <ConfidenceBar value={row.original.confidence} />,
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.confidence
          const b = rowB.original.confidence
          if (a == null && b == null) return 0
          if (a == null) return -1
          if (b == null) return 1
          return a - b
        },
      },
      {
        id: 'updated',
        header: 'Updated',
        accessorFn: (row) => row.updatedAt,
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 text-sm text-relaive-gray">
            <ClockIcon />
            {dayjs(row.original.updatedAt).fromNow()}
          </span>
        ),
        sortingFn: (rowA, rowB) =>
          new Date(rowA.original.updatedAt).getTime() - new Date(rowB.original.updatedAt).getTime(),
      },
    ],
    [],
  )

  if (!data || !evidence) {
    return <div className="p-6 text-sm text-relaive-gray sm:p-8">Loading evidence centre…</div>
  }

  return (
    <div className="flex flex-col">
      <header className="font-sans px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
          Evidence Centre
        </h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">
          {data.totalItems} total items, {data.missingCount} missing evidence
        </p>
      </header>

      <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
        <DataTable
          data={evidence}
          columns={columns}
          getRowId={(item) => item.id}
          searchPlaceholder="Search evidence, sources, documents..."
          searchFilter={(item, query) =>
            item.title.toLowerCase().includes(query) ||
            item.detail.toLowerCase().includes(query) ||
            item.source.toLowerCase().includes(query) ||
            item.id.toLowerCase().includes(query)
          }
          emptyMessage="No evidence matches your search."
        />
      </div>
    </div>
  )
}
