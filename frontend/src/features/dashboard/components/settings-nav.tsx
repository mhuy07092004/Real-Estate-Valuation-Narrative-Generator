// Authors: Minh Huy Loi, Thi Tuong Vy Tran
import type { ReactElement, SVGProps } from 'react'
import { BellIcon, HelpCircleIcon, LogOutIcon, UserIcon } from '../../../components/ui/navbar/dashboard-navbar-icons'

function iconProps(props: SVGProps<SVGSVGElement>) {
  return {
    width: 18,
    height: 18,
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

function SubscriptionIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 14.5h4" />
    </svg>
  )
}

function BillingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  )
}

export type SettingsSectionId =
  | 'profile'
  | 'subscription'
  | 'billing'
  | 'notifications'
  | 'help-support'

type SettingsNavItem = {
  id: SettingsSectionId
  label: string
  icon: (props: SVGProps<SVGSVGElement>) => ReactElement
}

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'subscription', label: 'Subscription', icon: SubscriptionIcon },
  { id: 'billing', label: 'Billing & Invoices', icon: BillingIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'help-support', label: 'Help & Support', icon: HelpCircleIcon },
]

export function isSettingsSectionId(value: string | null): value is SettingsSectionId {
  return SETTINGS_NAV_ITEMS.some((item) => item.id === value)
}

type SettingsNavProps = {
  activeSection: SettingsSectionId
  onSelect: (section: SettingsSectionId) => void
  onSignOut: () => void
}

export function SettingsNav({ activeSection, onSelect, onSignOut }: SettingsNavProps) {
  return (
    <nav className="w-full shrink-0 sm:w-64">
      <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-col sm:overflow-visible sm:px-0 sm:pb-0">
        {SETTINGS_NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeSection === id
          return (
            <li key={id} className="shrink-0 sm:shrink">
              <button
                type="button"
                onClick={() => onSelect(id)}
                aria-current={active ? 'page' : undefined}
                className={[
                  'flex w-full items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors',
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

      <div className="mt-3 flex flex-row flex-wrap gap-1 border-t border-black/5 pt-3 sm:mt-4 sm:flex-col sm:pt-4">
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOutIcon className="shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  )
}
