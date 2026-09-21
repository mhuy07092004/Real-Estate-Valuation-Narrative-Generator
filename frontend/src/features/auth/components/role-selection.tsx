import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button/button'
import type { DashboardRole } from '../../dashboard/utils/dashboard-role'
import { AuthError } from '../../../types/auth'
import { useAuth } from '../hooks/use-auth'

export const ROLE_OPTIONS: { value: DashboardRole; label: string }[] = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'investor', label: 'Investor' },
  { value: 'valuer', label: 'Property Valuer' },
  { value: 'agent', label: 'Agent' },
]

export function RoleSelection() {
  const navigate = useNavigate()
  const { selectRole } = useAuth()
  const [role, setRole] = useState<DashboardRole | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!role) {
      setError('Please select a role.')
      return
    }

    setIsSubmitting(true)
    try {
      await selectRole(role)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message)
      } else {
        setError('Could not save your role. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-relaive-navy">Choose your role</h1>
        <p className="mt-2 text-sm text-relaive-gray">
          Start your property intelligence workflow
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div role="radiogroup" aria-label="Role" className="grid grid-cols-2 gap-3">
          {ROLE_OPTIONS.map((option) => {
            const selected = role === option.value
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setRole(option.value)}
                className={[
                  'rounded-lg border px-4 py-6 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary',
                  selected
                    ? 'border-relaive-primary bg-relaive-primary/10 text-relaive-navy'
                    : 'border-black/10 bg-white text-relaive-navy hover:border-relaive-primary/40',
                ].join(' ')}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || !role}
          className="w-full bg-gradient-to-r from-relaive-primary to-relaive-secondary hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? 'Saving...' : 'Confirm'}
        </Button>
      </form>
    </div>
  )
}
