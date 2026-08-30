// Same lightweight module-var + localStorage pattern as roi-scenario-store.ts /
// affordability-scenario-store.ts — there is no backend field yet for these
// preferences (see backend/V2_BACKEND_TODO.md), so they are real, working,
// per-browser state rather than decorative UI.

export type NotificationPreferenceId =
  | 'email'
  | 'push'
  | 'aiValuationUpdates'
  | 'marketAlerts'
  | 'comparableSalesAlerts'
  | 'weeklyDigest'
  | 'aiInsights'
  | 'forecastUpdates'

export type NotificationPreferences = Record<NotificationPreferenceId, boolean>

export const NOTIFICATION_PREFERENCE_ITEMS: {
  id: NotificationPreferenceId
  label: string
  description: string
}[] = [
  { id: 'email', label: 'Email Notifications', description: 'Receive important updates via email' },
  { id: 'push', label: 'Push Notifications', description: 'Browser & mobile push alerts' },
  { id: 'aiValuationUpdates', label: 'AI Valuation Updates', description: 'When AI estimates change significantly' },
  { id: 'marketAlerts', label: 'Market Alerts', description: 'Suburb price and demand changes' },
  { id: 'comparableSalesAlerts', label: 'Comparable Sales Alerts', description: 'New sales near your properties' },
  { id: 'weeklyDigest', label: 'Weekly Report Digest', description: 'Summary of activity every Monday' },
  { id: 'aiInsights', label: 'AI Insights Alerts', description: 'When AI generates important insights' },
  { id: 'forecastUpdates', label: 'Forecast Updates', description: 'AI growth forecast changes' },
]

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email: true,
  push: true,
  aiValuationUpdates: true,
  marketAlerts: true,
  comparableSalesAlerts: true,
  weeklyDigest: false,
  aiInsights: true,
  forecastUpdates: false,
}

export type ThemePreference = 'light' | 'dark' | 'system'

export type AppearancePreferences = {
  theme: ThemePreference
  language: string
}

export const DEFAULT_APPEARANCE_PREFERENCES: AppearancePreferences = {
  theme: 'light',
  language: 'English (Australia)',
}

const NOTIFICATION_PREFS_KEY = 'relaive_settings_notification_prefs'
const APPEARANCE_PREFS_KEY = 'relaive_settings_appearance_prefs'

let notificationPrefs: NotificationPreferences | null = null
let appearancePrefs: AppearancePreferences | null = null

function readStored<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function getNotificationPreferences(): NotificationPreferences {
  if (notificationPrefs) return notificationPrefs
  notificationPrefs = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...(readStored<NotificationPreferences>(NOTIFICATION_PREFS_KEY) ?? {}),
  }
  return notificationPrefs
}

export function setNotificationPreferences(prefs: NotificationPreferences): void {
  notificationPrefs = prefs
  if (typeof window === 'undefined') return
  window.localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs))
}

export function getAppearancePreferences(): AppearancePreferences {
  if (appearancePrefs) return appearancePrefs
  appearancePrefs = readStored<AppearancePreferences>(APPEARANCE_PREFS_KEY) ?? DEFAULT_APPEARANCE_PREFERENCES
  return appearancePrefs
}

export function setAppearancePreferences(prefs: AppearancePreferences): void {
  appearancePrefs = prefs
  if (typeof window === 'undefined') return
  window.localStorage.setItem(APPEARANCE_PREFS_KEY, JSON.stringify(prefs))
}
