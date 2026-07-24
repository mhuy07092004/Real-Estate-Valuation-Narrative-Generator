import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type FilterFn,
  type SortingState,
} from '@tanstack/react-table'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import type { CaseItem } from '../../../services/mock-case-service'
import { ConfidenceBar } from './confidence-bar'
import { getCaseStatusLabel, StatusBadge } from './status-badge'

dayjs.extend(relativeTime)

type CaseTab = 'all' | 'in_progress' | 'my_cases' | 'returned'

const TABS: { id: CaseTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'my_cases', label: 'My Cases' },
  { id: 'returned', label: 'Returned' },
]

const TERMINAL_STATUSES = new Set<CaseItem['status']>(['approved', 'exported', 'returned_for_revision'])

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function FunnelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5h16l-6 7.5v5.5l-4 2v-7.5L4 5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5v11m0 0l-4-4m4 4l4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4.5 17v2.5a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8v4.5l3 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5L2.5 20h19L12 3.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 9.5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="17.2" r="0.9" fill="currentColor" />
    </svg>
  )
}

function SortIcon({ direction }: { direction: 'asc' | 'desc' | false }) {
  if (!direction) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-relaive-gray/40">
        <path d="M7 9l5-5 5 5M7 15l5 5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={direction === 'desc' ? 'rotate-180' : ''}
    >
      <path d="M7 14l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const globalFilterFn: FilterFn<CaseItem> = (row, _columnId, filterValue: string) => {
  const query = filterValue.trim().toLowerCase()
  if (!query) return true

  const { id, address, clientName } = row.original
  return (
    id.toLowerCase().includes(query) ||
    address.toLowerCase().includes(query) ||
    clientName.toLowerCase().includes(query)
  )
}

type CaseTableProps = {
  cases: CaseItem[]
  className?: string
}

export function CaseTable({ cases, className = '' }: CaseTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [activeTab, setActiveTab] = useState<CaseTab>('all')

  const tabFilteredData = useMemo(() => {
    switch (activeTab) {
      case 'in_progress':
        return cases.filter((item) => !TERMINAL_STATUSES.has(item.status))
      case 'returned':
        return cases.filter((item) => item.status === 'returned_for_revision')
      case 'my_cases':
        // Placeholder: no case-ownership field in the mock data yet, so this
        // behaves like "All" until the backend exposes an assignee/owner.
        return cases
      case 'all':
      default:
        return cases
    }
  }, [cases, activeTab])

  const columns = useMemo<ColumnDef<CaseItem>[]>(
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

  const table = useReactTable({
    data: tabFilteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <section
      className={`rounded-3xl border border-black/5 bg-white shadow-[0_4px_24px_rgba(26,32,44,0.06)] ${className}`}
    >
      <div className="flex flex-col gap-4 border-b border-black/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex w-full items-center sm:w-72">
            <span className="sr-only">Search cases</span>
            <input
              type="text"
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Search cases, properties, clients..."
              className="w-full rounded-full border border-black/10 bg-white py-2.5 pl-4 pr-10 text-sm text-relaive-navy placeholder:text-relaive-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
            />
            <span className="pointer-events-none absolute right-3.5 text-relaive-gray">
              <SearchIcon />
            </span>
          </label>

          <div className="inline-flex w-fit items-center gap-1 rounded-full bg-gray-100 p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-relaive-navy shadow-sm'
                    : 'text-relaive-gray hover:text-relaive-navy'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Coming soon"
            className="inline-flex items-center gap-2 rounded-lg border border-black/10 px-3.5 py-2 text-sm font-medium text-relaive-navy hover:bg-relaive-navy/5"
          >
            <FunnelIcon />
            Filters
          </button>
          <button
            type="button"
            title="Coming soon"
            className="inline-flex items-center gap-2 rounded-lg bg-relaive-primary px-3.5 py-2 text-sm font-medium text-white hover:bg-relaive-primary-hover"
          >
            <DownloadIcon />
            Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-gray-50/60">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  return (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-relaive-gray sm:px-6"
                    >
                      {canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1.5 hover:text-relaive-navy"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <SortIcon direction={header.column.getIsSorted()} />
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-black/5">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/60">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-4 align-top sm:px-6">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-relaive-gray">
                  No cases match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
