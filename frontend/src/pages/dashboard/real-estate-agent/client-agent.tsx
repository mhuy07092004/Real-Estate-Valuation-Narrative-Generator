import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Button } from '../../../components/ui/button/button'
import { Card } from '../../../components/ui/card/card'
import { AddressSearch } from '../../../components/ui/search-bar/address-search'
import { ChevronIcon, reportLabel } from '../../../components/ui/table/client-table'
import { ClientStatusBadge, getClientStatusLabel } from '../../../components/ui/table/status-badge'
import { useAsyncData } from '../../../hooks/use-async-data'
import {
  getClientListPageMockData,
  type ClientItem,
  type ClientStatus,
} from '../../../services/agent'

dayjs.extend(relativeTime)

const STATUS_FILTERS: { id: 'all' | ClientStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'prospecting', label: 'Prospecting' },
  { id: 'appraisal_sent', label: 'Appraisal Sent' },
  { id: 'listing', label: 'Listing' },
  { id: 'sold', label: 'Sold' },
]

const STATUS_OPTIONS: ClientStatus[] = [
  'prospecting',
  'active',
  'appraisal_sent',
  'listing',
  'sold',
]

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function lastContactLabel(iso: string): string {
  const at = dayjs(iso).startOf('day')
  const today = dayjs().startOf('day')
  const diff = today.diff(at, 'day')
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff > 1) return `${diff} days ago`
  return at.fromNow()
}

export function ClientAgent() {
  const { data, isLoading } = useAsyncData(getClientListPageMockData, [])
  const [clients, setClients] = useState<ClientItem[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ClientStatus>('all')

  useEffect(() => {
    if (data) setClients(data)
  }, [data])

  const visibleClients = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return clients.filter((client) => {
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter
      const matchesQuery =
        needle.length === 0 ||
        client.name.toLowerCase().includes(needle) ||
        (client.address?.toLowerCase().includes(needle) ?? false) ||
        client.email.toLowerCase().includes(needle)
      return matchesStatus && matchesQuery
    })
  }, [clients, query, statusFilter])

  function handleStatusChange(id: string, status: ClientStatus) {
    setClients((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1 flex-col gap-6 p-4 sm:gap-7 sm:p-6 lg:p-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
              Clients
            </h1>
            <p className="mt-1 text-sm text-relaive-gray sm:text-base">
              {clients.length} {clients.length === 1 ? 'client' : 'clients'}
            </p>
          </div>
          <Button
            size="sm"
            className="gap-1.5 rounded-full bg-[#5DA7AC] px-4 hover:bg-[#4E969B]"
          >
            <PlusIcon />
            Add Client
          </Button>
        </header>

        <div className="flex flex-row flex-wrap items-center gap-3">
          <div className="w-[min(100%,20rem)] shrink-0">
            <AddressSearch
              placeholder="Search clients, properties..."
              className="max-w-none"
              inputClassName="border-black/10 py-2.5 shadow-none"
              iconPosition="left"
              readOnly={false}
              value={query}
              onChange={setQuery}
            />
          </div>
          <div className="inline-flex w-fit max-w-full shrink-0 flex-wrap items-center gap-0.5 rounded-full bg-[#EEF1F4] p-1">
            {STATUS_FILTERS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-[#6B8FA3] text-white'
                    : 'text-[#2D3748] hover:text-relaive-navy'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && clients.length === 0 ? (
          <p className="text-sm text-relaive-gray">Loading clients…</p>
        ) : visibleClients.length === 0 ? (
          <p className="text-sm text-relaive-gray">No clients match your search.</p>
        ) : (
          <Card className="overflow-hidden p-0! sm:p-0!">
            <ul className="divide-y divide-black/5">
              {visibleClients.map((client) => (
                <li key={client.id}>
                  <div className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#5DA7AC] text-sm font-semibold text-white">
                      {client.initials}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold tracking-tight text-[#1C2A38] sm:text-[15px]">
                        {client.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-relaive-gray sm:text-sm">
                        {client.address ?? 'No property linked'} · {reportLabel(client.reportCount)}
                      </p>
                      <p className="mt-0.5 text-xs text-relaive-gray/80">
                        Last contact {lastContactLabel(client.followUpAt)}
                      </p>
                    </div>

                    <label className="relative shrink-0">
                      <span className="sr-only">Client status</span>
                      <select
                        value={client.status}
                        aria-label={`Status for ${client.name}`}
                        className="absolute inset-0 cursor-pointer opacity-0"
                        onChange={(event) =>
                          handleStatusChange(client.id, event.target.value as ClientStatus)
                        }
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {getClientStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                      <ClientStatusBadge status={client.status} showChevron />
                    </label>

                    <span className="hidden shrink-0 text-relaive-gray/50 sm:block">
                      <ChevronIcon />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  )
}
