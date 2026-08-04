import { useId, useState } from 'react'
import { Input } from '../input/input'
import { BUTTON_FONT_CLASS } from '../button/button'

type SendReportTab = 'search' | 'email'

export type SendReportPayload = {
  clientName: string
  clientEmail: string
}

type SendReportCardProps = {
  onClose: () => void
  onSend?: (payload: SendReportPayload) => Promise<void>
  onSuccess?: () => void
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5 19c1.5-3.5 4-5 7-5s5.5 1.5 7 5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SuccessTickIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#10B981" />
      <path
        d="M8 12.5l2.5 2.5L16 9.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SendReportCard({ onClose, onSend, onSuccess }: SendReportCardProps) {
  const emailId = useId()
  const nameId = useId()
  const searchId = useId()
  const noteId = useId()
  const [tab, setTab] = useState<SendReportTab>('email')
  const [includeNote, setIncludeNote] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [search, setSearch] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [note, setNote] = useState(
    'Hi {name},\n\nPlease find attached the property appraisal report for your review. Happy to discuss any questions.\n\nBest regards',
  )

  const trimmedEmail = email.trim()

  const handleSend = async () => {
    setIsSubmitting(true)
    setErrorMessage(null)

    const fallbackName = search.trim()
    const payload: SendReportPayload = {
      clientName: name.trim() || fallbackName,
      clientEmail: trimmedEmail,
    }

    try {
      await onSend?.(payload)
      const recipient = payload.clientEmail || payload.clientName || 'without recipient details'
      setSentTo(recipient)
      onSuccess?.()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save and send report.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      aria-labelledby="send-report-title"
      className="w-full rounded-3xl border border-[#E5E7EB] bg-white px-5 py-6 shadow-[0_4px_24px_rgba(26,32,44,0.08)] sm:px-7 sm:py-7"
    >
      {sentTo ? (
        <div className="flex flex-col items-center px-2 py-6 text-center sm:py-8">
          <span className="text-emerald-500">
            <SuccessTickIcon />
          </span>
          <h2
            id="send-report-title"
            className="mt-4 text-lg font-semibold text-relaive-navy sm:text-xl"
          >
            Report sent successfully
          </h2>
          <p className="mt-2 text-sm text-relaive-gray">
            Delivered to <span className="font-medium text-relaive-navy">{sentTo}</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className={`mt-8 w-full rounded-xl bg-red-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-600 ${BUTTON_FONT_CLASS}`}
          >
            Close
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-relaive-secondary text-white">
                <MailIcon />
              </span>
              <h2
                id="send-report-title"
                className="text-base font-semibold text-relaive-navy sm:text-lg"
              >
                Send Report to Client
              </h2>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F3F4F6] text-relaive-gray transition-colors hover:bg-[#E5E7EB] hover:text-relaive-navy"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 rounded-full bg-[#F3F4F6] p-1">
            <button
              type="button"
              onClick={() => setTab('search')}
              className={`rounded-full px-3 py-2 text-sm font-medium transition-all ${
                tab === 'search'
                  ? 'bg-white text-relaive-navy shadow-sm'
                  : 'text-relaive-gray hover:text-relaive-navy'
              }`}
            >
              Search Client
            </button>
            <button
              type="button"
              onClick={() => setTab('email')}
              className={`rounded-full px-3 py-2 text-sm font-medium transition-all ${
                tab === 'email'
                  ? 'bg-white text-relaive-navy shadow-sm'
                  : 'text-relaive-gray hover:text-relaive-navy'
              }`}
            >
              Enter Email
            </button>
          </div>

          <div className="mt-5">
            {tab === 'email' ? (
              <div className="flex flex-col gap-2">
                <label
                  htmlFor={nameId}
                  className="text-[11px] font-semibold tracking-[0.08em] text-relaive-gray uppercase"
                >
                  Enter Client Name
                </label>
                <Input
                  id={nameId}
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Client full name"
                  startIcon={<UserIcon />}
                  className="rounded-xl border-0 bg-[#F3F4F6] focus-visible:ring-relaive-secondary"
                />

                <label
                  htmlFor={emailId}
                  className="text-[11px] font-semibold tracking-[0.08em] text-relaive-gray uppercase"
                >
                  Enter Client Email
                </label>
                <Input
                  id={emailId}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="client@email.com"
                  startIcon={<UserIcon />}
                  className="rounded-xl border-0 bg-[#F3F4F6] focus-visible:ring-relaive-secondary"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label
                  htmlFor={searchId}
                  className="text-[11px] font-semibold tracking-[0.08em] text-relaive-gray uppercase"
                >
                  Search Client
                </label>
                <Input
                  id={searchId}
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or email"
                  startIcon={<SearchIcon />}
                  className="rounded-xl border-0 bg-[#F3F4F6] focus-visible:ring-relaive-secondary"
                />
              </div>
            )}
          </div>

          {errorMessage ? (
            <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
          ) : null}

          <div className="mt-5">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={includeNote}
                onChange={(event) => setIncludeNote(event.target.checked)}
                className="h-4 w-4 rounded border-relaive-secondary/40 text-relaive-secondary accent-relaive-secondary focus-visible:ring-2 focus-visible:ring-relaive-secondary"
              />
              <span className="text-sm font-medium text-relaive-navy">Include personal note</span>
            </label>

            {includeNote ? (
              <div className="mt-3">
                <textarea
                  id={noteId}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={5}
                  className="w-full resize-none rounded-xl border-0 bg-[#F3F4F6] px-4 py-3 text-sm leading-relaxed text-relaive-navy placeholder:text-relaive-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-secondary"
                />
                <p className="mt-2 text-xs text-relaive-gray">
                  Use {'{name}'} to auto-insert the client name.
                </p>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={isSubmitting}
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-relaive-primary to-relaive-secondary px-4 py-3 text-sm font-medium text-white shadow-md shadow-relaive-secondary/25 transition-opacity hover:opacity-95 ${BUTTON_FONT_CLASS}`}
          >
            <SendIcon />
            {isSubmitting ? 'Saving...' : 'Send Report'}
          </button>
        </>
      )}
    </section>
  )
}
