import { useRef, useState } from 'react'
import { useClickOutside } from '../../../hooks/use-click-outside'

export type AddItemDropdownOption = {
  id: string
  label: string
  secondaryLabel?: string
  color?: string
}

type AddItemDropdownProps = {
  triggerLabel?: string
  options: AddItemDropdownOption[]
  onSelect: (id: string) => void
  emptyMessage?: string
  className?: string
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M7 2.5V11.5M2.5 7H11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function AddItemDropdown({
  triggerLabel = 'Add item',
  options,
  onSelect,
  emptyMessage = 'No more items to add.',
  className = '',
}: AddItemDropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useClickOutside(containerRef, open, () => setOpen(false))

  function handleSelect(id: string) {
    onSelect(id)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-black/20 px-3.5 py-1.5 text-sm font-medium text-relaive-primary transition-colors hover:border-relaive-primary/40 hover:bg-relaive-primary/5"
      >
        <PlusIcon />
        {triggerLabel}
      </button>

      {open ? (
        <div className="absolute top-[calc(100%+8px)] left-0 z-20 min-w-[14rem] rounded-xl border border-black/10 bg-white p-1.5 shadow-[0_8px_24px_rgba(26,32,44,0.12)]">
          {options.length === 0 ? (
            <p className="px-2.5 py-2 text-sm text-relaive-gray">{emptyMessage}</p>
          ) : (
            <ul role="listbox" className="flex flex-col gap-0.5">
              {options.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => handleSelect(option.id)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-relaive-navy/80 transition-colors hover:bg-relaive-navy/5"
                  >
                    {option.color ? (
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: option.color }}
                        aria-hidden="true"
                      />
                    ) : null}
                    <span className="truncate font-medium text-relaive-navy">
                      {option.label}
                    </span>
                    {option.secondaryLabel ? (
                      <span className="text-relaive-gray">{option.secondaryLabel}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
