import type { ReactNode } from 'react'
import type { NotificationPriority } from '../../../../../services/common'
import { CheckIcon, ClockIcon, XIcon } from './notification-icons'

const PRIORITY_STYLES: Record<NotificationPriority, string> = {
  high: 'bg-red-50 text-red-600',
  medium: 'bg-orange-50 text-orange-600',
  low: 'bg-gray-100 text-gray-500',
}

type NotificationItemProps = {
  title: string
  description: string
  priority: NotificationPriority
  timestamp: string
  isRead: boolean
  icon: ReactNode
  onMarkRead: () => void
  onDismiss: () => void
}

export function NotificationItem({
  title,
  description,
  priority,
  timestamp,
  isRead,
  icon,
  onMarkRead,
  onDismiss,
}: NotificationItemProps) {
  return (
    <article className="group flex items-start gap-3 rounded-2xl border border-black/5 bg-white px-4 py-4 transition-shadow sm:gap-4 sm:px-5">
      <span
        className={`mt-3 h-2 w-2 shrink-0 rounded-full ${isRead ? 'bg-transparent' : 'bg-[#5B9FD4]'}`}
        aria-hidden="true"
      />

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EEF6FA] text-relaive-primary">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-relaive-navy sm:text-[15px]">{title}</h2>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${PRIORITY_STYLES[priority]}`}
          >
            {priority}
          </span>
        </div>

        <p className="mt-1 text-sm leading-relaxed text-relaive-gray">{description}</p>

        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-relaive-gray/80">
          <ClockIcon />
          <span>{timestamp}</span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {!isRead ? (
          <button
            type="button"
            onClick={onMarkRead}
            title="Mark read"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-relaive-secondary transition-colors hover:bg-relaive-secondary/10"
          >
            <CheckIcon />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onDismiss}
          title="Dismiss"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-relaive-gray/50 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <XIcon />
        </button>
      </div>
    </article>
  )
}
