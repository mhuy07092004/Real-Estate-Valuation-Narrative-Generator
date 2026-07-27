import type { ColumnDef } from '@tanstack/react-table'
import dayjs from 'dayjs'
import type { ClientItem } from '../../../services/mock-agent'
import { DataTable, type DataTableTab } from './data-table'
import { getClientStatusLabel } from './status-badge'

type ClientTableProps = {
  clients: ClientItem[]
  columns: ColumnDef<ClientItem, unknown>[]
  className?: string
  tabs?: DataTableTab<ClientItem>[]
  defaultTabId?: string
  searchPlaceholder?: string
  emptyMessage?: string
}

export function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9 6.7 19.6l1-5.8-4.2-4.1 5.9-.9L12 3.5z" />
    </svg>
  )
}

export function ChevronIcon() {
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

export function formatFollowUpLabel(followUpAt: string): {
  label: string
  tone: 'today' | 'tomorrow' | 'later'
} {
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

export function reportLabel(count: number): string {
  return count === 1 ? '1 report' : `${count} reports`
}

export function ClientTable({
  clients,
  columns,
  className = '',
  tabs,
  defaultTabId = 'all',
  searchPlaceholder = 'Search clients, properties...',
  emptyMessage = 'No clients match your search.',
}: ClientTableProps) {
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
