import { Button } from '../../../components/ui/button/button'
import { Card } from '../../../components/ui/card/card'
import { Input } from '../../../components/ui/input/input'
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
  const fullName = user?.fullName ?? 'Guest User'
  const { firstName, lastName } = splitFullName(fullName)
  const initials = getInitials(fullName)

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

      <form
        className="mt-6 flex flex-col gap-5"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="settings-first-name"
            label="First Name"
            defaultValue={firstName}
            className={INPUT_CLASS}
          />
          <Input
            id="settings-last-name"
            label="Last Name"
            defaultValue={lastName}
            className={INPUT_CLASS}
          />
          <Input
            id="settings-email"
            label="Email"
            type="email"
            defaultValue={user?.email ?? ''}
            className={INPUT_CLASS}
          />
          <Input
            id="settings-phone"
            label="Phone"
            type="tel"
            defaultValue="+61 400 000 000"
            className={INPUT_CLASS}
          />
          <Input
            id="settings-company"
            label="Company"
            defaultValue="Relaive"
            className={INPUT_CLASS}
          />
          <Input
            id="settings-role"
            label="Role"
            defaultValue={roleLabel}
            className={INPUT_CLASS}
          />
        </div>

        <Button type="submit" variant="primary" className="w-fit">
          Save Changes
        </Button>
      </form>
    </Card>
  )
}
