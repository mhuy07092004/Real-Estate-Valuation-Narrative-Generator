import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../../../components/ui/button/button'
import { Input } from '../../../components/ui/input/input'
import { resetPassword } from '../../../services/auth'
import { AuthError } from '../../../types/auth'

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

// Mirrors the sign-up rule enforced by the backend (registration.validator.ts).
function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (!/[A-Za-z]/.test(password)) return 'Password must contain at least one letter'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number'
  return null
}

export function ResetPasswordForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [linkInvalid, setLinkInvalid] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!token || linkInvalid) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-relaive-navy">Link expired or invalid</h1>
          <p className="mt-2 text-sm text-relaive-gray">
            This password reset link can&apos;t be used. It may have expired or already been used.
          </p>
        </div>
        <Button
          href="/forgot-password"
          size="lg"
          className="w-full bg-gradient-to-r from-relaive-primary to-relaive-secondary hover:opacity-90"
        >
          Request a new link
        </Button>
      </div>
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const problem = validatePassword(password)
    if (problem) {
      setError(problem)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    try {
      await resetPassword(token as string, password)
      navigate('/signin', { replace: true, state: { passwordReset: true } })
    } catch (err) {
      if (err instanceof AuthError && !err.errors) {
        // No field errors means the token itself was rejected.
        setLinkInvalid(true)
      } else if (err instanceof AuthError) {
        setError(err.errors?.password ?? err.message)
      } else {
        setError('Could not reset your password. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-relaive-navy">Choose a new password</h1>
        <p className="mt-2 text-sm text-relaive-gray">
          At least 8 characters, with a letter and a number
        </p>
        {error ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <Input
          id="new-password"
          type={showPassword ? 'text' : 'password'}
          label="New password"
          placeholder="Enter a new password"
          startIcon={<ShieldIcon />}
          autoComplete="new-password"
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
        <Input
          id="confirm-password"
          type={showPassword ? 'text' : 'password'}
          label="Confirm password"
          placeholder="Re-enter the new password"
          startIcon={<ShieldIcon />}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
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

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-relaive-primary to-relaive-secondary hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? 'Updating…' : 'Reset password'}
        </Button>
      </form>
    </div>
  )
}
