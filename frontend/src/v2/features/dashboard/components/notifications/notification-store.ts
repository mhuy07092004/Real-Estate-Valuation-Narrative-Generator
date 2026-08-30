// Same lightweight module-var + localStorage pattern as roi-scenario-store.ts.
// There is no backend PATCH/mark-read or dismiss endpoint for notifications
// (only GET .../notifications and GET .../notifications/unread-count exist —
// see backend/src/routes/mock.routes.ts and backend/V2_BACKEND_TODO.md), so
// read/dismissed state is tracked here, per browser, keyed by notification id.

export type NotificationLocalState = {
  readIds: string[]
  dismissedIds: string[]
}

const STORAGE_KEY = 'relaive_notifications_local_state'

let state: NotificationLocalState | null = null

function readStored(): NotificationLocalState | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as NotificationLocalState
  } catch {
    return null
  }
}

function persist() {
  if (typeof window === 'undefined' || !state) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function getState(): NotificationLocalState {
  if (state) return state
  state = readStored() ?? { readIds: [], dismissedIds: [] }
  return state
}

export function isNotificationReadLocally(id: string): boolean {
  return getState().readIds.includes(id)
}

export function isNotificationDismissed(id: string): boolean {
  return getState().dismissedIds.includes(id)
}

export function markNotificationRead(id: string): void {
  const current = getState()
  if (!current.readIds.includes(id)) {
    current.readIds = [...current.readIds, id]
    persist()
  }
}

export function markNotificationsRead(ids: string[]): void {
  const current = getState()
  const next = new Set(current.readIds)
  ids.forEach((id) => next.add(id))
  current.readIds = Array.from(next)
  persist()
}

export function dismissNotification(id: string): void {
  const current = getState()
  if (!current.dismissedIds.includes(id)) {
    current.dismissedIds = [...current.dismissedIds, id]
    persist()
  }
}
