import { useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { gsap, useGSAP } from '../../../lib/gsap'
import { Button } from '../../../components/ui/button/button'
import { Card } from '../../../components/ui/card/card'
import { Input } from '../../../components/ui/input/input'
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
  'appraisal_sent',
  'prospecting',
  'listing',
  'sold',
]

const NEW_CLIENT_STAGE_OPTIONS: ClientStatus[] = [
  'prospecting',
  'appraisal_sent',
  'listing',
  'sold',
]

type NewClientForm = {
  fullName: string
  email: string
  phone: string
  stage: ClientStatus
  address: string
  notes: string
}

const EMPTY_NEW_CLIENT_FORM: NewClientForm = {
  fullName: '',
  email: '',
  phone: '',
  stage: 'prospecting',
  address: '',
  notes: '',
}

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

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M3 7l9 6 9-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5c0-.55.45-1 1-1h2.5a1 1 0 0 1 .97.76l.87 3.49a1 1 0 0 1-.27.96L7.5 10.83a12.5 12.5 0 0 0 5.67 5.67l1.62-1.57a1 1 0 0 1 .96-.27l3.49.87a1 1 0 0 1 .76.97V19a1 1 0 0 1-1 1h-1C9.6 20 4 14.4 4 6V5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
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

type AddClientModalProps = {
  form: NewClientForm
  isValid: boolean
  onChange: (patch: Partial<NewClientForm>) => void
  onCancel: () => void
  onSubmit: () => void
}

function AddClientModal({ form, isValid, onChange, onCancel, onSubmit }: AddClientModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-[#1C2A38]">New Client</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="flex size-7 items-center justify-center rounded-full text-relaive-gray hover:bg-black/5"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          <Input
            label="Full Name *"
            placeholder="e.g. Sarah Mitchell"
            value={form.fullName}
            onChange={(event) => onChange({ fullName: event.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              placeholder="name@email.com"
              startIcon={<MailIcon />}
              value={form.email}
              onChange={(event) => onChange({ email: event.target.value })}
            />
            <Input
              label="Phone *"
              type="tel"
              placeholder="0400 000 000"
              startIcon={<PhoneIcon />}
              value={form.phone}
              onChange={(event) => onChange({ phone: event.target.value })}
            />
          </div>

          <div>
            <p className="text-sm font-medium text-relaive-navy">Client Stage</p>
            <div className="mt-1.5 inline-flex flex-wrap items-center gap-1.5">
              {NEW_CLIENT_STAGE_OPTIONS.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => onChange({ stage })}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    form.stage === stage
                      ? 'bg-relaive-primary text-white'
                      : 'bg-[#EEF1F4] text-relaive-navy hover:text-relaive-navy'
                  }`}
                >
                  {getClientStatusLabel(stage)}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Property Address *"
            placeholder="e.g. 45 Park Ave, Richmond VIC 3121"
            startIcon={<PinIcon />}
            value={form.address}
            onChange={(event) => onChange({ address: event.target.value })}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-client-notes" className="text-sm font-medium text-relaive-navy">
              Notes
            </label>
            <textarea
              id="new-client-notes"
              rows={3}
              placeholder="Key details about this client — motivation, preferences, timeline..."
              value={form.notes}
              onChange={(event) => onChange({ notes: event.target.value })}
              className="w-full resize-none rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm text-relaive-navy placeholder:text-relaive-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="gap-1.5 rounded-full bg-[#5DA7AC] px-4 hover:bg-[#4E969B]"
            disabled={!isValid}
            onClick={onSubmit}
          >
            <PlusIcon />
            Add Client
          </Button>
        </div>
      </div>
    </div>
  )
}

type ClientDetailPanelProps = {
  client: ClientItem
}

function ClientDetailPanel({ client }: ClientDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!panelRef.current) return
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, x: 20, scale: 0.97 },
        { opacity: 1, x: 0, scale: 1, duration: 0.4, ease: 'power3.out' },
      )
    },
    { dependencies: [client.id], scope: panelRef },
  )

  return (
    <div ref={panelRef}>
      <Card className="flex h-full flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#5DA7AC] text-base font-semibold text-white">
            {client.initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight text-[#1C2A38]">
              {client.name}
            </p>
            <div className="mt-1">
              <ClientStatusBadge status={client.status} showChevron />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 text-sm">
          <a
            href={`mailto:${client.email}`}
            className="flex items-center gap-2 truncate text-relaive-primary hover:underline"
          >
            <span className="shrink-0 text-relaive-gray">
              <MailIcon />
            </span>
            <span className="truncate">{client.email}</span>
          </a>
          <div className="flex items-center gap-2 text-relaive-navy">
            <span className="shrink-0 text-relaive-gray">
              <PhoneIcon />
            </span>
            {client.phone}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-relaive-gray">
            Linked Property
          </p>
          <div className="mt-1.5 flex items-start gap-2 text-sm text-relaive-navy">
            <span className="mt-0.5 shrink-0 text-relaive-gray">
              <PinIcon />
            </span>
            <span>{client.address ?? 'No property linked'}</span>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-relaive-gray">Notes</p>
          <p className="mt-1.5 text-sm leading-relaxed text-relaive-navy/80">
            {client.notes || 'No notes yet.'}
          </p>
        </div>

        <Button
          size="sm"
          className="mt-auto w-full rounded-full bg-[#5DA7AC] hover:bg-[#4E969B]"
        >
          Edit Client
        </Button>
      </Card>
    </div>
  )
}

export function ClientAgent() {
  const { data, isLoading } = useAsyncData(getClientListPageMockData, [])
  const [clients, setClients] = useState<ClientItem[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ClientStatus>('all')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newClientForm, setNewClientForm] = useState<NewClientForm>(EMPTY_NEW_CLIENT_FORM)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  useEffect(() => {
    if (data) setClients(data)
  }, [data])

  const isNewClientValid =
    newClientForm.fullName.trim().length > 0 &&
    newClientForm.phone.trim().length > 0 &&
    newClientForm.address.trim().length > 0

  function handleNewClientChange(patch: Partial<NewClientForm>) {
    setNewClientForm((current) => ({ ...current, ...patch }))
  }

  function closeAddClientModal() {
    setIsAddOpen(false)
    setNewClientForm(EMPTY_NEW_CLIENT_FORM)
  }

  function toInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return 'CL'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  }

  function handleAddClient() {
    if (!isNewClientValid) return

    const newClient: ClientItem = {
      id: `CL-${Date.now()}`,
      name: newClientForm.fullName.trim(),
      initials: toInitials(newClientForm.fullName),
      isStarred: false,
      address: newClientForm.address.trim(),
      email: newClientForm.email.trim(),
      phone: newClientForm.phone.trim(),
      notes: newClientForm.notes.trim(),
      reportCount: 0,
      status: newClientForm.stage,
      followUpAt: new Date().toISOString(),
    }

    setClients((current) => [newClient, ...current])
    closeAddClientModal()
  }

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

  const selectedClient = clients.find((client) => client.id === selectedClientId) ?? null

  function handleSelectClient(id: string) {
    setSelectedClientId((current) => (current === id ? null : id))
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
            onClick={() => setIsAddOpen(true)}
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

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0 lg:flex-[7]">
            {isLoading && clients.length === 0 ? (
              <p className="text-sm text-relaive-gray">Loading clients…</p>
            ) : visibleClients.length === 0 ? (
              <p className="text-sm text-relaive-gray">No clients match your search.</p>
            ) : (
              <Card className="overflow-hidden p-0! sm:p-0!">
                <ul className="divide-y divide-black/5">
                  {visibleClients.map((client) => {
                    const isSelected = client.id === selectedClientId
                    return (
                      <li key={client.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectClient(client.id)}
                          aria-pressed={isSelected}
                          className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors sm:gap-4 sm:px-6 ${
                            isSelected ? 'bg-[#F1F6F7]' : 'hover:bg-black/[0.02]'
                          }`}
                        >
                          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#5DA7AC] text-sm font-semibold text-white">
                            {client.initials}
                          </span>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold tracking-tight text-[#1C2A38] sm:text-[15px]">
                              {client.name}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-relaive-gray sm:text-sm">
                              {client.address ?? 'No property linked'} ·{' '}
                              {reportLabel(client.reportCount)}
                            </p>
                            <p className="mt-0.5 text-xs text-relaive-gray/80">
                              Last contact {lastContactLabel(client.followUpAt)}
                            </p>
                          </div>

                          <label
                            className="relative shrink-0"
                            onClick={(event) => event.stopPropagation()}
                          >
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

                          <span
                            className={`hidden shrink-0 text-relaive-gray/50 transition-transform duration-200 sm:block ${
                              isSelected ? 'rotate-90' : ''
                            }`}
                          >
                            <ChevronIcon />
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </Card>
            )}
          </div>

          {selectedClient ? (
            <div className="lg:flex-[3] lg:shrink-0">
              <ClientDetailPanel client={selectedClient} />
            </div>
          ) : null}
        </div>
      </div>

      {isAddOpen ? (
        <AddClientModal
          form={newClientForm}
          isValid={isNewClientValid}
          onChange={handleNewClientChange}
          onCancel={closeAddClientModal}
          onSubmit={handleAddClient}
        />
      ) : null}
    </div>
  )
}
