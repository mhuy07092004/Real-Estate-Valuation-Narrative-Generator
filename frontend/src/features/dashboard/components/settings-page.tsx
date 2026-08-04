import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/use-auth'
import { clearActiveDashboardRole, isDashboardRole, type DashboardRole } from '../utils/dashboard-role'
import { SettingsNav, SETTINGS_NAV_ITEMS, type SettingsSectionId } from './settings-nav'
import { SettingsProfileForm } from './settings-profile-form'
import { SettingsSectionPlaceholder } from './settings-section-placeholder'

const ROLE_LABELS: Record<DashboardRole, string> = {
  agent: 'Senior Real-Estate Agent',
  valuer: 'Senior Property Valuer',
  investor: 'Senior Investor',
  buyer: 'Property Buyer',
}

export function SettingsPage() {
  const navigate = useNavigate()
  const { role: roleParam } = useParams<{ role: string }>()
  const { user, logout } = useAuth()
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('profile')

  const resolvedRole: DashboardRole =
    roleParam && isDashboardRole(roleParam) ? roleParam : 'agent'
  const roleLabel = ROLE_LABELS[resolvedRole]
  const activeLabel =
    SETTINGS_NAV_ITEMS.find((item) => item.id === activeSection)?.label ?? 'Settings'

  function handleSignOut() {
    clearActiveDashboardRole()
    logout()
    navigate('/signin')
  }

  return (
    <div className="flex flex-col">
      <header className="font-sans px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">
          Manage your account, integrations, and preferences
        </p>
      </header>

      <div className="flex flex-col gap-5 p-4 sm:flex-row sm:gap-6 sm:p-6 lg:p-8">
        <SettingsNav
          activeSection={activeSection}
          onSelect={setActiveSection}
          onSignOut={handleSignOut}
        />
        {activeSection === 'profile' ? (
          <SettingsProfileForm user={user} roleLabel={roleLabel} />
        ) : (
          <SettingsSectionPlaceholder title={activeLabel} />
        )}
      </div>
    </div>
  )
}
