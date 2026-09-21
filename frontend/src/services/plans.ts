// Shared subscription plan pricing/data — single source of truth for the
// landing Plans section (`components/landing/plans-page/plan-price.tsx`) and the
// dashboard Settings > Subscription section (`features/dashboard/components/settings-page.tsx`).
// Update pricing/features here only; both surfaces stay in sync automatically.

export type PlanId = 'free' | 'plus' | 'pro'
export type PlanBadgeTone = 'default' | 'popular' | 'enterprise'
export type PlanIconKey = 'lightning' | 'users' | 'chart'

export type PlanCta = {
  label: string
  href: string
}

export type PlanTier = {
  id: PlanId
  iconKey: PlanIconKey
  badge: string
  badgeTone?: PlanBadgeTone
  title: string
  description: string
  price: string
  priceSuffix?: string
  bestFor: string
  features: string[]
  primaryCta: PlanCta
  secondaryCta: PlanCta
  primaryCtaStyle?: 'primary' | 'soft' | 'gold'
  highlighted?: boolean
  variant?: 'light' | 'dark'
}

// Every plan includes every feature below; plans differ only by monthly
// report limit. Shown once in the comparison table, and summarised as "All
// features included" on the cards and in Settings > Subscription.
export const INCLUDED_FEATURES = [
  'Automated valuation summaries',
  'Comparable sales with similarity ranking',
  'Market insights & suburb explorer',
  'AI price prediction',
  'Shareable report link',
  'Email reports to clients',
  'ROI calculator & market comparison',
  'Buyer affordability calculator',
]

// The only thing that differs between plans. Not yet enforced by the backend.
export const REPORT_LIMITS: Record<PlanId, number> = { free: 5, plus: 50, pro: 100 }

function planFeatures(id: PlanId): string[] {
  return [`${REPORT_LIMITS[id]} AI reports / month`, 'All features included']
}

export const ANNUAL_DISCOUNT = 0.2
export const ANNUAL_DISCOUNT_LABEL = `Save ${ANNUAL_DISCOUNT * 100}%`

/** "$79" -> "$63.2" (per-month price when billed annually). */
export function annualMonthlyPrice(price: string): string {
  return `$${(parseFloat(price.replace('$', '')) * (1 - ANNUAL_DISCOUNT)).toFixed(1)}`
}

export const PLAN_TIERS: PlanTier[] = [
  {
    id: 'free',
    iconKey: 'lightning',
    badge: 'Best for Beginners',
    title: 'Free',
    description:
      'Get started with AI-powered real estate reporting and property valuation workflows.',
    price: 'Free',
    bestFor: 'Beginners',
    features: planFeatures('free'),
    primaryCta: { label: 'Start Free', href: '/signin' },
    secondaryCta: { label: 'Sign In', href: '/signin' },
    primaryCtaStyle: 'primary',
  },
  {
    id: 'plus',
    iconKey: 'users',
    badge: 'Most Popular',
    badgeTone: 'popular',
    title: 'Plus',
    description: 'Every feature, with room for regular client work.',
    price: '$79',
    priceSuffix: '/month',
    bestFor: 'Valuers, agents & consultants',
    features: planFeatures('plus'),
    primaryCta: { label: 'Upgrade to Plus', href: '/signin' },
    secondaryCta: { label: 'Sign Up', href: '/signup' },
    primaryCtaStyle: 'primary',
    highlighted: true,
  },
  {
    id: 'pro',
    iconKey: 'chart',
    badge: 'Highest Volume',
    title: 'Pro',
    description: 'Every feature, with the highest report allowance for busy practices and investors.',
    price: '$129',
    priceSuffix: '/month',
    bestFor: 'Property investors & analysts',
    features: planFeatures('pro'),
    primaryCta: { label: 'Upgrade to Pro', href: '/signin' },
    secondaryCta: { label: 'Sign Up', href: '/signup' },
    primaryCtaStyle: 'primary',
  },
]

export function getPlanById(id: PlanId): PlanTier {
  const plan = PLAN_TIERS.find((tier) => tier.id === id)
  if (!plan) {
    throw new Error(`Unknown plan id: ${id}`)
  }
  return plan
}

/** Mock "current subscription" — swap for the real user's plan once billing is wired. */
export const CURRENT_PLAN_ID: PlanId = 'free'
