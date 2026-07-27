import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import dayjs from 'dayjs'
import type { ClientItem } from '../../../services/mock-client-service'
import { DataTable, type DataTableTab } from './data-table'
import { ClientStatusBadge, getClientStatusLabel } from './status-badge'

const CLIENT_TABS: DataTableTab<ClientItem>[] = [
  { id: 'all', label: 'All' },
  {
    id: 'prospecting',
    label: 'Prospecting',
    filter: (item) => item.status === 'prospecting',
  },
  {
    id: 'active',
    label: 'Active',
    filter: (item) => item.status === 'active',
  },
  {
    id: 'appraisal_sent',
    label: 'Appraisal Sent',
    filter: (item) => item.status === 'appraisal_sent',
  },
  {
    id: 'listing',
    label: 'Listing',
    filter: (item) => item.status === 'listing',
  },
  {
    id: 'sold',
    label: 'Sold',
    filter: (item) => item.status === 'sold',
  },
]

type ClientTableProps = {
  clients: ClientItem[]
  className?: string
  tabs?: DataTableTab<ClientItem>[]
  defaultTabId?: string
  searchPlaceholder?: string
  emptyMessage?: string
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9 6.7 19.6l1-5.8-4.2-4.1 5.9-.9L12 3.5z" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function formatFollowUpLabel(followUpAt: string): { label: string; tone: 'today' | 'tomorrow' | 'later' } {
  const followUp = dayjs(followUpAt).startOf('day')
  const today = dayjs().startOf('day')
  const tomorrow = today.add(1, 'day')

  if (followUp.isSame(today, 'day')) {
    return { label: 'Follow-up Today', tone: 'today' }
  }
  if (followUp.isSame(tomorrow, 'day')) {
    return { label: 'Follow-up Tomorrow', tone: 'tomorrow' }
  }
  return { label: `Follow-up ${followUp.format('MMM D')}`, tone: 'later' }
}

function reportLabel(count: number): string {
  return count === 1 ? '1 report' : `${count} reports`
}

export function ClientTable({
  clients,
  className = '',
  tabs = CLIENT_TABS,
  defaultTabId = 'all',
  searchPlaceholder = 'Search clients, properties...',
  emptyMessage = 'No clients match your search.',
}: ClientTableProps) {
  const columns = useMemo<ColumnDef<ClientItem, unknown>[]>(
    () => [
      {
        id: 'client',
        header: 'Client',
        accessorFn: (row) => row.name,
        cell: ({ row }) => {
          const item = row.original
          const propertyLabel = item.address ?? 'No property linked'
          return (
            <div className="flex items-center gap-3 py-1">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500 text-sm font-semibold text-white"
                aria-hidden="true"
              >
                {item.initials}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-relaive-navy">
                  {item.name}
                  {item.isStarred && (
                    <span className="text-amber-500" title="Starred client">
                      <StarIcon />
                    </span>
                  )}
                </span>
                <span className="truncate text-xs text-relaive-gray">
                  {propertyLabel} · {reportLabel(item.reportCount)}
                </span>
              </div>
            </div>
          )
        },
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => getClientStatusLabel(row.status),
        cell: ({ row }) => {
          const followUp = formatFollowUpLabel(row.original.followUpAt)
          const toneClass =
            followUp.tone === 'today'
              ? 'text-red-500'
              : followUp.tone === 'tomorrow'
                ? 'text-orange-600'
                : 'text-relaive-gray'

          return (
            <div className="flex flex-col items-end gap-1.5 py-1">
              <ClientStatusBadge status={row.original.status} />
              <span className={`text-xs ${toneClass}`}>{followUp.label}</span>
            </div>
          )
        },
        sortingFn: (rowA, rowB) =>
          getClientStatusLabel(rowA.original.status).localeCompare(
            getClientStatusLabel(rowB.original.status),
          ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: () => (
          <span className="flex justify-end text-relaive-gray/50" aria-hidden="true">
            <ChevronIcon />
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <DataTable
      data={clients}
      columns={columns}
      tabs={tabs}
      defaultTabId={defaultTabId}
      getRowId={(item) => item.id}
      searchPlaceholder={searchPlaceholder}
      searchFilter={(item, query) =>
        item.name.toLowerCase().includes(query) ||
        (item.address?.toLowerCase().includes(query) ?? false) ||
        getClientStatusLabel(item.status).toLowerCase().includes(query) ||
        item.initials.toLowerCase().includes(query)
      }
      emptyMessage={emptyMessage}
      className={className}
    />
  )
}
