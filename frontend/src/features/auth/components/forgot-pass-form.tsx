import { useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/button/button'
import { Input } from '../../../components/ui/input/input'
import { requestPasswordReset } from '../../../services/auth'
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

export function ForgotPassForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  async function submit() {
    setError(null)
    setIsSubmitting(true)
    try {
      await requestPasswordReset(email.trim())
      setSentTo(email.trim())
    } catch (err) {
      setError(
        err instanceof AuthError
          ? (err.errors?.email ?? err.message)
          : 'Could not send the reset link. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submit()
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-relaive-navy">Check your email</h1>
          <p className="mt-2 text-sm text-relaive-gray">
            If an account exists for <span className="font-medium text-relaive-navy">{sentTo}</span>,
            we&apos;ve sent a link to reset your password. It expires in 30 minutes.
          </p>
        </div>
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <p className="text-sm text-relaive-gray">
          Didn&apos;t get it? Check your spam folder or{' '}
          <Button
            type="button"
            variant="link"
            className="text-relaive-primary"
            disabled={isSubmitting}
            onClick={() => void submit()}
          >
            {isSubmitting ? 'Sending…' : 'send it again'}
          </Button>
          .
        </p>
        <Button variant="link" href="/signin" className="text-relaive-navy">
          Back to sign in
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-relaive-navy">Forgot your password?</h1>
        <p className="mt-2 text-sm text-relaive-gray">
          Enter your email and we&apos;ll send you a link to reset it
        </p>
        {error ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
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

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-relaive-primary to-relaive-secondary hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </Button>

        <div className="text-center text-sm">
          <Button variant="link" href="/signin" className="text-relaive-navy">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
