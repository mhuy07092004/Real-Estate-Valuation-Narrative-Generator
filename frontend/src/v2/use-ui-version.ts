import { useCallback, useEffect, useState } from 'react'
import { getUiVersion, setUiVersion, UI_VERSION_CHANGE_EVENT, type UiVersion } from './version-toggle'

/** Re-renders when the toggle flips — via the control on this tab, or localStorage sync from another tab. */
export function useUiVersion(): UiVersion {
  const [version, setVersion] = useState<UiVersion>(getUiVersion)

  useEffect(() => {
    const sync = () => setVersion(getUiVersion())
    window.addEventListener(UI_VERSION_CHANGE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(UI_VERSION_CHANGE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return version
}

export function useSetUiVersion(): (version: UiVersion) => void {
  return useCallback((version: UiVersion) => setUiVersion(version), [])
}
