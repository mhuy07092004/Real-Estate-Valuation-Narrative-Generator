import { useId, useState } from 'react'
import { Input } from '../input/input'
import { BUTTON_FONT_CLASS } from '../button/button'

export type SendReportPayload = {
  clientId?: string
  clientName: string
  clientEmail: string
}

type SendReportCardProps = {
  onClose: () => void
  clients?: { id: string; name: string; email: string }[]
  initialClientId?: string | null
  onSend?: (payload: SendReportPayload) => Promise<{ shareUrl: string }>
  onSendEmail?: (payload: SendReportPayload & { note?: string }) => Promise<{ shareUrl: string }>
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

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 15l6-6M10.5 7.5l1-1a3.5 3.5 0 0 1 5 5l-1 1M13.5 16.5l-1 1a3.5 3.5 0 0 1-5-5l1-1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SendReportCard({
  onClose,
  clients = [],
  initialClientId = null,
  onSend,
  onSendEmail,
}: SendReportCardProps) {
  const emailId = useId()
  const nameId = useId()
  const noteId = useId()
  const [includeNote, setIncludeNote] = useState(true)
  const initialClient = clients.find((client) => client.id === initialClientId)
  const [clientId, setClientId] = useState<string | null>(initialClient?.id ?? null)
  const [name, setName] = useState(initialClient?.name ?? '')
  const [email, setEmail] = useState(initialClient?.email ?? '')
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [emailedTo, setEmailedTo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEmailing, setIsEmailing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [note, setNote] = useState(
    'Hi {name},\n\nPlease find attached the property appraisal report for your review. Happy to discuss any questions.\n\nBest regards',
  )

  const trimmedEmail = email.trim()

  const handleClientChange = (id: string) => {
    const picked = clients.find((client) => client.id === id)
    setClientId(picked?.id ?? null)
    if (picked) {
      setName(picked.name)
      setEmail(picked.email)
    }
  }

  const handleSend = async () => {
    setIsSubmitting(true)
    setErrorMessage(null)

    const payload: SendReportPayload = {
      clientId: clientId ?? undefined,
      clientName: name.trim(),
      clientEmail: trimmedEmail,
    }

    try {
      const result = await onSend?.(payload)
      if (result) setShareUrl(result.shareUrl)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save report and generate a link.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendEmail = async () => {
    setIsEmailing(true)
    setErrorMessage(null)

    const payload = {
      clientId: clientId ?? undefined,
      clientName: name.trim(),
      clientEmail: trimmedEmail,
      note: includeNote ? note.replace('{name}', name.trim() || 'there') : undefined,
    }

    try {
      const result = await onSendEmail?.(payload)
      if (result) {
        setShareUrl(result.shareUrl)
        setEmailedTo(trimmedEmail)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to email the report to the client.')
    } finally {
      setIsEmailing(false)
    }
  }

  const handleCopyLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API can fail (permissions, insecure context) — the link
      // text is still visible and selectable, so this isn't a dead end.
    }
  }

  return (
    <section
      aria-labelledby="send-report-title"
      className="w-full rounded-3xl border border-[#E5E7EB] bg-white px-5 py-6 shadow-[0_4px_24px_rgba(26,32,44,0.08)] sm:px-7 sm:py-7"
    >
      {shareUrl ? (
        <div className="flex flex-col items-center px-2 py-6 text-center sm:py-8">
          <span className="text-emerald-500">
            <SuccessTickIcon />
          </span>
          <h2
            id="send-report-title"
            className="mt-4 text-lg font-semibold text-relaive-navy sm:text-xl"
          >
            {emailedTo ? 'Report sent' : 'Link ready to share'}
          </h2>
          <p className="mt-2 text-sm text-relaive-gray">
            {emailedTo
              ? `Report saved and emailed to ${emailedTo}. You can also copy the link below.`
              : "Report saved. Copy this link and send it to your client yourself — Relaive doesn't email it for you."}
          </p>

          <div className="mt-5 flex w-full items-center gap-2 rounded-xl border border-black/10 bg-[#F3F4F6] px-3 py-2.5">
            <span className="flex-1 truncate text-left text-sm text-relaive-navy">{shareUrl}</span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-relaive-navy shadow-sm transition-colors hover:bg-gray-50"
            >
              <LinkIcon />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

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
                Get Shareable Link
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

          {clients.length > 0 ? (
            <div className="mt-5 flex flex-col gap-2">
              <label className="text-[11px] font-semibold tracking-[0.08em] text-relaive-gray uppercase">
                Client
              </label>
              <select
                value={clientId ?? ''}
                onChange={(event) => handleClientChange(event.target.value)}
                className="rounded-xl border-0 bg-[#F3F4F6] px-4 py-2.5 text-sm text-relaive-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-secondary"
              >
                <option value="">No client (enter details below)</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-2">
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

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={isSubmitting || isEmailing || !trimmedEmail}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-relaive-primary to-relaive-secondary px-4 py-3 text-sm font-medium text-white shadow-md shadow-relaive-secondary/25 transition-opacity hover:opacity-95 disabled:opacity-50 ${BUTTON_FONT_CLASS}`}
            >
              <SendIcon />
              {isEmailing ? 'Sending...' : 'Email to Client'}
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={isSubmitting || isEmailing}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border border-relaive-secondary/40 bg-white px-4 py-3 text-sm font-medium text-relaive-navy transition-colors hover:bg-gray-50 disabled:opacity-50 ${BUTTON_FONT_CLASS}`}
            >
              <LinkIcon />
              {isSubmitting ? 'Generating link...' : 'Get Shareable Link'}
            </button>
          </div>
          {!trimmedEmail ? (
            <p className="mt-2 text-xs text-relaive-gray">Enter a client email to send it directly.</p>
          ) : null}
        </>
      )}
    </section>
  )
}
