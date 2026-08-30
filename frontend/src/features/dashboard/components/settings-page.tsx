import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../../components/ui/button/button'
import { Card } from '../../../components/ui/card/card'
import { DropCardList, type DropCardItem } from '../../../components/ui/drop-card/drop-card'
import { CURRENT_PLAN_ID, getPlanById } from '../../../services/plans'
import { useAuth } from '../../auth/hooks/use-auth'
import { clearActiveDashboardRole, isDashboardRole, type DashboardRole } from '../utils/dashboard-role'
import { SettingsNav, SETTINGS_NAV_ITEMS, type SettingsSectionId } from './settings-nav'
import { SettingsProfileForm } from './settings-profile-form'
import { SettingsSectionPlaceholder } from './settings-section-placeholder'

function QuestionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M9.5 9.5a2.5 2.5 0 1 1 3.7 2.2c-.7.4-1.2 1-1.2 1.8v.3M12 17h.01"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const HELP_FAQ_ITEMS: DropCardItem[] = [
  {
    id: 'payment-method',
    icon: <QuestionIcon />,
    title: 'Payment method?',
    description: 'How to add or change your payment method',
    children:
      'You can add a new card from Settings → Billing & Invoices by clicking "Add payment method". To update or remove your current card, use the "Update card" or "Remove" buttons on the same page.',
  },
  {
    id: 'cancel-subscription',
    icon: <QuestionIcon />,
    title: 'Cancel subscription?',
    description: 'How to cancel or downgrade your plan',
    children:
      'Go to Settings → Subscription and click "Cancel Plan". Your access will continue until the end of the current billing cycle, after which your account moves to the free tier.',
  },
  {
    id: 'invoice-download',
    icon: <QuestionIcon />,
    title: 'Where can I find my invoices?',
    description: 'Download past invoices and receipts',
    children:
      'All past invoices are listed under Settings → Billing & Invoices in the "Invoice History" section, where you can view and download each one as a PDF.',
  },
  {
    id: 'valuation-accuracy',
    icon: <QuestionIcon />,
    title: 'How accurate are AI valuations?',
    description: 'Understanding confidence indicators',
    children:
      'Relaive valuations are generated from comparable sales, suburb trends, and property attributes, and include a confidence indicator. We recommend reviewing the reasoning before sharing with clients.',
  },
  {
    id: 'reset-password',
    icon: <QuestionIcon />,
    title: 'How do I reset my password?',
    description: 'Steps to regain access to your account',
    children:
      'Sign out and select "Forgot password" on the sign-in page to receive a reset link by email. You can also change your password anytime from Settings → Security.',
  },
]

const SUBSCRIPTION_PICKS = ['starter', 'professional', 'investor-pro'] as const

const THEME_OPTIONS = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
] as const

type ThemeOptionId = (typeof THEME_OPTIONS)[number]['id']

const NOTIFICATION_ITEMS = [
  {
    id: 'email',
    label: 'Email Notifications',
    description: 'Receive important updates via email',
    defaultChecked: true,
  },
  {
    id: 'push',
    label: 'Push Notifications',
    description: 'Browser & mobile push alerts',
    defaultChecked: true,
  },
  {
    id: 'ai-valuation',
    label: 'AI Valuation Updates',
    description: 'When AI estimates change significantly',
    defaultChecked: true,
  },
  {
    id: 'market-alerts',
    label: 'Market Alerts',
    description: 'Suburb price and demand changes',
    defaultChecked: true,
  },
  {
    id: 'comparable-sales',
    label: 'Comparable Sales Alerts',
    description: 'New sales near your properties',
    defaultChecked: true,
  },
  {
    id: 'weekly-digest',
    label: 'Weekly Report Digest',
    description: 'Summary of activity every Monday',
    defaultChecked: false,
  },
  {
    id: 'ai-insights',
    label: 'AI Insights Alerts',
    description: 'When AI generates important insights',
    defaultChecked: true,
  },
  {
    id: 'forecast-updates',
    label: 'Forecast Updates',
    description: 'AI growth forecast changes',
    defaultChecked: false,
  },
] as const

type NotificationId = (typeof NOTIFICATION_ITEMS)[number]['id']

const LANGUAGE_OPTIONS = [
  { id: 'en', label: 'English' },
  { id: 'vi', label: 'Tiếng Việt' },
  { id: 'es', label: 'Español' },
  { id: 'fr', label: 'Français' },
  { id: 'zh', label: '中文' },
] as const

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
  const [theme, setTheme] = useState<ThemeOptionId>('system')
  const [language, setLanguage] = useState<string>('en')
  const [notifications, setNotifications] = useState<Record<NotificationId, boolean>>(
    () =>
      Object.fromEntries(
        NOTIFICATION_ITEMS.map((item) => [item.id, item.defaultChecked]),
      ) as Record<NotificationId, boolean>,
  )

  function toggleNotification(id: NotificationId) {
    setNotifications((prev) => ({ ...prev, [id]: !prev[id] }))
  }

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
          Manage your account and preferences
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
        ) : activeSection === 'subscription' ? (
          <div className="flex w-full flex-1 flex-col gap-5 self-start">
            {(() => {
              const currentPlan = getPlanById(CURRENT_PLAN_ID)
              return (
                <div className="rounded-3xl bg-gradient-to-br from-[#102132] to-[#1C2A38] px-6 py-6 text-white shadow-[0_8px_32px_rgba(15,23,42,0.25)] sm:px-7">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-white/60">Current Plan</p>
                      <h2 className="mt-1 text-2xl font-semibold">{currentPlan.title}</h2>
                    </div>
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-300">
                      Active
                    </span>
                  </div>

                  <p className="mt-5 text-3xl font-bold tracking-tight">
                    {currentPlan.price}
                    {currentPlan.priceSuffix ? (
                      <span className="ml-1 text-base font-medium text-white/60">
                        {currentPlan.priceSuffix}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-white/60">
                    Billed monthly · Next renewal Jan 10, 2027
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" size="sm">
                      Upgrade to Pro
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="border border-white/15 text-white hover:bg-white/10"
                    >
                      Cancel Plan
                    </Button>
                  </div>
                </div>
              )
            })()}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {SUBSCRIPTION_PICKS.map((id) => {
                const plan = getPlanById(id)
                const isCurrent = id === CURRENT_PLAN_ID
                return (
                  <Card
                    key={id}
                    className={isCurrent ? 'ring-2 ring-relaive-primary/40' : ''}
                  >
                    {isCurrent ? (
                      <span className="mb-2 inline-flex w-fit rounded-full bg-relaive-primary/10 px-3 py-1 text-xs font-medium text-relaive-primary">
                        Current
                      </span>
                    ) : null}
                    <h3 className="text-base font-semibold text-relaive-navy">{plan.title}</h3>
                    <p className="mt-1 text-lg font-bold text-relaive-primary">
                      {plan.price}
                      {plan.priceSuffix ? (
                        <span className="ml-1 text-sm font-medium text-relaive-gray">
                          /mo
                        </span>
                      ) : null}
                    </p>
                    <ul className="mt-4 flex flex-1 flex-col gap-2">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm text-relaive-gray"
                        >
                          <span className="mt-0.5 text-relaive-secondary">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    {!isCurrent ? (
                      <Button type="button" size="sm" className="mt-5 w-full">
                        Switch Plan
                      </Button>
                    ) : (
                      <div className="mt-5 h-9" aria-hidden="true" />
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        ) : activeSection === 'billing' ? (
          <div className="flex w-full flex-1 flex-col gap-5 self-start">
            <Card className="!h-auto">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold text-relaive-navy">
                  Payment method
                </h2>
                <Button type="button" size="sm" onClick={() => undefined}>
                  Add payment method
                </Button>
              </div>

              <div className="mt-5 rounded-2xl border border-black/5 bg-relaive-primary/[0.04] px-4 py-4 sm:px-5">
                <p className="text-sm font-semibold text-relaive-navy">
                  Visa •••• 4242
                </p>
                <p className="mt-1 text-sm text-relaive-gray">
                  Hayden L · Expires 08/27
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm">
                    Update card
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="!h-auto min-h-0">
              <h2 className="text-base font-semibold text-relaive-navy">
                Invoice History
              </h2>
              <div className="mt-3 max-h-72 overflow-y-auto">
                <p className="text-sm text-relaive-gray">No invoices yet.</p>
              </div>
            </Card>
          </div>
        ) : activeSection === 'notifications' ? (
          <Card className="!h-auto flex-1 self-start">
            <h2 className="text-base font-semibold text-relaive-navy">
              Notification Preferences
            </h2>
            <div className="mt-4 flex flex-col gap-2.5">
              {NOTIFICATION_ITEMS.map((item) => {
                const checked = notifications[item.id]
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-xl bg-relaive-primary/[0.04] px-4 py-3.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-relaive-navy">{item.label}</p>
                      <p className="mt-0.5 text-xs text-relaive-gray">{item.description}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={checked}
                      aria-label={item.label}
                      onClick={() => toggleNotification(item.id)}
                      className={[
                        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary',
                        checked ? 'bg-relaive-secondary' : 'bg-black/15',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                          checked ? 'translate-x-5' : 'translate-x-0.5',
                        ].join(' ')}
                      />
                    </button>
                  </div>
                )
              })}
            </div>
          </Card>
        ) : activeSection === 'appearance' ? (
          <Card className="!h-auto flex-1 self-start">
            <h2 className="text-base font-semibold text-relaive-navy">Appearance</h2>
            <p className="mt-1 text-sm text-relaive-gray">
              Choose how Relaive looks and which language to use
            </p>

            <p className="mt-6 text-sm font-medium text-relaive-navy">Theme</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {THEME_OPTIONS.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  size="sm"
                  variant={theme === option.id ? 'primary' : 'outline'}
                  onClick={() => setTheme(option.id)}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            <p className="mt-6 text-sm font-medium text-relaive-navy">Language</p>
            <div className="mt-2 sm:max-w-xs">
              <select
                id="settings-language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm text-relaive-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <Button type="button" size="sm" className="mt-6 w-fit self-start">
              Save
            </Button>
          </Card>
        ) : activeSection === 'help-support' ? (
          <div className="flex w-full flex-1 flex-col gap-5 self-start">
            <div>
              <Card className="!h-auto">
                <h2 className="text-base font-semibold text-relaive-navy">Contact Us</h2>
                <h3 className="mt-4 text-sm font-semibold text-relaive-navy">Business Hours</h3>
                <div className="mt-3 flex flex-col gap-1">
                  <p className="text-sm text-relaive-navy">Monday – Friday</p>
                  <p className="text-sm text-relaive-gray">9:00am – 6:00pm AEST</p>
                </div>
                <div className="mt-3 flex flex-col gap-1 border-t border-black/5 pt-3">
                  <p className="text-sm text-relaive-navy">Saturday &amp; Sunday</p>
                  <p className="text-sm text-relaive-gray">Closed</p>
                </div>
                <p className="mt-4 border-t border-black/5 pt-3 text-xs text-relaive-gray">
                  Usually response within 2 business days
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" href="mailto:relaive.ai@gmail.com">
                    Email Us Now
                  </Button>
                  <Button type="button" size="sm" onClick={() => undefined}>
                    Contact Us
                  </Button>
                </div>
              </Card>
            </div>

            <Card className="!h-auto">
              <h2 className="text-base font-semibold text-relaive-navy">
                Frequently Asked Questions
              </h2>
              <DropCardList items={HELP_FAQ_ITEMS} className="mt-5" allowMultiple={true} />
            </Card>
          </div>
        ) : (
          <SettingsSectionPlaceholder title={activeLabel} />
        )}
      </div>
    </div>
  )
}
