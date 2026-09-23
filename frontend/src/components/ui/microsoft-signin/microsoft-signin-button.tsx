import { useCallback, useState } from 'react'
import { PublicClientApplication, type Configuration, type IPublicClientApplication } from '@azure/msal-browser'
import { Button } from '../button/button'

// Unlike Google's Identity Services (see ../google-signin/google-signin-button.tsx),
// MSAL's popup sign-in can be triggered from any ordinary click handler — no
// FedCM-style restriction forcing a Google-rendered widget — so this is just
// a real app-styled <button>, no invisible-overlay trick needed.
//
// One PublicClientApplication instance per Client ID, created + initialized
// once and cached — same "load once, reuse" reasoning as the GSI script cache
// and TurnstileWidget next door.

let msalInstancePromise: Promise<IPublicClientApplication> | null = null

function getMsalInstance(clientId: string): Promise<IPublicClientApplication> {
  if (!msalInstancePromise) {
    const config: Configuration = {
      auth: {
        clientId,
        // "common" = personal Microsoft accounts + any work/school (Entra ID) tenant.
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: window.location.origin,
      },
    }
    const instance = new PublicClientApplication(config)
    msalInstancePromise = instance.initialize().then(() => instance)
  }
  return msalInstancePromise
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M0 0h8.5v8.5H0V0Z" fill="#F25022" />
      <path d="M9.5 0H18v8.5H9.5V0Z" fill="#7FBA00" />
      <path d="M0 9.5h8.5V18H0V9.5Z" fill="#00A4EF" />
      <path d="M9.5 9.5H18V18H9.5V9.5Z" fill="#FFB900" />
    </svg>
  )
}

export interface MicrosoftSignInButtonProps {
  /** Called with the ID token once the user completes the Microsoft popup. */
  onCredential: (credential: string) => void
  onError?: () => void
  label?: string
  className?: string
}

export function MicrosoftSignInButton({
  onCredential,
  onError,
  label = 'Microsoft',
  className,
}: MicrosoftSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const clientId = import.meta.env.VITE_MICROSOFT_OAUTH_CLIENT_ID as string | undefined

  const handleClick = useCallback(async () => {
    if (!clientId || isLoading) return
    setIsLoading(true)
    try {
      const instance = await getMsalInstance(clientId)
      const result = await instance.loginPopup({ scopes: ['openid', 'profile', 'email'] })
      // `idToken` is the raw ID token JWT — verified server-side in
      // microsoft-auth.service.ts, never trusted as-is on this end (same
      // contract as GoogleSignInButton's onCredential).
      onCredential(result.idToken)
    } catch (err) {
      // Closing the popup throws a BrowserAuthError with this code — not a
      // real failure, so don't surface an error banner for it.
      const errorCode = (err as { errorCode?: string } | undefined)?.errorCode
      if (errorCode !== 'user_cancelled') onError?.()
    } finally {
      setIsLoading(false)
    }
  }, [clientId, isLoading, onCredential, onError])

  if (!clientId) {
    return (
      <p className={`text-xs text-red-600 ${className ?? ''}`}>
        Microsoft sign-in is not configured (missing VITE_MICROSOFT_OAUTH_CLIENT_ID).
      </p>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="md"
      // h-10 matches GoogleSignInButton's fixed height — see that file's
      // comment on why Google's side can't just stretch to match a taller
      // Microsoft button instead.
      className={`h-10 gap-2 ${className ?? ''}`}
      onClick={handleClick}
      disabled={isLoading}
    >
      <MicrosoftIcon />
      {isLoading ? 'Connecting…' : label}
    </Button>
  )
}
