import type { ReactElement, SVGProps } from 'react'
import { BellIcon, LogOutIcon, UserIcon } from '../../../../../components/ui/navbar/dashboard-navbar-icons'
import { CreditCardIcon, HelpCircleIcon, ShieldIcon } from './settings-icons'

function iconProps(props: SVGProps<SVGSVGElement>) {
  return {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
    ...props,
  }
}

function AppearanceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5a8.5 8.5 0 0 0 0 17z" fill="currentColor" stroke="none" />
    </svg>
  )
}

function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M5 7h14" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M7 7l1 13h8l1-13" />
    </svg>
  )
}

// Note: v1's nav also lists "API Keys" and "Integrations" — both were always
// dead placeholders ("Content for this section will go here.") and have no
// counterpart in the figma v2 prototype's information architecture, so they
// are intentionally dropped here rather than ported as more placeholders.
// "Security" is kept (and gains real content, see settings-sections.tsx)
// because Phase 1's profile-dropdown already deep-links to ?section=security.
export type SettingsSectionId =
  | 'profile'
  | 'subscription'
  | 'billing'
  | 'notifications'
  | 'security'
  | 'appearance'
  | 'help'

type SettingsNavItem = {
  id: SettingsSectionId
  label: string
  icon: (props: SVGProps<SVGSVGElement>) => ReactElement
}

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'subscription', label: 'Subscription', icon: CreditCardIcon },
  { id: 'billing', label: 'Billing & Invoices', icon: CreditCardIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'security', label: 'Security', icon: ShieldIcon },
  { id: 'appearance', label: 'Appearance', icon: AppearanceIcon },
  { id: 'help', label: 'Help & Support', icon: HelpCircleIcon },
]

type SettingsNavProps = {
  activeSection: SettingsSectionId
  onSelect: (section: SettingsSectionId) => void
  onSignOut: () => void
  onDeleteAccount: () => void
}

export function SettingsNav({ activeSection, onSelect, onSignOut, onDeleteAccount }: SettingsNavProps) {
  return (
    <nav className="w-full shrink-0 sm:w-64">
      <ul className="flex flex-col gap-1">
        {SETTINGS_NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeSection === id
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onSelect(id)}
                aria-current={active ? 'page' : undefined}
                className={[
                  'flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors',
                  active
                    ? 'bg-relaive-primary/10 text-relaive-primary'
                    : 'text-relaive-gray hover:bg-black/[0.03] hover:text-relaive-navy',
                ].join(' ')}
              >
                <Icon className="shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-4 flex flex-col gap-1 border-t border-black/5 pt-4">
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOutIcon className="shrink-0" />
          <span>Sign Out</span>
        </button>
        <button
          type="button"
          onClick={onDeleteAccount}
          className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <TrashIcon className="shrink-0" />
          <span>Delete Account</span>
        </button>
      </div>
    </nav>
  )
}
