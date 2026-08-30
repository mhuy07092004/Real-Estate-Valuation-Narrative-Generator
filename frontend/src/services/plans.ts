// Shared subscription plan pricing/data — single source of truth for the
// landing Plans page (`components/landing/plans-page/plan-price.tsx`) and the
// dashboard Settings > Subscription section (`features/dashboard/components/settings-page.tsx`).
// Update pricing/features here only; both surfaces stay in sync automatically.

export type PlanId = 'starter' | 'professional' | 'investor-pro' | 'team-workspace' | 'enterprise'
export type PlanBadgeTone = 'default' | 'popular' | 'enterprise'
export type PlanIconKey = 'lightning' | 'users' | 'chart' | 'building' | 'shield'

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
    id: 'starter',
    iconKey: 'lightning',
    badge: 'Best for Beginners',
    title: 'Starter',
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
    id: 'professional',
    iconKey: 'users',
    badge: 'Most Popular',
    badgeTone: 'popular',
    title: 'Professional',
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
    primaryCta: { label: 'Upgrade to Professional', href: '#' },
    secondaryCta: { label: 'Start Free Trial', href: '#' },
    primaryCtaStyle: 'primary',
    highlighted: true,
  },
  {
    id: 'investor-pro',
    iconKey: 'chart',
    badge: 'Predictive Analytics',
    title: 'Investor Pro',
    description: 'Predictive market intelligence and investment-focused analytics powered by AI.',
    price: '$129',
    priceSuffix: '/month',
    features: [
      '100 AI-generated reports/month',
      'ROI & cash flow forecasting',
      'Investment opportunity scoring',
      'Suburb growth prediction insights',
      'Risk & market trend analysis',
      'All features in Professional Plan',
    ],
    primaryCta: { label: 'Upgrade to Investor Pro', href: '#' },
    secondaryCta: { label: 'Start Free Trial', href: '#' },
    primaryCtaStyle: 'primary',
  },
  {
    id: 'team-workspace',
    iconKey: 'building',
    badge: 'Agency Ready',
    title: 'Team Workspace',
    description: 'Collaborative AI valuation workflows designed for teams and agency operations.',
    price: '$299',
    priceSuffix: '/month',
    features: [
      'Unlimited appraisal reports/ month',
      'Unlimited shared team workspace',
      'Team collaboration & report reviews',
      'Internal comments & review',
      'Multi-user access controls',
      'Shared report management system',
      'All features in Investor Pro plan',
    ],
    primaryCta: { label: 'Upgrade to Team Workspace', href: '#' },
    secondaryCta: { label: 'Start Free Trial', href: '#' },
    primaryCtaStyle: 'primary',
  },
  {
    id: 'enterprise',
    iconKey: 'shield',
    badge: 'Enterprise Ready',
    badgeTone: 'enterprise',
    title: 'Enterprise Intelligence',
    description:
      'Enterprise-scale AI property intelligence with advanced monitoring, security, and infrastructure support.',
    price: 'Contact Us',
    features: [
      'Unlimited AI-generated reports',
      'Enterprise analytics dashboard',
      'AI model monitoring',
      'Dataset management system',
      'Audit logs & compliance tools',
    ],
    primaryCta: { label: 'Request Enterprise Demo', href: '#' },
    secondaryCta: { label: 'Contact Sales', href: '#' },
    primaryCtaStyle: 'gold',
    variant: 'dark',
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
export const CURRENT_PLAN_ID: PlanId = 'professional'
