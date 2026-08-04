import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button/button'
import { Input } from '../../../components/ui/input/input'
import type { DashboardRole } from '../../../features/dashboard/utils/dashboard-role'
import { useAuth } from '../hooks/use-auth'
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

const SOCIAL_PROVIDERS = [
  { id: 'google', label: 'Google', icon: GoogleIcon },
  { id: 'microsoft', label: 'Microsoft', icon: MicrosoftIcon },
] as const

const ROLE_OPTIONS: { value: DashboardRole; label: string }[] = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'investor', label: 'Investor' },
  { value: 'valuer', label: 'Property Valuer' },
  { value: 'agent', label: 'Agent' },
]

function SocialLoginDivider() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-black/10" />
      <span className="text-xs text-relaive-gray">Or continue with</span>
      <span className="h-px flex-1 bg-black/10" />
    </div>
  )
}

function SocialLoginButtons() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {SOCIAL_PROVIDERS.map(({ id, label, icon: Icon }) => (
        <Button key={id} type="button" variant="outline" size="md" className="gap-2">
          <Icon />
          {label}
        </Button>
      ))}
    </div>
  )
}

export function SignUpForm() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [role, setRole] = useState<DashboardRole | ''>('')
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      await register({
        fullName,
        email,
        password,
        role: role || undefined,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message)
        if (err.errors) setFieldErrors(err.errors)
      } else {
        setError('Sign up failed. Please try again.')
      }
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
        {error ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
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
          {fieldErrors.email ? <p className="text-xs text-red-600">{fieldErrors.email}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="role" className="text-sm font-medium text-relaive-navy">
            Role
          </label>
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3 flex items-center text-relaive-gray">
              <UserIcon />
            </span>
            <select
              id="role"
              name="role"
              required
              value={role}
              onChange={(event) => setRole(event.target.value as DashboardRole)}
              className="w-full rounded-lg border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm text-relaive-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
            >
              <option value="" disabled>
                Select your role
              </option>
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
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

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-relaive-primary to-relaive-secondary hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? 'Signing up...' : 'Sign up'}
        </Button>
      </form>

      <SocialLoginDivider />
      <SocialLoginButtons />
    </div>
  )
}
