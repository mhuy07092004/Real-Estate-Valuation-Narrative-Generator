// Runtime v1/v2 UI toggle — persisted in localStorage, overridable via ?ui=v1|v2.
// See figma-ui-migration-plan.md §4.2. No build/deploy needed to flip back to v1.

export type UiVersion = 'v1' | 'v2'

const STORAGE_KEY = 'relaive_ui_version'
export const UI_VERSION_CHANGE_EVENT = 'relaive-ui-version-change'

function parseVersion(value: string | null): UiVersion | null {
  return value === 'v1' || value === 'v2' ? value : null
}

function readStoredVersion(): UiVersion | null {
  try {
    return parseVersion(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

function writeStoredVersion(version: UiVersion): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, version)
  } catch {
    // localStorage unavailable (private mode, etc.) — toggle just won't persist across reloads.
  }
}

function readUrlOverride(): UiVersion | null {
  return parseVersion(new URLSearchParams(window.location.search).get('ui'))
}

/** Current version: URL override (persisted for the session) wins, else the stored choice, else v1. */
export function getUiVersion(): UiVersion {
  const urlOverride = readUrlOverride()
  if (urlOverride) {
    writeStoredVersion(urlOverride)
    return urlOverride
  }

  return readStoredVersion() ?? 'v1'
}

export function setUiVersion(version: UiVersion): void {
  writeStoredVersion(version)
  window.dispatchEvent(new Event(UI_VERSION_CHANGE_EVENT))
}
