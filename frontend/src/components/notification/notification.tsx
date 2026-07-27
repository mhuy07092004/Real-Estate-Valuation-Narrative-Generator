import type { ReactNode } from 'react'

type NotificationProps = {
  children: ReactNode
  icon?: ReactNode
  className?: string
}

function DefaultInfoIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="mt-0.5 h-5 w-5 shrink-0"
    >
      <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 6.25v.01M10 8.5v5.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Notification({ children, icon, className = '' }: NotificationProps) {
  return (
    <div
      role="note"
      className={`flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-4 text-sm leading-relaxed text-amber-900 sm:px-5 ${className}`}
    >
      {icon ?? <DefaultInfoIcon />}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
