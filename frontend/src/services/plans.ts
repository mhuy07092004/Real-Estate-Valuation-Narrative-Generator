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
  features: string[]
  primaryCta: PlanCta
  secondaryCta: PlanCta
  primaryCtaStyle?: 'primary' | 'soft' | 'gold'
  highlighted?: boolean
  variant?: 'light' | 'dark'
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
    features: [
      '5 appraisal reports /month',
      'Automated valuation summaries',
      'Basic comparable sales overview',
      'Limited PDF export',
    ],
    primaryCta: { label: 'Start Free', href: '#' },
    secondaryCta: { label: 'Try Demo', href: '#' },
    primaryCtaStyle: 'primary',
  },
  {
    id: 'plus',
    iconKey: 'users',
    badge: 'Most Popular',
    badgeTone: 'popular',
    title: 'Plus',
    description:
      'Unlock deeper market intelligence with advanced analytics, branded reports, and customizable AI insights.',
    price: '$79',
    priceSuffix: '/month',
    features: [
      '50 monthly reports',
      'Advanced comparable sales analysis',
      'Create branded client-ready reports',
      'Flexible report templates',
      'AI confidence insights',
    ],
    primaryCta: { label: 'Upgrade to Plus', href: '#' },
    secondaryCta: { label: 'Start Free Trial', href: '#' },
    primaryCtaStyle: 'primary',
    highlighted: true,
  },
  {
    id: 'pro',
    iconKey: 'chart',
    badge: 'Predictive Analytics',
    title: 'Pro',
    description: 'Predictive market intelligence and investment-focused analytics powered by AI.',
    price: '$129',
    priceSuffix: '/month',
    features: [
      '100 AI-generated reports/month',
      'ROI & cash flow forecasting',
      'Investment opportunity scoring',
      'Suburb growth prediction insights',
      'Risk & market trend analysis',
      'All features in Plus Plan',
    ],
    primaryCta: { label: 'Upgrade to Pro', href: '#' },
    secondaryCta: { label: 'Start Free Trial', href: '#' },
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
export const CURRENT_PLAN_ID: PlanId = 'plus'
