import { useEffect, useState } from 'react'
import { useSetUiVersion, useUiVersion } from './use-ui-version'

const DEBUG_SESSION_KEY = 'relaive_ui_debug'

function isDebugSession(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get('debug') === '1') {
      window.sessionStorage.setItem(DEBUG_SESSION_KEY, '1')
      return true
    }
    return window.sessionStorage.getItem(DEBUG_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Floating dev/QA control to flip between the current and new UI at runtime.
 * Hidden by default — visit any page once with `?debug=1` to reveal it for the rest of the tab session.
 */
export function VersionToggleControl() {
  const [visible, setVisible] = useState(false)
  const version = useUiVersion()
  const setVersion = useSetUiVersion()

  useEffect(() => {
    setVisible(isDebugSession())
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() => setVersion(version === 'v2' ? 'v1' : 'v2')}
      className="fixed bottom-4 right-4 z-50 rounded-full bg-relaive-navy px-4 py-2 text-xs font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
      title="Toggle between current (v1) and new (v2) UI — dev/QA only"
    >
      UI: {version.toUpperCase()} · tap to switch
    </button>
  )
}
