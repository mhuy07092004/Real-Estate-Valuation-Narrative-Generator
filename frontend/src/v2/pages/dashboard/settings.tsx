import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../features/auth/hooks/use-auth'
import { SettingsProfileForm } from '../../../features/dashboard/components/settings-profile-form'
import { clearActiveDashboardRole, isDashboardRole, type DashboardRole } from '../../../features/dashboard/utils/dashboard-role'
import { SettingsDeleteAccountDialog } from '../../features/dashboard/components/settings/settings-delete-account-dialog'
import { SettingsNav, SETTINGS_NAV_ITEMS, type SettingsSectionId } from '../../features/dashboard/components/settings/settings-nav'
import {
  AppearanceSection,
  BillingSection,
  HelpSupportSection,
  NotificationPreferencesSection,
  SecuritySection,
  SubscriptionSection,
} from '../../features/dashboard/components/settings/settings-sections'

const ROLE_LABELS: Record<DashboardRole, string> = {
  agent: 'Senior Real-Estate Agent',
  valuer: 'Senior Property Valuer',
  investor: 'Senior Investor',
  buyer: 'Property Buyer',
}

function isSettingsSectionId(value: string | null): value is SettingsSectionId {
  return value != null && SETTINGS_NAV_ITEMS.some((item) => item.id === value)
}

export function SettingsPageV2() {
  const navigate = useNavigate()
  const { role: roleParam } = useParams<{ role: string }>()
  const { user, logout } = useAuth()
  const [searchParams] = useSearchParams()

  // Phase 1's v2 topbar profile dropdown links here with ?section=profile|security|help —
  // honour it on load so those links land on the right section instead of always Profile.
  const initialSection = isSettingsSectionId(searchParams.get('section')) ? searchParams.get('section') : null
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(
    (initialSection as SettingsSectionId) ?? 'profile',
  )
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const resolvedRole: DashboardRole = roleParam && isDashboardRole(roleParam) ? roleParam : 'agent'
  const roleLabel = ROLE_LABELS[resolvedRole]

  function handleSignOut() {
    clearActiveDashboardRole()
    logout()
    navigate('/signin')
  }

  return (
    <div className="flex flex-col">
      <header className="font-sans px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">Settings</h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">
          Manage your account, integrations, and preferences
        </p>
      </header>

      <div className="flex flex-col gap-5 p-4 sm:flex-row sm:gap-6 sm:p-6 lg:p-8">
        <SettingsNav
          activeSection={activeSection}
          onSelect={setActiveSection}
          onSignOut={handleSignOut}
          onDeleteAccount={() => setShowDeleteDialog(true)}
        />

        <div className="min-w-0 flex-1">
          {activeSection === 'profile' && <SettingsProfileForm user={user} roleLabel={roleLabel} />}
          {activeSection === 'subscription' && <SubscriptionSection />}
          {activeSection === 'billing' && <BillingSection />}
          {activeSection === 'notifications' && <NotificationPreferencesSection />}
          {activeSection === 'security' && <SecuritySection />}
          {activeSection === 'appearance' && <AppearanceSection />}
          {activeSection === 'help' && <HelpSupportSection />}
        </div>
      </div>

      {showDeleteDialog ? <SettingsDeleteAccountDialog onClose={() => setShowDeleteDialog(false)} /> : null}
    </div>
  )
}
