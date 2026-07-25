import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import type { CaseItem } from '../../../services/mock-case-service'
import { ConfidenceBar } from './confidence-bar'
import { ClockIcon, DataTable, WarningIcon, type DataTableTab } from './data-table'
import { getCaseStatusLabel, StatusBadge } from './status-badge'

dayjs.extend(relativeTime)

const TERMINAL_STATUSES = new Set<CaseItem['status']>(['approved', 'exported', 'returned_for_revision'])

const CASE_TABS: DataTableTab<CaseItem>[] = [
  { id: 'all', label: 'All' },
  {
    id: 'in_progress',
    label: 'In Progress',
    filter: (item) => !TERMINAL_STATUSES.has(item.status),
  },
  {
    id: 'my_cases',
    label: 'My Cases',
    // Placeholder: no case-ownership field in the mock data yet, so this
    // behaves like "All" until the backend exposes an assignee/owner.
  },
  {
    id: 'returned',
    label: 'Returned',
    filter: (item) => item.status === 'returned_for_revision',
  },
]

type CaseTableProps = {
  cases: CaseItem[]
  className?: string
  tabs?: DataTableTab<CaseItem>[]
  defaultTabId?: string
  searchPlaceholder?: string
  emptyMessage?: string
}

export function CaseTable({
  cases,
  className = '',
  tabs = CASE_TABS,
  defaultTabId = 'all',
  searchPlaceholder = 'Search cases, properties, clients...',
  emptyMessage = 'No cases match your search.',
}: CaseTableProps) {
  const columns = useMemo<ColumnDef<CaseItem, unknown>[]>(
    () => [
      {
        id: 'property',
        header: 'Property/Client',
        accessorFn: (row) => row.address,
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex flex-col gap-1 py-1">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-relaive-primary">
                {item.id}
                {item.hasWarning && (
                  <span className="text-orange-500" title="Needs attention">
                    <WarningIcon />
                  </span>
                )}
              </span>
              <span className="text-sm font-bold text-relaive-navy">{item.address}</span>
              <span className="text-xs text-relaive-gray">
                {item.suburb} · {item.clientName}
              </span>
            </div>
          )
        },
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => getCaseStatusLabel(row.status),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        sortingFn: (rowA, rowB) =>
          getCaseStatusLabel(rowA.original.status).localeCompare(getCaseStatusLabel(rowB.original.status)),
      },
      {
        id: 'purpose',
        header: 'Purpose',
        accessorFn: (row) => row.purpose,
        enableSorting: false,
        cell: ({ row }) => <span className="text-sm text-relaive-navy">{row.original.purpose}</span>,
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

  return (
    <DataTable
      data={cases}
      columns={columns}
      tabs={tabs}
      defaultTabId={defaultTabId}
      getRowId={(item) => item.id}
      searchPlaceholder={searchPlaceholder}
      searchFilter={(item, query) =>
        item.id.toLowerCase().includes(query) ||
        item.address.toLowerCase().includes(query) ||
        item.clientName.toLowerCase().includes(query)
      }
      emptyMessage={emptyMessage}
      className={className}
    />
  )
}
