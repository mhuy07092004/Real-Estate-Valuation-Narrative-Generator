import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { DataTableTab } from '../../../components/ui/table/data-table'
import {
  ChevronIcon,
  ClientTable,
  formatFollowUpLabel,
  reportLabel,
  StarIcon,
} from '../../../components/ui/table/client-table'
import {
  ClientStatusBadge,
  getClientStatusLabel,
} from '../../../components/ui/table/status-badge'
import { DetailCard } from '../../../features/dashboard/components/detail_card'
import { useAsyncData } from '../../../hooks/use-async-data'
import {
  getClientListMockData,
  getClientListSummary,
  type ClientItem,
} from '../../../services/agent'

const CLIENT_TABS: DataTableTab<ClientItem>[] = [
  { id: 'all', label: 'All' },
  {
    id: 'prospecting',
    label: 'Prospecting',
    filter: (item) => item.status === 'prospecting',
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

export function ClientAgent() {
  const { data: clients } = useAsyncData(getClientListMockData, [])
  const { data: summary } = useAsyncData(getClientListSummary, [])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  const columns = useMemo<ColumnDef<ClientItem, unknown>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        accessorFn: (row) => row.name,
        cell: ({ row }) => {
          const item = row.original
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
                  {reportLabel(item.reportCount)}
                </span>
              </div>
            </div>
          )
        },
      },
      {
        id: 'address',
        header: 'Address',
        accessorFn: (row) => row.address ?? '',
        cell: ({ row }) => (
          <span className="truncate text-sm text-relaive-navy">
            {row.original.address ?? 'No property linked'}
          </span>
        ),
        sortingFn: (rowA, rowB) =>
          (rowA.original.address ?? '').localeCompare(rowB.original.address ?? ''),
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => getClientStatusLabel(row.status),
        cell: ({ row }) => <ClientStatusBadge status={row.original.status} />,
        sortingFn: (rowA, rowB) =>
          getClientStatusLabel(rowA.original.status).localeCompare(
            getClientStatusLabel(rowB.original.status),
          ),
      },
      {
        id: 'date',
        header: 'Date',
        accessorFn: (row) => row.followUpAt,
        cell: ({ row }) => {
          const followUp = formatFollowUpLabel(row.original.followUpAt)
          const toneClass =
            followUp.tone === 'today'
              ? 'text-red-500'
              : followUp.tone === 'tomorrow'
                ? 'text-orange-600'
                : 'text-relaive-gray'

          return <span className={`text-xs ${toneClass}`}>{followUp.label}</span>
        },
        sortingFn: (rowA, rowB) =>
          new Date(rowA.original.followUpAt).getTime() -
          new Date(rowB.original.followUpAt).getTime(),
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

  if (!clients || !summary) {
    return <div className="p-6 text-sm text-relaive-gray sm:p-8">Loading clients…</div>
  }

  const selectedClient = clients.find((client) => client.id === selectedClientId) ?? null

  const handleRowClick = (item: ClientItem) => {
    setSelectedClientId((current) => (current === item.id ? null : item.id))
  }

  return (
    <div className="flex flex-col">
      <header className="font-sans px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
          Clients
        </h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">
          {summary.totalClients} clients, {summary.followUpsDueSoon} follow-ups due soon
        </p>
      </header>

      <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
        <div
          className={
            selectedClient
              ? 'flex flex-col gap-5 lg:flex-row lg:items-start'
              : undefined
          }
        >
          <div className={selectedClient ? 'min-w-0 lg:flex-[7]' : undefined}>
            <ClientTable
              clients={clients}
              columns={columns}
              tabs={CLIENT_TABS}
              defaultTabId="all"
              compactTabs={selectedClient != null}
              searchPlaceholder="Search clients, properties..."
              emptyMessage="No clients match your search."
              onRowClick={handleRowClick}
              selectedRowId={selectedClientId ?? undefined}
            />
          </div>

          {selectedClient && (
            <div className="lg:flex-[3]">
              <DetailCard client={selectedClient} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
