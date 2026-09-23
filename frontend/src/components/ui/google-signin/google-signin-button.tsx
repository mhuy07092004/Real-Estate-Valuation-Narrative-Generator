import { useEffect, useRef, useState } from 'react'
import { buttonVariants } from '../button/button'

// Google's own rendered widget only ever shows "Sign in with Google" /
// "Sign up with Google" / "Continue with Google" — there's no official text
// option that says just "Google". So we render Google's real 'standard'
// button sized to exactly match our own app-styled "Google" label, hide it
// (opacity-0), and overlay it on top — clicks land on Google's real element,
// so the ID-token flow is exactly as reliable as their own button, only the
// pixels are ours.
//
// Deliberately NOT 'icon' type (an earlier version of this file used it):
// icon-type buttons are a fixed small square with no responsive internal
// layout, so stretching their iframe box via CSS leaves most of the box
// dead — only the small square Google actually draws inside is clickable,
// wherever it happens to sit. 'standard' type buttons genuinely reflow
// their internal (cross-origin, unstylable-by-us) content to fill whatever
// pixel `width` we pass, which is the only way to get a real full-width
// clickable area.
//
// `width` is tracked via ResizeObserver rather than a one-shot mount-time
// read, because this button can mount after the page (e.g. sign-up-form.tsx
// only renders it once a role is picked), and a stale/zero width at that
// moment would silently shrink the clickable area.
//
// Height is NOT stretched to fill an arbitrary container: Google's size
// presets ('large' here) are a fixed ~40px with no way to request a taller
// button, so forcing the iframe taller via CSS would leave the same kind of
// dead strip vertically that 'icon' left horizontally. This button is
// pinned to h-10 (40px) for that reason — SocialLoginButtons in
// sign-in-form.tsx / sign-up-form.tsx pins MicrosoftSignInButton to the same
// h-10 so the two buttons match.
//
// Loads the GSI script once and caches the promise — same pattern as
// TurnstileWidget (../turnstile/turnstile-widget.tsx) for Cloudflare's script.

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon'
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
              shape?: 'rectangular' | 'pill' | 'circle' | 'square'
              width?: number
              logo_alignment?: 'left' | 'center'
            },
          ) => void
        }
      }
    }
  }
}

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
let scriptPromise: Promise<void> | null = null

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.09-1.81 2.73v2.27h2.92c1.71-1.57 2.69-3.88 2.69-6.64Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.47-.8 5.96-2.17l-2.92-2.27c-.81.55-1.85.87-3.04.87-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.97 10.73a5.4 5.4 0 0 1 0-3.46V4.93H.96a9 9 0 0 0 0 8.14l3.01-2.34Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.59-2.59A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.93l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  )
}

export interface GoogleSignInButtonProps {
  /** Called with the ID token once the user completes the Google prompt. */
  onCredential: (credential: string) => void
  onError?: () => void
  /** Visible label under the real (invisible) Google button. Defaults to "Google". */
  label?: string
  className?: string
}

export function GoogleSignInButton({ onCredential, onError, label = 'Google', className }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID as string | undefined

  useEffect(() => {
    if (!clientId || !containerRef.current) return

    let cancelled = false
    let initialized = false
    const container = containerRef.current

    function renderAtCurrentWidth() {
      if (cancelled || !container || !window.google) return
      const width = Math.round(container.getBoundingClientRect().width)
      if (!width) return
      // Re-rendering into the same node just appends a second button
      // instead of replacing the first — clear it first.
      container.replaceChildren()
      window.google.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin',
        shape: 'rectangular',
        width,
      })
    }

    loadGoogleScript()
      .then(() => {
        if (cancelled || !container || !window.google) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          // `credential` here is the signed ID token — verified server-side
          // in google-auth.service.ts, never trusted as-is on this end.
          callback: (response) => onCredential(response.credential),
        })
        initialized = true
        renderAtCurrentWidth()
      })
      .catch(() => onError?.())

    // Re-renders at the new width on any layout change — window resize, or
    // this button mounting late (sign-up page, after a role is picked) into
    // a container whose size wasn't settled on the very first paint.
    const resizeObserver = new ResizeObserver(() => {
      if (initialized) renderAtCurrentWidth()
    })
    resizeObserver.observe(container)

    return () => {
      cancelled = true
      resizeObserver.disconnect()
    }
    // Callbacks are read fresh via closure, same reasoning as TurnstileWidget.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  if (!clientId) {
    return (
      <p className={`text-xs text-red-600 ${className ?? ''}`}>
        Google sign-in is not configured (missing VITE_GOOGLE_OAUTH_CLIENT_ID).
      </p>
    )
  }

  return (
    <div
      className={`relative h-10 w-full ${className ?? ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        aria-hidden="true"
        className={buttonVariants({
          variant: 'outline',
          size: 'md',
          // pointer-events-none takes this label out of hit-testing, so its
          // own `hover:` class never actually fires — the invisible real
          // Google button on top of it is always the real hit target. The
          // wrapper's own onMouseEnter/Leave above drives isHovered instead,
          // applying the same background the outline variant's hover uses —
          // with `!` (important), because buttonVariants also bakes in an
          // unconditional `bg-white` for this variant, and plain (non-!)
          // utility classes are resolved by stylesheet source order, not by
          // where they sit in this string, so bg-white was silently winning
          // over a plain bg-relaive-navy/5 regardless of isHovered.
          className: `pointer-events-none h-full w-full gap-2 ${isHovered ? '!bg-relaive-navy/5' : ''}`,
        })}
      >
        <GoogleIcon />
        {label}
      </div>
      <div ref={containerRef} className="absolute inset-0 overflow-hidden opacity-0" />
    </div>
  )
}
