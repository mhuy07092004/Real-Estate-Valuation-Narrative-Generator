import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { DataTableTab } from '../../../../components/ui/table/data-table'
import {
  ChevronIcon,
  ClientTable,
  formatFollowUpLabel,
  reportLabel,
  StarIcon,
} from '../../../../components/ui/table/client-table'
import { getClientStatusLabel } from '../../../../components/ui/table/status-badge'
import { Button } from '../../../../components/ui/button/button'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getClientListMockData, getClientListSummary, type ClientItem } from '../../../../services/agent'
import { ClientStageDropdown } from '../../../features/dashboard/components/clients/client-stage-dropdown'
import { ClientDetailPanel } from '../../../features/dashboard/components/clients/client-detail-panel'
import { AddClientModal } from '../../../features/dashboard/components/clients/add-client-modal'
import { updateClient } from '../../../services/agent'

// v2 reskin of the Agent Clients page (figma: ClientsPage.tsx). Reuses ClientTable
// (search + tabs) unchanged from v1 — only the status column and the surrounding
// page chrome (Add Client, detail panel) are new. All data is real.
// See figma-ui-migration-plan.md §9.1 / §9.4 step 2.

const CLIENT_TABS: DataTableTab<ClientItem>[] = [
  { id: 'all', label: 'All' },
  { id: 'prospecting', label: 'Prospecting', filter: (item) => item.status === 'prospecting' },
  { id: 'active', label: 'Active', filter: (item) => item.status === 'active' },
  { id: 'appraisal_sent', label: 'Appraisal Sent', filter: (item) => item.status === 'appraisal_sent' },
  { id: 'listing', label: 'Listing', filter: (item) => item.status === 'listing' },
  { id: 'sold', label: 'Sold', filter: (item) => item.status === 'sold' },
]

export function ClientsV2() {
  const [listVersion, setListVersion] = useState(0)
  const { data: clients } = useAsyncData(getClientListMockData, [listVersion])
  const { data: summary } = useAsyncData(getClientListSummary, [listVersion])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [showAddClient, setShowAddClient] = useState(false)

  const refresh = () => setListVersion((version) => version + 1)

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
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500 text-sm font-semibold text-white" aria-hidden="true">
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
                <span className="truncate text-xs text-relaive-gray">{reportLabel(item.reportCount)}</span>
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
          <span className="truncate text-sm text-relaive-navy">{row.original.address ?? 'No property linked'}</span>
        ),
        sortingFn: (rowA, rowB) => (rowA.original.address ?? '').localeCompare(rowB.original.address ?? ''),
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => getClientStatusLabel(row.status),
        cell: ({ row }) => (
          <div onClick={(event) => event.stopPropagation()}>
            <ClientStageDropdown
              status={row.original.status}
              onChange={async (status) => {
                await updateClient(row.original.id, { status })
                refresh()
              }}
            />
          </div>
        ),
        sortingFn: (rowA, rowB) =>
          getClientStatusLabel(rowA.original.status).localeCompare(getClientStatusLabel(rowB.original.status)),
      },
      {
        id: 'date',
        header: 'Date',
        accessorFn: (row) => row.followUpAt,
        cell: ({ row }) => {
          const followUp = formatFollowUpLabel(row.original.followUpAt)
          const toneClass =
            followUp.tone === 'today' ? 'text-red-500' : followUp.tone === 'tomorrow' ? 'text-orange-600' : 'text-relaive-gray'
          return <span className={`text-xs ${toneClass}`}>{followUp.label}</span>
        },
        sortingFn: (rowA, rowB) => new Date(rowA.original.followUpAt).getTime() - new Date(rowB.original.followUpAt).getTime(),
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
      <header className="flex items-start justify-between gap-4 px-4 pt-4 font-sans sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">Clients</h1>
          <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">
            {summary.totalClients} clients, {summary.followUpsDueSoon} follow-ups due soon
          </p>
        </div>
        <Button type="button" variant="primary" size="md" onClick={() => setShowAddClient(true)}>
          Add Client
        </Button>
      </header>

      <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
        <div className={selectedClient ? 'flex flex-col gap-5 lg:flex-row lg:items-start' : undefined}>
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
              <ClientDetailPanel client={selectedClient} onClientUpdated={refresh} />
            </div>
          )}
        </div>
      </div>

      {showAddClient ? (
        <AddClientModal
          onClose={() => setShowAddClient(false)}
          onCreated={() => {
            refresh()
          }}
        />
      ) : null}
    </div>
  )
}
