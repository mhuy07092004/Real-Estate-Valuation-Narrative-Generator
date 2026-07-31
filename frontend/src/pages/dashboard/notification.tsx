import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { ViewNotification } from '../../components/notification/view-notifcation'
import { Button } from '../../components/ui/button/button'
import {
  isDashboardRole,
  type DashboardRole,
} from '../../features/dashboard/utils/dashboard-role'
import { useAsyncData } from '../../hooks/use-async-data'
import {
  getAgentNotifications,
  getAgentUnreadNotificationCount,
} from '../../services/agent'
import {
  getBuyerNotifications,
  getBuyerUnreadNotificationCount,
} from '../../services/buyer'
import type {
  InboxNotification,
  NotificationIconKind,
} from '../../services/common'
import {
  getInvestorNotifications,
  getInvestorUnreadNotificationCount,
} from '../../services/investor'
import {
  getValuerNotifications,
  getValuerUnreadNotificationCount,
} from '../../services/valuer'

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      className="h-4 w-4 shrink-0"
    >
      <path
        d="M3.5 8.25 6.5 11.25 12.5 4.75"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function AiIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path
        d="M10 3.5 11.1 7.4 15 8.5 11.1 9.6 10 13.5 8.9 9.6 5 8.5 8.9 7.4 10 3.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 12.5 16 14.2 17.7 14.7 16 15.2 15.5 16.9 15 15.2 13.3 14.7 15 14.2 15.5 12.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MarketIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path
        d="M3.5 13.5 7.5 9.5 10.5 12.5 16.5 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 6.5h3.5V10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ApprovalIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <circle cx="7.5" cy="7" r="2.25" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="13" cy="7.5" r="1.75" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M3.5 15.5c.6-2.2 2.2-3.5 4-3.5s3.4 1.3 4 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M12 12.2c1.1-.5 2.3-.3 3.2.7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SaleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path
        d="M4 8.5 10 4.5 16 8.5V15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M8 16V11h4v5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ForecastIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path
        d="M4 14.5h12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M6 12V9.5M10 12V7M14 12V5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ReportIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path
        d="M6 3.5h6l3 3V16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M12 3.5V7h3.5M7.5 10.5h5M7.5 13.5h3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const ICON_MAP: Record<NotificationIconKind, ReactNode> = {
  ai: <AiIcon />,
  market: <MarketIcon />,
  approval: <ApprovalIcon />,
  sale: <SaleIcon />,
  forecast: <ForecastIcon />,
  report: <ReportIcon />,
}

async function fetchNotificationsForRole(role: DashboardRole): Promise<{
  items: InboxNotification[]
  unreadCount: number
}> {
  switch (role) {
    case 'buyer': {
      const [items, unreadCount] = await Promise.all([
        getBuyerNotifications(),
        getBuyerUnreadNotificationCount(),
      ])
      return { items, unreadCount }
    }
    case 'investor': {
      const [items, unreadCount] = await Promise.all([
        getInvestorNotifications(),
        getInvestorUnreadNotificationCount(),
      ])
      return { items, unreadCount }
    }
    case 'valuer': {
      const [items, unreadCount] = await Promise.all([
        getValuerNotifications(),
        getValuerUnreadNotificationCount(),
      ])
      return { items, unreadCount }
    }
    case 'agent':
    default: {
      const [items, unreadCount] = await Promise.all([
        getAgentNotifications(),
        getAgentUnreadNotificationCount(),
      ])
      return { items, unreadCount }
    }
  }
}

export function NotificationPage() {
  const { role: roleParam } = useParams<{ role: string }>()
  const role: DashboardRole =
    roleParam && isDashboardRole(roleParam) ? roleParam : 'agent'
  const { data } = useAsyncData(() => fetchNotificationsForRole(role), [role])
  const items = data?.items ?? []
  const unreadCount = data?.unreadCount ?? 0

  return (
    <div className="flex flex-col">
      <header className="flex flex-col gap-4 px-4 pt-4 font-sans sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
              Notifications
            </h1>
            {unreadCount > 0 ? (
              <span className="inline-flex items-center rounded-full bg-relaive-secondary px-2.5 py-0.5 text-xs font-medium text-white">
                {unreadCount} new
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">
            Stay on top of market changes, team activity, and AI updates
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-2 self-start rounded-full"
        >
          <CheckIcon />
          Mark all read
        </Button>
      </header>

      <div className="flex flex-col gap-3 p-4 sm:gap-4 sm:p-6 lg:p-8">
        {items.map((item) => (
          <ViewNotification
            key={item.id}
            title={item.title}
            description={item.description}
            priority={item.priority}
            timestamp={item.timestamp}
            isRead={item.isRead}
            icon={ICON_MAP[item.icon]}
          />
        ))}
      </div>
    </div>
  )
}
