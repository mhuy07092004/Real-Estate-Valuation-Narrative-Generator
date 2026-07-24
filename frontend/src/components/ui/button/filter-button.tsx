import type { ButtonHTMLAttributes } from 'react'

function FunnelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5h16l-6 7.5v5.5l-4 2v-7.5L4 5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type FilterButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  label?: string
}

export function FilterButton({
  label = 'Filters',
  title,
  className = '',
  onClick,
  type = 'button',
  ...props
}: FilterButtonProps) {
  return (
    <button
      type={type}
      title={title ?? (onClick ? label : 'Coming soon')}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border border-black/10 px-3.5 py-2 text-sm font-medium text-relaive-navy hover:bg-relaive-navy/5 ${className}`}
      {...props}
    >
      <FunnelIcon />
      {label}
    </button>
  )
}
