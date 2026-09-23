import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button/button'
import { Input } from '../../../components/ui/input/input'
import { TurnstileWidget } from '../../../components/ui/turnstile/turnstile-widget'
import { GoogleSignInButton } from '../../../components/ui/google-signin/google-signin-button'
import { MicrosoftSignInButton } from '../../../components/ui/microsoft-signin/microsoft-signin-button'
import { useAuth } from '../hooks/use-auth'
import { useCaptchaGate } from '../hooks/use-captcha-gate'
import { AuthError } from '../../../types/auth'

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 4L7.29 8.06a1.2 1.2 0 0 0 1.42 0L14 4M2.667 3h10.666c.737 0 1.334.597 1.334 1.333v7.334c0 .736-.597 1.333-1.334 1.333H2.667c-.736 0-1.334-.597-1.334-1.333V4.333C1.333 3.597 1.93 3 2.667 3Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.667 13.333 3.5v4c0 3.5-2.667 5.667-5.333 6.833C5.333 13.167 2.667 11 2.667 7.5v-4L8 1.667Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M1.333 8S3.556 3 8 3s6.667 5 6.667 5-2.223 5-6.667 5-6.667-5-6.667-5Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 2l12 12M6.6 6.62A2 2 0 0 0 8 10a2 2 0 0 0 1.4-3.38M4.02 4.03C2.3 5.24 1.333 8 1.333 8s2.223 5 6.667 5c1.19 0 2.222-.267 3.1-.7M9.86 3.24A6.9 6.9 0 0 0 8 3c-.36 0-.7.02-1.03.06M14.667 8s-.63 1.42-1.87 2.68"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SocialLoginDivider() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-black/10" />
      <span className="text-xs text-relaive-gray">Or continue with</span>
      <span className="h-px flex-1 bg-black/10" />
    </div>
  )
}

function SocialLoginButtons({
  onGoogleCredential,
  onGoogleError,
  onMicrosoftCredential,
  onMicrosoftError,
}: {
  onGoogleCredential: (credential: string) => void
  onGoogleError: () => void
  onMicrosoftCredential: (credential: string) => void
  onMicrosoftError: () => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <GoogleSignInButton onCredential={onGoogleCredential} onError={onGoogleError} />
      <MicrosoftSignInButton onCredential={onMicrosoftCredential} onError={onMicrosoftError} />
    </div>
  )
}

export function SignInForm() {
  const navigate = useNavigate()
  const { login, loginWithGoogle, loginWithMicrosoft } = useAuth()
  const {
    isRequired: captchaRequired,
    token: captchaToken,
    widgetRef: captchaWidgetRef,
    setToken: setCaptchaToken,
    requireCaptcha,
    resetToken: resetCaptcha,
    clear: clearCaptcha,
  } = useCaptchaGate('signin')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)
  const [isMicrosoftSubmitting, setIsMicrosoftSubmitting] = useState(false)

  async function handleGoogleCredential(credential: string) {
    setError(null)
    setIsGoogleSubmitting(true)
    try {
      await loginWithGoogle(credential)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (err instanceof AuthError) {
        // Most likely case: no account exists yet for this Google email —
        // sign-in intentionally doesn't collect a role, so it can't create
        // one (see google-auth.service.ts's 422 for the new-account path).
        setError(err.message)
      } else {
        setError('Google sign-in failed. Please try again.')
      }
    } finally {
      setIsGoogleSubmitting(false)
    }
  }

  async function handleMicrosoftCredential(credential: string) {
    setError(null)
    setIsMicrosoftSubmitting(true)
    try {
      await loginWithMicrosoft(credential)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (err instanceof AuthError) {
        // Same "no account yet" 422 case as Google — see
        // microsoft-auth.service.ts's new-account path.
        setError(err.message)
      } else {
        setError('Microsoft sign-in failed. Please try again.')
      }
    } finally {
      setIsMicrosoftSubmitting(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})

    if (captchaRequired && !captchaToken) {
      setError('Please complete the security check below.')
      return
    }

    setIsSubmitting(true)

    try {
      await login({ email, password, turnstileToken: captchaToken || undefined }, { rememberMe })
      clearCaptcha()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message)
        if (err.errors) setFieldErrors(err.errors)
        if (err.captchaRequired) requireCaptcha()
      } else {
        setError('Login failed. Please try again.')
      }
      resetCaptcha()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-relaive-navy">Welcome back - Sign in</h1>
        <p className="mt-2 text-sm text-relaive-gray">
          Continue your property intelligence workflow
        </p>
        {error ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Input
            id="email"
            type="email"
            label="Email"
            placeholder="Enter your email"
            startIcon={<MailIcon />}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {fieldErrors.email ? (
            <p className="text-xs text-red-600">{fieldErrors.email}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="Enter your password"
            startIcon={<ShieldIcon />}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            endIcon={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="pointer-events-auto focus-visible:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon visible={showPassword} />
              </button>
            }
          />
          {fieldErrors.password ? (
            <p className="text-xs text-red-600">{fieldErrors.password}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-relaive-navy">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-black/20 text-relaive-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
            />
            Remember me
          </label>
          <Button variant="link" href="/forgot-password" className="text-relaive-primary">
            Forgot password?
          </Button>
        </div>

        {captchaRequired ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-relaive-gray">
              Extra security check after repeated failed attempts.
            </p>
            <TurnstileWidget
              ref={captchaWidgetRef}
              onVerify={setCaptchaToken}
              onExpire={resetCaptcha}
              onError={resetCaptcha}
            />
          </div>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || (captchaRequired && !captchaToken)}
          className="w-full bg-gradient-to-r from-relaive-primary to-relaive-secondary hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <SocialLoginDivider />
      <SocialLoginButtons
        onGoogleCredential={handleGoogleCredential}
        onGoogleError={() => setError('Google sign-in failed to load. Please try again.')}
        onMicrosoftCredential={handleMicrosoftCredential}
        onMicrosoftError={() => setError('Microsoft sign-in failed to load. Please try again.')}
      />
      {isGoogleSubmitting || isMicrosoftSubmitting ? (
        <p className="text-center text-xs text-relaive-gray">Signing in…</p>
      ) : null}
    </div>
  )
}
