type RemovableChipProps = {
  label: string
  secondaryLabel?: string
  color?: string
  onRemove: () => void
  removeLabel?: string
  className?: string
}

function RemoveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function RemovableChip({
  label,
  secondaryLabel,
  color,
  onRemove,
  removeLabel,
  className = '',
}: RemovableChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-black/10 bg-white py-1.5 pr-1.5 pl-3 text-sm shadow-[0_2px_10px_rgba(26,32,44,0.05)] ${className}`}
    >
      {color ? (
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      ) : null}
      <span className="font-medium text-relaive-navy">{label}</span>
      {secondaryLabel ? (
        <span className="text-relaive-gray">{secondaryLabel}</span>
      ) : null}
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel ?? `Remove ${label}`}
        className="flex size-5 shrink-0 items-center justify-center rounded-full text-relaive-gray transition-colors hover:bg-relaive-navy/10 hover:text-relaive-navy"
      >
        <RemoveIcon />
      </button>
    </span>
  )
}
