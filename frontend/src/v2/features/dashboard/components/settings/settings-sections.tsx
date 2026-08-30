import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../../../../components/ui/card/card'
import {
  CheckSmallIcon,
  ChevronDownIcon,
  CreditCardIcon,
  DownloadIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  MessageCircleIcon,
  PlusIcon,
  ShieldIcon,
  XIcon,
} from './settings-icons'
import {
  DEFAULT_APPEARANCE_PREFERENCES,
  DEFAULT_NOTIFICATION_PREFERENCES,
  getAppearancePreferences,
  getNotificationPreferences,
  NOTIFICATION_PREFERENCE_ITEMS,
  setAppearancePreferences,
  setNotificationPreferences,
  type NotificationPreferenceId,
  type ThemePreference,
} from './settings-store'

// ---------------------------------------------------------------------------
// Subscription — plan tiers are static informational content (pricing display,
// not fabricated per-user billing data). "Upgrade"/"Switch Plan" send the user
// to the real pricing page; there is no live billing backend to wire yet.
// ---------------------------------------------------------------------------

const PLAN_TIERS = [
  {
    plan: 'Free',
    price: 'Free',
    features: ['5 reports/month', 'Basic property analysis', 'Limited comparable sales', 'Core calculators'],
    current: false,
  },
  {
    plan: 'Plus',
    price: '$49/mo',
    features: [
      '100 reports/month',
      'Advanced property analysis',
      'Advanced market insights',
      '50 saved properties',
      'Priority processing',
    ],
    current: true,
  },
  {
    plan: 'Pro',
    price: '$129/mo',
    features: [
      'Unlimited reports',
      'Full property intelligence',
      'Unlimited watchlist',
      'All role workflows',
      'Priority processing',
    ],
    current: false,
  },
]

export function SubscriptionSection() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-gradient-to-br from-relaive-navy to-[#1C2A38] p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-white/50">Current Plan</div>
            <div className="text-2xl font-semibold">Plus</div>
          </div>
          <div className="rounded-xl border border-relaive-secondary/30 bg-relaive-secondary/20 px-4 py-2 text-sm text-relaive-secondary">
            Active
          </div>
        </div>
        <p className="mt-4 text-3xl font-semibold">
          $49<span className="text-lg text-white/50">/month</span>
        </p>
        <p className="text-sm text-white/60">Billed monthly</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/plans')}
            className="rounded-xl bg-gradient-to-r from-relaive-secondary to-relaive-primary px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Upgrade to Pro
          </button>
          <CancelPlanButton />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {PLAN_TIERS.map((tier) => (
          <div
            key={tier.plan}
            className={`rounded-2xl border bg-white p-5 ${
              tier.current ? 'border-relaive-primary/40 ring-2 ring-relaive-primary/10' : 'border-black/5'
            }`}
          >
            {tier.current ? (
              <div className="mb-3 inline-block rounded-md bg-relaive-primary/10 px-2 py-0.5 text-xs text-relaive-primary">
                Current
              </div>
            ) : null}
            <h4 className="text-base font-semibold text-relaive-navy">{tier.plan}</h4>
            <div className="mb-3 text-xl font-semibold text-relaive-primary">{tier.price}</div>
            <div className="mb-4 flex flex-col gap-2">
              {tier.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-xs text-relaive-gray">
                  <CheckSmallIcon className="text-relaive-secondary" />
                  {feature}
                </div>
              ))}
            </div>
            {!tier.current ? (
              <button
                type="button"
                onClick={() => navigate('/plans')}
                className="w-full rounded-xl bg-relaive-primary/[0.06] py-2 text-sm text-relaive-primary transition-colors hover:bg-relaive-primary/10"
              >
                Switch Plan
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function CancelPlanButton() {
  const [message, setMessage] = useState(false)
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => {
          setMessage(true)
          window.setTimeout(() => setMessage(false), 3000)
        }}
        className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm text-white transition-colors hover:bg-white/20"
      >
        Cancel Plan
      </button>
      {message ? (
        <span className="text-xs text-white/70">
          Self-serve cancellation isn't available yet — contact support.
        </span>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Billing — payment-method and invoice-history *shape* matching the prototype.
// No real billing backend exists, so the card form is local-only state (same
// as the prototype) and the invoice rows are clearly labelled as a preview,
// not presented as this user's real transaction history.
// ---------------------------------------------------------------------------

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return digits
}

type SavedCard = {
  brand: string
  last4: string
  expiry: string
  name: string
}

function PaymentMethodSection() {
  const [saved, setSaved] = useState<SavedCard | null>({
    brand: 'Card',
    last4: '4242',
    expiry: '08/27',
    name: 'Card on file',
  })
  const [editing, setEditing] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [showCvc, setShowCvc] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const isValid =
    cardName.trim() !== '' && cardNumber.replace(/\s/g, '').length === 16 && expiry.length === 5 && cvc.length >= 3

  function handleSave() {
    const last4 = cardNumber.replace(/\s/g, '').slice(-4)
    setSaved({ brand: 'Card', last4, expiry, name: cardName })
    setEditing(false)
    setJustSaved(true)
    window.setTimeout(() => setJustSaved(false), 2500)
    setCardName('')
    setCardNumber('')
    setExpiry('')
    setCvc('')
  }

  function handleRemove() {
    setSaved(null)
    setRemoving(false)
  }

  return (
    <Card>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-base font-semibold text-relaive-navy">Payment Method</h3>
        {justSaved ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-relaive-secondary">
            <CheckSmallIcon /> Saved
          </span>
        ) : null}
      </div>

      {saved && !editing ? (
        <>
          <div className="mb-4 flex items-center gap-4 rounded-xl bg-relaive-primary/[0.05] p-4">
            <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-relaive-secondary to-relaive-primary">
              <CreditCardIcon className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-relaive-navy">
                {saved.brand} •••• {saved.last4}
              </p>
              <p className="text-xs text-relaive-gray">
                {saved.name} · Expires {saved.expiry}
              </p>
            </div>
            <span className="rounded-full bg-relaive-secondary/10 px-2 py-0.5 text-[10px] font-medium text-relaive-secondary">
              Default
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-xl bg-relaive-primary/10 px-4 py-2 text-sm text-relaive-primary transition-colors hover:bg-relaive-primary/20"
            >
              Update Card
            </button>
            <button
              type="button"
              onClick={() => setRemoving(true)}
              className="rounded-xl px-4 py-2 text-sm text-red-500 transition-colors hover:bg-red-50"
            >
              Remove
            </button>
          </div>

          {removing ? (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="mb-3 text-sm text-red-700">
                Remove this payment method? You will need to add a new one before your next billing date.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRemove}
                  className="rounded-xl bg-red-500 px-4 py-2 text-sm text-white transition-colors hover:bg-red-600"
                >
                  Yes, remove
                </button>
                <button
                  type="button"
                  onClick={() => setRemoving(false)}
                  className="rounded-xl border border-red-100 bg-white px-4 py-2 text-sm text-red-500 transition-colors hover:bg-red-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : !saved && !editing ? (
        <div className="rounded-xl border-2 border-dashed border-relaive-primary/15 py-6 text-center">
          <CreditCardIcon className="mx-auto mb-2 text-relaive-primary/30" width={28} height={28} />
          <p className="mb-3 text-sm text-relaive-gray">No payment method on file</p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mx-auto flex items-center gap-2 rounded-xl bg-gradient-to-r from-relaive-secondary to-relaive-primary px-4 py-2 text-sm text-white transition-opacity hover:opacity-90"
          >
            <PlusIcon />
            Add Payment Method
          </button>
        </div>
      ) : null}

      {editing ? (
        <div className="flex flex-col gap-4">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-sm font-medium text-relaive-navy">
              {saved ? 'Update payment method' : 'Add payment method'}
            </p>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-relaive-gray transition-colors hover:text-relaive-navy"
            >
              <XIcon />
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-relaive-gray">Cardholder name</label>
            <input
              type="text"
              placeholder="Jane Smith"
              value={cardName}
              onChange={(event) => setCardName(event.target.value)}
              className="w-full rounded-xl bg-relaive-primary/[0.06] px-4 py-2.5 text-sm text-relaive-navy outline-none focus:ring-2 focus:ring-relaive-primary/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-relaive-gray">Card number</label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
              className="w-full rounded-xl bg-relaive-primary/[0.06] px-4 py-2.5 text-sm text-relaive-navy outline-none focus:ring-2 focus:ring-relaive-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs text-relaive-gray">Expiry date</label>
              <input
                type="text"
                placeholder="MM/YY"
                value={expiry}
                onChange={(event) => setExpiry(formatExpiry(event.target.value))}
                className="w-full rounded-xl bg-relaive-primary/[0.06] px-4 py-2.5 text-sm text-relaive-navy outline-none focus:ring-2 focus:ring-relaive-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-relaive-gray">CVC</label>
              <div className="relative">
                <input
                  type={showCvc ? 'text' : 'password'}
                  placeholder="•••"
                  maxLength={4}
                  value={cvc}
                  onChange={(event) => setCvc(event.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full rounded-xl bg-relaive-primary/[0.06] px-4 py-2.5 pr-10 text-sm text-relaive-navy outline-none focus:ring-2 focus:ring-relaive-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowCvc((value) => !value)}
                  aria-label={showCvc ? 'Hide CVC' : 'Show CVC'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-relaive-primary/60 transition-colors hover:text-relaive-primary"
                >
                  {showCvc ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-relaive-primary/[0.06] px-3 py-2.5 text-xs text-relaive-gray">
            <ShieldIcon className="shrink-0 text-relaive-secondary" />
            Secured by 256-bit SSL encryption
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={!isValid}
              className={`rounded-xl px-6 py-2.5 text-sm font-medium transition-all ${
                isValid
                  ? 'bg-gradient-to-r from-relaive-secondary to-relaive-primary text-white hover:shadow-lg'
                  : 'cursor-not-allowed bg-relaive-primary/[0.06] text-relaive-gray'
              }`}
            >
              Save Card
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl px-6 py-2.5 text-sm text-relaive-gray transition-colors hover:bg-black/5"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </Card>
  )
}

const SAMPLE_INVOICES = [
  { date: 'Monthly billing cycle', desc: 'Plus · Monthly', amount: '$53.90', status: 'Paid' },
  { date: 'Previous cycle', desc: 'Plus · Monthly', amount: '$53.90', status: 'Paid' },
  { date: 'Previous cycle', desc: 'Plus · Monthly', amount: '$53.90', status: 'Paid' },
]

export function BillingSection() {
  return (
    <div className="flex flex-col gap-4">
      <PaymentMethodSection />

      <Card>
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-base font-semibold text-relaive-navy">Invoice History</h3>
          <span className="text-xs text-relaive-gray">Preview — billing isn't connected yet</span>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {SAMPLE_INVOICES.map((invoice, index) => (
            <div key={index} className="flex items-center gap-4 rounded-xl bg-relaive-primary/[0.05] p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-relaive-navy">{invoice.date}</p>
                <p className="text-xs text-relaive-gray">{invoice.desc}</p>
              </div>
              <span className="text-sm font-semibold text-relaive-navy">{invoice.amount}</span>
              <span className="rounded-lg bg-relaive-secondary/10 px-2 py-0.5 text-xs font-medium text-relaive-secondary">
                {invoice.status}
              </span>
              <button
                type="button"
                disabled
                title="Invoice downloads aren't available yet"
                className="shrink-0 cursor-not-allowed rounded-lg p-2 text-relaive-primary/40"
              >
                <DownloadIcon />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notification preferences — real, working toggles backed by the localStorage
// pattern shared with the ROI / affordability calculator scenario stores.
// ---------------------------------------------------------------------------

export function NotificationPreferencesSection() {
  const [prefs, setPrefs] = useState(getNotificationPreferences)

  function toggle(id: NotificationPreferenceId) {
    setPrefs((current) => {
      const next = { ...current, [id]: !current[id] }
      setNotificationPreferences(next)
      return next
    })
  }

  return (
    <Card>
      <h3 className="mb-5 text-base font-semibold text-relaive-navy">Notification Preferences</h3>
      <div className="flex flex-col gap-3">
        {NOTIFICATION_PREFERENCE_ITEMS.map((item) => {
          const on = prefs[item.id] ?? DEFAULT_NOTIFICATION_PREFERENCES[item.id]
          return (
            <div key={item.id} className="flex items-center justify-between rounded-xl bg-relaive-primary/[0.05] p-4">
              <div>
                <p className="text-sm text-relaive-navy">{item.label}</p>
                <p className="text-xs text-relaive-gray">{item.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={item.label}
                onClick={() => toggle(item.id)}
                className={`relative ml-4 h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
                  on ? 'bg-gradient-to-r from-relaive-secondary to-relaive-primary' : 'bg-black/15'
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                    on ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Security — change password affordance (no backend endpoint exists; the
// form itself is real, but submitting is intentionally not wired to a
// nonexistent API — see backend/V2_BACKEND_TODO.md's Settings entries).
// ---------------------------------------------------------------------------

function PasswordField({ label }: { label: string }) {
  const [show, setShow] = useState(false)
  const [value, setValue] = useState('')
  return (
    <div>
      <label className="mb-1.5 block text-xs text-relaive-gray">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          placeholder="••••••••"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="w-full rounded-xl bg-relaive-primary/[0.06] px-4 py-2.5 pr-11 text-sm text-relaive-navy outline-none focus:ring-2 focus:ring-relaive-primary/20"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-relaive-primary/60 transition-colors hover:text-relaive-primary"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  )
}

export function SecuritySection() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <Card>
      <h3 className="mb-4 text-base font-semibold text-relaive-navy">Change Password</h3>
      <form
        className="flex max-w-md flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(true)
          window.setTimeout(() => setSubmitted(false), 3000)
        }}
      >
        <PasswordField label="Current Password" />
        <PasswordField label="New Password" />
        <PasswordField label="Confirm New Password" />
        <div className="mt-1 flex items-center gap-3">
          <button
            type="submit"
            className="w-fit rounded-xl bg-gradient-to-r from-relaive-secondary to-relaive-primary px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Update Password
          </button>
          {submitted ? (
            <span className="text-xs text-relaive-gray">
              Password changes aren't available yet — contact support.
            </span>
          ) : null}
        </div>
      </form>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Appearance — theme/language pickers, real and localStorage-persisted.
// ---------------------------------------------------------------------------

const THEME_OPTIONS: { id: ThemePreference; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
]

const LANGUAGE_OPTIONS = ['English (Australia)', 'English (US)', 'English (UK)']

export function AppearanceSection() {
  const [prefs, setPrefs] = useState(getAppearancePreferences)

  function update(next: Partial<typeof prefs>) {
    setPrefs((current) => {
      const merged = { ...current, ...next }
      setAppearancePreferences(merged)
      return merged
    })
  }

  return (
    <Card>
      <h3 className="mb-6 text-base font-semibold text-relaive-navy">Appearance</h3>

      <div>
        <p className="mb-3 text-sm text-relaive-navy">Theme</p>
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map((option) => {
            const active = prefs.theme === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => update({ theme: option.id })}
                className={`rounded-xl border p-4 text-sm transition-all ${
                  active ? 'border-relaive-primary ring-2 ring-relaive-primary/20' : 'border-black/10 hover:border-relaive-primary/30'
                }`}
              >
                <div
                  className={`mb-2 h-16 w-full rounded-lg border border-black/10 ${
                    option.id === 'dark'
                      ? 'bg-relaive-navy'
                      : option.id === 'system'
                        ? 'bg-gradient-to-br from-white to-relaive-navy'
                        : 'bg-white'
                  }`}
                />
                <span className="text-relaive-navy">{option.label}</span>
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-xs text-relaive-gray">
          Saved to this browser. The app doesn't yet re-theme based on this choice.
        </p>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm text-relaive-navy">Language</p>
        <select
          value={prefs.language}
          onChange={(event) => update({ language: event.target.value })}
          className="w-full rounded-xl border border-transparent bg-relaive-primary/[0.06] px-4 py-2.5 text-sm text-relaive-navy outline-none focus:border-relaive-primary/20"
        >
          {LANGUAGE_OPTIONS.map((language) => (
            <option key={language} value={language}>
              {language}
            </option>
          ))}
        </select>
      </div>

      {(prefs.theme !== DEFAULT_APPEARANCE_PREFERENCES.theme ||
        prefs.language !== DEFAULT_APPEARANCE_PREFERENCES.language) && (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-relaive-secondary">
          <CheckSmallIcon /> Preferences saved
        </p>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Help & Support — static contact/business-hours content + a real FAQ accordion.
// ---------------------------------------------------------------------------

const FAQ_ITEMS = [
  {
    q: "How accurate are Relaive's AI valuations?",
    a: 'Our AI valuation engine is trained on Australian property transaction data and includes a confidence score and low-to-high range so you can judge accuracy at a glance. For formal lending or legal purposes, a licensed valuer should confirm the estimate.',
  },
  {
    q: 'How do I upgrade or change my subscription plan?',
    a: "Go to Settings → Subscription and choose \"Switch Plan\" or \"Upgrade to Pro\". Changes take effect at the start of your next billing cycle.",
  },
  {
    q: 'Can I cancel my subscription at any time?',
    a: 'Yes. You can cancel at any time from Settings → Subscription. Your access continues until the end of the current billing period.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards. You can update your payment method any time in Settings → Billing.',
  },
  {
    q: 'How do I export or download a report?',
    a: "Open any report and use the export option to download as PDF or DOCX. Reports are also accessible from the Reports section of your dashboard.",
  },
  {
    q: 'Is my data private and secure?',
    a: 'Yes. All data is encrypted in transit and at rest and is not sold or shared with third parties.',
  },
]

function FAQList() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="flex flex-col gap-2">
      {FAQ_ITEMS.map((item, index) => (
        <div key={item.q} className="overflow-hidden rounded-xl border border-black/5">
          <button
            type="button"
            onClick={() => setOpen(open === index ? null : index)}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-relaive-primary/[0.04]"
            aria-expanded={open === index}
          >
            <span className="text-sm font-medium text-relaive-navy">{item.q}</span>
            <ChevronDownIcon
              className={`shrink-0 text-relaive-primary transition-transform duration-200 ${open === index ? 'rotate-180' : ''}`}
            />
          </button>
          {open === index ? (
            <p className="border-t border-black/5 px-5 pb-4 pt-3 text-sm leading-relaxed text-relaive-gray">
              {item.a}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export function HelpSupportSection() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="mb-4 text-base font-semibold text-relaive-navy">Contact</h2>
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-relaive-navy to-[#1C2A38] p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <MessageCircleIcon className="text-relaive-secondary" />
              </div>
              <div>
                <h3 className="mb-1 text-base font-semibold">Contact Support</h3>
                <p className="mb-4 text-sm text-white/60">
                  Can't find what you're looking for? Our team is here to help.
                </p>
                <a
                  href="mailto:relaive.ai@gmail.com"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-relaive-secondary to-relaive-primary px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  <MessageCircleIcon />
                  relaive.ai@gmail.com
                  <ExternalLinkIcon className="opacity-60" />
                </a>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <p className="mb-3 text-sm font-medium text-relaive-navy">Business Hours</p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-relaive-gray">Monday – Friday</span>
                  <span className="text-xs font-medium text-relaive-primary">9:00am – 6:00pm AEST</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-relaive-gray">Saturday &amp; Sunday</span>
                  <span className="text-xs font-medium text-relaive-gray/50">Closed</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-black/5 pt-3">
                <span className="h-1.5 w-1.5 rounded-full bg-relaive-secondary" />
                <span className="text-xs text-relaive-gray">Response within 2 business days</span>
              </div>
            </Card>
            <Card>
              <p className="mb-3 text-sm font-medium text-relaive-navy">Follow Us</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'LinkedIn', href: '#' },
                  { label: 'Instagram', href: '#' },
                  { label: 'Facebook', href: '#' },
                  { label: 'Email', href: 'mailto:relaive.ai@gmail.com' },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    className="flex items-center justify-center rounded-xl bg-relaive-primary/[0.06] py-2 text-xs font-medium text-relaive-primary transition-colors hover:bg-relaive-primary/10"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-base font-semibold text-relaive-navy">Frequent Q&amp;A</h2>
        <Card>
          <FAQList />
        </Card>
      </div>
    </div>
  )
}
