import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button/button'
import { Input } from '../../../components/ui/input/input'
import { TurnstileWidget } from '../../../components/ui/turnstile/turnstile-widget'
import { GoogleSignInButton } from '../../../components/ui/google-signin/google-signin-button'
import { useAuth } from '../hooks/use-auth'
import { useCaptchaGate } from '../hooks/use-captcha-gate'
import { AuthError } from '../../../types/auth'
import { sendOtp } from '../../../services/auth'

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

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.667 14c0-2.946 2.388-5.333 5.333-5.333S13.333 11.054 13.333 14"
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

function OtpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect
        x="2.5"
        y="4"
        width="11"
        height="8"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M5.5 8h.01M8 8h.01M10.5 8h.01"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
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
}: {
  onGoogleCredential: (credential: string) => void
  onGoogleError: () => void
}) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <GoogleSignInButton onCredential={onGoogleCredential} onError={onGoogleError} />
    </div>
  )
}

export function SignUpForm() {
  const navigate = useNavigate()
  const { register, loginWithGoogle } = useAuth()
  const {
    isRequired: captchaRequired,
    token: captchaToken,
    widgetRef: captchaWidgetRef,
    setToken: setCaptchaToken,
    requireCaptcha,
    resetToken: resetCaptcha,
    clear: clearCaptcha,
  } = useCaptchaGate('signup')
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpNotice, setOtpNotice] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)

  async function handleGoogleCredential(credential: string) {
    setError(null)
    setIsGoogleSubmitting(true)
    try {
      await loginWithGoogle(credential)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message)
      } else {
        setError('Google sign-up failed. Please try again.')
      }
    } finally {
      setIsGoogleSubmitting(false)
    }
  }

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function handleSendOtp() {
    setError(null)
    setFieldErrors({})
    setOtpNotice(null)
    setOtpSending(true)
    try {
      await sendOtp(email)
      setOtpNotice(`Code sent to ${email}`)
      setCooldown(60)
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message)
        if (err.errors) setFieldErrors(err.errors)
      } else {
        setError('Could not send the code. Please try again.')
      }
    } finally {
      setOtpSending(false)
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

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match.' })
      setError('Please make sure both passwords match.')
      return
    }

    setIsSubmitting(true)

    try {
      await register({
        fullName,
        email,
        password,
        turnstileToken: captchaToken || undefined,
        otp,
      })
      clearCaptcha()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message)
        if (err.errors) setFieldErrors(err.errors)
        if (err.captchaRequired) requireCaptcha()
      } else {
        setError('Sign up failed. Please try again.')
      }
      resetCaptcha()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-relaive-navy">Create your account - Sign up</h1>
        <p className="mt-2 text-sm text-relaive-gray">
          Start your property intelligence workflow
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Input
            id="full-name"
            type="text"
            label="Full name"
            placeholder="Enter your full name"
            startIcon={<UserIcon />}
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
          {fieldErrors.fullName ? <p className="text-xs text-red-600">{fieldErrors.fullName}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="Enter your email"
                startIcon={<MailIcon />}
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-[42px] shrink-0 whitespace-nowrap"
              onClick={handleSendOtp}
              disabled={!email || otpSending || cooldown > 0}
            >
              {otpSending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send OTP'}
            </Button>
          </div>
          {fieldErrors.email ? <p className="text-xs text-red-600">{fieldErrors.email}</p> : null}
          {otpNotice ? <p className="text-xs text-green-700">{otpNotice}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            label="OTP"
            placeholder="Enter OTP code"
            startIcon={<OtpIcon />}
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            required
          />
          {fieldErrors.otp ? <p className="text-xs text-red-600">{fieldErrors.otp}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="Enter your password"
            startIcon={<ShieldIcon />}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
          {fieldErrors.password ? <p className="text-xs text-red-600">{fieldErrors.password}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Input
            id="confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirm password"
            placeholder="Re-enter your password"
            startIcon={<ShieldIcon />}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            endIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="pointer-events-auto focus-visible:outline-none"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon visible={showConfirmPassword} />
              </button>
            }
          />
          {fieldErrors.confirmPassword ? (
            <p className="text-xs text-red-600">{fieldErrors.confirmPassword}</p>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {captchaRequired ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-relaive-gray">
              Extra security check before creating another account.
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
          className="w-full bg-gradient-to-r from-relaive-primary to-relaive-secondary hover:opacity-90"
        >
          {isSubmitting ? 'Signing up...' : 'Sign up'}
        </Button>
      </form>

      <SocialLoginDivider />
      <SocialLoginButtons
        onGoogleCredential={handleGoogleCredential}
        onGoogleError={() => setError('Google sign-in failed to load. Please try again.')}
      />
      {isGoogleSubmitting ? (
        <p className="text-center text-xs text-relaive-gray">Signing up…</p>
      ) : null}
    </div>
  )
}
