import { useEffect, useRef, useState } from 'react'
import { ClientStatusBadge, getClientStatusLabel } from '../../../../../components/ui/table/status-badge'
import type { ClientStatus } from '../../../../../services/agent'

const STATUS_OPTIONS: ClientStatus[] = ['prospecting', 'active', 'appraisal_sent', 'listing', 'sold']

type ClientStageDropdownProps = {
  status: ClientStatus
  onChange: (status: ClientStatus) => void
  disabled?: boolean
}

/** Click-to-open dropdown on top of the existing ClientStatusBadge — real PATCH, no fake state. */
export function ClientStageDropdown({ status, onChange, disabled = false }: ClientStageDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation()
          setOpen((prev) => !prev)
        }}
        className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ClientStatusBadge status={status} />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-10 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setOpen(false)
                if (option !== status) onChange(option)
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-black/5 ${
                option === status ? 'bg-black/5' : ''
              }`}
            >
              {getClientStatusLabel(option)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
