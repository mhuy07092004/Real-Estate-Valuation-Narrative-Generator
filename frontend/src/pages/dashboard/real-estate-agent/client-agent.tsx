import type { DataTableTab } from '../../../components/ui/table/data-table'
import { ClientTable } from '../../../components/ui/table/client-table'
import {
  getClientListMockData,
  getClientListSummary,
  type ClientItem,
} from '../../../services/mock-client-service'

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

export function ClientAgent() {
  const clients = getClientListMockData()
  const { totalClients, followUpsDueSoon } = getClientListSummary()

  return (
    <div className="flex flex-col">
      <header className="font-sans px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
          Clients
        </h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">
          {totalClients} clients, {followUpsDueSoon} follow-ups due soon
        </p>
      </header>

      <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
        <ClientTable
          clients={clients}
          tabs={CLIENT_TABS}
          defaultTabId="all"
          searchPlaceholder="Search clients, properties..."
          emptyMessage="No clients match your search."
        />
      </div>
    </div>
  )
}
