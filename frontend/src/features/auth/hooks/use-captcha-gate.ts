import { useCallback, useRef, useState, type RefObject } from 'react'
import type { TurnstileWidgetHandle } from '../../../components/ui/turnstile/turnstile-widget'

// Adaptive captcha gate. The widget stays hidden until the backend flags an
// attempt as risky (`captchaRequired` in the error response), so honest users
// normally never see a challenge. The flag is remembered for the tab so a
// reload does not cost the user another rejected submit.

const STORAGE_PREFIX = 'relaive_captcha_'

function readFlag(name: string): boolean {
  try {
    return window.sessionStorage.getItem(`${STORAGE_PREFIX}${name}`) === '1'
  } catch {
    return false
  }
}

function writeFlag(name: string, value: boolean): void {
  try {
    const key = `${STORAGE_PREFIX}${name}`
    if (value) window.sessionStorage.setItem(key, '1')
    else window.sessionStorage.removeItem(key)
  } catch {
    // Private-mode storage failures just mean the flag isn't remembered.
  }
}

export interface CaptchaGate {
  isRequired: boolean
  token: string
  widgetRef: RefObject<TurnstileWidgetHandle | null>
  setToken: (token: string) => void
  /** Reveal the challenge — called when the backend reports captchaRequired. */
  requireCaptcha: () => void
  /** Drop the used/expired token and ask the widget for a fresh one. */
  resetToken: () => void
  /** Hide the challenge again after a successful attempt. */
  clear: () => void
}

export function useCaptchaGate(name: string): CaptchaGate {
  const widgetRef = useRef<TurnstileWidgetHandle>(null)
  const [isRequired, setIsRequired] = useState(() => readFlag(name))
  const [token, setToken] = useState('')

  const requireCaptcha = useCallback(() => {
    setIsRequired(true)
    writeFlag(name, true)
  }, [name])

  const resetToken = useCallback(() => {
    setToken('')
    // Turnstile tokens are single-use, so a retry needs a freshly solved one.
    widgetRef.current?.reset()
  }, [])

  const clear = useCallback(() => {
    setIsRequired(false)
    setToken('')
    writeFlag(name, false)
  }, [name])

  return { isRequired, token, widgetRef, setToken, requireCaptcha, resetToken, clear }
}
