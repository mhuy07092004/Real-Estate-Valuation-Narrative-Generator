import { useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/button/button'
import { Card } from '../../../components/ui/card/card'
import { Input } from '../../../components/ui/input/input'
import { useAuth } from '../../auth/hooks/use-auth'
import type { User } from '../../../types/auth'
import { getInitials } from '../utils/dashboard-user'

const INPUT_CLASS = '!border-relaive-primary/25 !bg-relaive-primary/[0.06] !text-relaive-navy'

type SettingsProfileFormProps = {
  user: User | null
  roleLabel: string
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

export function SettingsProfileForm({ user, roleLabel }: SettingsProfileFormProps) {
  const { updateProfile } = useAuth()
  const fullName = user?.fullName ?? 'Guest User'
  const initials = getInitials(fullName)

  const initial = splitFullName(fullName)
  const [firstName, setFirstName] = useState(initial.firstName)
  const [lastName, setLastName] = useState(initial.lastName)
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [company, setCompany] = useState(user?.company ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [savedJustNow, setSavedJustNow] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)
    try {
      await updateProfile({
        fullName: `${firstName} ${lastName}`.trim(),
        phone: phone.trim(),
        company: company.trim(),
      })
      setSavedJustNow(true)
      setTimeout(() => setSavedJustNow(false), 2500)
    } catch {
      setError('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="flex-1">
      <h2 className="text-base font-semibold text-relaive-navy">Personal Information</h2>

      <div className="mt-5 flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-relaive-secondary to-relaive-primary text-lg font-semibold text-white">
          {initials}
        </span>
        <div className="flex flex-col items-start gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(event) => event.preventDefault()}
          >
            Change Photo
          </Button>
          <p className="text-xs text-relaive-gray">JPG, PNG or GIF. Max 5MB.</p>
        </div>
      </div>

      <form className="mt-6 flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="settings-first-name"
            label="First Name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className={INPUT_CLASS}
          />
          <Input
            id="settings-last-name"
            label="Last Name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className={INPUT_CLASS}
          />
          <Input
            id="settings-phone"
            label="Phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className={INPUT_CLASS}
          />
          <Input
            id="settings-company"
            label="Company"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            className={INPUT_CLASS}
          />
          <Input
            id="settings-role"
            label="Role"
            defaultValue={roleLabel}
            disabled
            className={INPUT_CLASS}
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" variant="primary" className="w-fit" disabled={isSaving}>
          {isSaving ? 'Saving…' : savedJustNow ? 'Saved!' : 'Save Changes'}
        </Button>
      </form>
    </Card>
  )
}
