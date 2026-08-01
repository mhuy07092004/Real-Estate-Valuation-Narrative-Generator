import { useEffect, useState } from 'react'
import { Button } from '../../../components/ui/button/button'
import { ClientStatusBadge } from '../../../components/ui/table/status-badge'
import { updateClientNotes, type ClientItem } from '../../../services/agent'

function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M4 7l8 6 8-6"
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
        d="M8.5 4.5h2.2l1 3.2-1.6 1.1a12.5 12.5 0 005.1 5.1l1.1-1.6 3.2 1v2.2a2 2 0 01-2.2 2A14.5 14.5 0 016.5 6.7a2 2 0 012-2.2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s-6-5.2-6-10a6 6 0 1112 0c0 4.8-6 10-6 10z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2.25" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

type DetailCardProps = {
  client: ClientItem
  className?: string
  onNotesUpdated?: (client: ClientItem) => void
}

export function DetailCard({ client, className = '', onNotesUpdated }: DetailCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftNotes, setDraftNotes] = useState(client.notes)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsEditing(false)
    setDraftNotes(client.notes)
    setError(null)
    setIsSaving(false)
  }, [client.id, client.notes])

  const startEditing = () => {
    setDraftNotes(client.notes)
    setError(null)
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setDraftNotes(client.notes)
    setError(null)
    setIsEditing(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const updated = await updateClientNotes(client.id, draftNotes)
      onNotesUpdated?.(updated)
      setIsEditing(false)
    } catch {
      setError('Could not save notes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <aside
      className={`flex h-full flex-col rounded-3xl border border-black/5 bg-white p-5 shadow-[0_4px_24px_rgba(26,32,44,0.06)] sm:p-6 ${className}`}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-500 text-sm font-semibold text-white"
          aria-hidden="true"
        >
          {client.initials}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-bold text-relaive-navy">{client.name}</h2>
          <div className="mt-1.5">
            <ClientStatusBadge status={client.status} />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5 text-sm text-relaive-primary">
          <EmailIcon />
          <span className="truncate">{client.email}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-relaive-primary">
          <PhoneIcon />
          <span>{client.phone}</span>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-relaive-gray">
          Linked Properties
        </h3>
        <div className="mt-2.5 flex items-start gap-2.5 text-sm text-relaive-navy">
          <span className="mt-0.5 shrink-0 text-relaive-primary">
            <PinIcon />
          </span>
          <span>{client.address ?? 'No property linked'}</span>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-relaive-gray">
          Notes
        </h3>
        {isEditing ? (
          <div className="mt-2.5 flex flex-col gap-2">
            <textarea
              value={draftNotes}
              onChange={(event) => setDraftNotes(event.target.value)}
              rows={4}
              disabled={isSaving}
              className="w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm leading-relaxed text-relaive-navy placeholder:text-relaive-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary disabled:opacity-60"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="w-full rounded-xl"
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full rounded-xl border border-black/15 bg-gray-100 hover:bg-gray-200/80"
                disabled={isSaving}
                onClick={cancelEditing}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-2.5 text-sm leading-relaxed text-relaive-navy">{client.notes}</p>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-8">
        <Button type="button" variant="primary" size="md" className="w-full rounded-xl">
          Generate Report
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="w-full rounded-xl border border-black/15 bg-gray-100 hover:bg-gray-200/80"
            disabled={isEditing || isSaving}
            onClick={startEditing}
          >
            Add Note
          </Button>
          <Button
            type="button"
            variant="outline"
            size="md"
            className="w-full rounded-xl border border-black/15 bg-gray-100 hover:bg-gray-200/80"
          >
            Schedule
          </Button>
        </div>
      </div>
    </aside>
  )
}
