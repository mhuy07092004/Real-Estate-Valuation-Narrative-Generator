import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { isDashboardRole, type DashboardRole } from '../../../features/dashboard/utils/dashboard-role'
import { useAsyncData } from '../../../hooks/use-async-data'
import { getAgentNotifications, getAgentUnreadNotificationCount } from '../../../services/agent'
import { getBuyerNotifications, getBuyerUnreadNotificationCount } from '../../../services/buyer'
import type { InboxNotification, NotificationIconKind } from '../../../services/common'
import { getInvestorNotifications, getInvestorUnreadNotificationCount } from '../../../services/investor'
import { getValuerNotifications, getValuerUnreadNotificationCount } from '../../../services/valuer'
import { CheckIcon, FILTER_ITEMS, ICON_MAP } from '../../features/dashboard/components/notifications/notification-icons'
import { NotificationItem } from '../../features/dashboard/components/notifications/notification-item'
import {
  dismissNotification,
  isNotificationDismissed,
  isNotificationReadLocally,
  markNotificationRead,
  markNotificationsRead,
} from '../../features/dashboard/components/notifications/notification-store'

async function fetchNotificationsForRole(role: DashboardRole): Promise<{
  items: InboxNotification[]
  unreadCount: number
}> {
  switch (role) {
    case 'buyer': {
      const [items, unreadCount] = await Promise.all([getBuyerNotifications(), getBuyerUnreadNotificationCount()])
      return { items, unreadCount }
    }
    case 'investor': {
      const [items, unreadCount] = await Promise.all([getInvestorNotifications(), getInvestorUnreadNotificationCount()])
      return { items, unreadCount }
    }
    case 'valuer': {
      const [items, unreadCount] = await Promise.all([getValuerNotifications(), getValuerUnreadNotificationCount()])
      return { items, unreadCount }
    }
    case 'agent':
    default: {
      const [items, unreadCount] = await Promise.all([getAgentNotifications(), getAgentUnreadNotificationCount()])
      return { items, unreadCount }
    }
  }
}

export function NotificationsPageV2() {
  const { role: roleParam } = useParams<{ role: string }>()
  const role: DashboardRole = roleParam && isDashboardRole(roleParam) ? roleParam : 'agent'
  const { data } = useAsyncData(() => fetchNotificationsForRole(role), [role])
  const [activeFilter, setActiveFilter] = useState<NotificationIconKind | 'all'>('all')
  // Bumped whenever local read/dismiss state changes, to re-render against the store.
  const [localVersion, setLocalVersion] = useState(0)

  const items = useMemo(() => {
    const base = data?.items ?? []
    return base
      .filter((item) => !isNotificationDismissed(item.id))
      .map((item) => ({ ...item, isRead: item.isRead || isNotificationReadLocally(item.id) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, localVersion])

  const unreadCount = items.filter((item) => !item.isRead).length
  const filtered = activeFilter === 'all' ? items : items.filter((item) => item.icon === activeFilter)

  function handleMarkAllRead() {
    markNotificationsRead(items.map((item) => item.id))
    setLocalVersion((v) => v + 1)
  }

  function handleMarkRead(id: string) {
    markNotificationRead(id)
    setLocalVersion((v) => v + 1)
  }

  function handleDismiss(id: string) {
    dismissNotification(id)
    setLocalVersion((v) => v + 1)
  }

  return (
    <div className="flex flex-col">
      <header className="flex flex-col gap-4 px-4 pt-4 font-sans sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">Notifications</h1>
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

        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-relaive-navy transition-colors hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckIcon />
          Mark all read
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2 px-4 pt-4 sm:px-6 lg:px-8">
        {FILTER_ITEMS.map((filter) => {
          const active = activeFilter === filter.id
          const count =
            filter.id === 'all'
              ? items.filter((item) => !item.isRead).length
              : items.filter((item) => item.icon === filter.id && !item.isRead).length
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition-colors ${
                active
                  ? 'bg-gradient-to-r from-relaive-secondary to-relaive-primary text-white shadow-sm'
                  : 'border border-black/10 bg-white text-relaive-navy hover:border-relaive-primary/30'
              }`}
            >
              <span className="[&_svg]:h-4 [&_svg]:w-4">{filter.icon}</span>
              {filter.label}
              {count > 0 ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs ${
                    active ? 'bg-white/20' : 'bg-relaive-primary/10 text-relaive-primary'
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 p-4 sm:gap-4 sm:p-6 lg:p-8">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-relaive-gray">No notifications in this filter.</div>
        ) : (
          filtered.map((item) => (
            <NotificationItem
              key={item.id}
              title={item.title}
              description={item.description}
              priority={item.priority}
              timestamp={item.timestamp}
              isRead={item.isRead}
              icon={ICON_MAP[item.icon]}
              onMarkRead={() => handleMarkRead(item.id)}
              onDismiss={() => handleDismiss(item.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
