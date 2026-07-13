import { useState } from 'react'
import { Navbar } from '../components/ui/navbar/navbar'
import { Footer } from '../components/ui/footer/footer'
import {
  SubscriptionCard,
  type SubscriptionCardProps,
} from '../components/ui/card/subscription-card'

type BillingPeriod = 'monthly' | 'yearly'

function LightningIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13 2L4 14H11L10 22L20 10H13L13 2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M3.5 19.5C3.5 16.5 5.8 14.5 9 14.5C12.2 14.5 14.5 16.5 14.5 19.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M14.5 19.5C14.5 17.2 16 15.5 18.5 15.5C19.5 15.5 20.4 15.8 21 16.3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 16L9 11L13 15L20 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 6H20V11"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 21V5C4 4.44772 4.44772 4 5 4H14C14.5523 4 15 4.44772 15 5V21"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path d="M8 8H11M8 12H11M8 16H11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path
        d="M15 10H19C19.5523 10 20 10.4477 20 11V21"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path d="M18 14H18.01M18 18H18.01" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3L20 7V12C20 16.5 16.8 19.7 12 21C7.2 19.7 4 16.5 4 12V7L12 3Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M9 12L11 14L15 10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M19 3L19.75 5.25L22 6L19.75 6.75L19 9L18.25 6.75L16 6L18.25 5.25L19 3Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BarChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 20V10M12 20V4M18 20V14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

const PLANS: SubscriptionCardProps[] = [
  {
    icon: <LightningIcon />,
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
    primaryCtaStyle: 'soft',
  },
  {
    icon: <UsersIcon />,
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
    secondaryCta: { label: 'Generate Client Reports', href: '#' },
    primaryCtaStyle: 'primary',
    highlighted: true,
  },
  {
    icon: <ChartIcon />,
    badge: 'Predictive Analytics',
    title: 'Investor Pro',
    description:
      'Predictive market intelligence and investment-focused analytics powered by AI.',
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
    primaryCta: { label: 'Explore Investment Intelligence', href: '#' },
    secondaryCta: { label: 'Analyse Market Opportunities', href: '#' },
    primaryCtaStyle: 'soft',
  },
  {
    icon: <BuildingIcon />,
    badge: 'Agency Ready',
    title: 'Team Workspace',
    description:
      'Collaborative AI valuation workflows designed for teams and agency operations.',
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
    primaryCta: { label: 'Start Team Workspace', href: '#' },
    secondaryCta: { label: 'Invite Your Team', href: '#' },
    primaryCtaStyle: 'soft',
  },
  {
    icon: <ShieldIcon />,
    badge: 'Enterprise Ready',
    badgeTone: 'enterprise',
    title: 'Enterprise Intelligence',
    description:
      'Enterprise-scale AI property intelligence with advanced monitoring, security, and infrastructure support.',
    price: 'Custom',
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

const VALUE_PROPS = [
  { icon: <LightningIcon />, text: 'Save hours on appraisal writing' },
  { icon: <SparkleIcon />, text: 'Generate reports in under 30 seconds' },
  { icon: <BarChartIcon />, text: 'AI-assisted market analysis' },
  { icon: <ShieldIcon />, text: 'Explainable valuation confidence' },
] as const

function BillingToggle({
  period,
  onChange,
}: {
  period: BillingPeriod
  onChange: (period: BillingPeriod) => void
}) {
  return (
    <div className="flex justify-center">
      <div
        className="inline-flex rounded-full border border-black/5 bg-white/80 p-1 shadow-sm"
        role="group"
        aria-label="Billing period"
      >
        {(['monthly', 'yearly'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full px-6 py-2 text-sm font-medium capitalize transition-colors ${
              period === option
                ? 'bg-relaive-secondary/25 text-relaive-navy'
                : 'text-relaive-gray hover:text-relaive-navy'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function PlansPage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')
  const topRowPlans = PLANS.slice(0, 3)
  const bottomRowPlans = PLANS.slice(3)

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-relaive-cream to-relaive-surface">
      <Navbar />

      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-6 pt-16 pb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-relaive-navy sm:text-4xl lg:text-5xl">
            Flexible Plans for Modern Property Intelligence
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-relaive-gray">
            Choose a plan tailored to your workflow, valuation needs, investment goals, or
            enterprise operations.
          </p>
          <a
            href="#"
            className="mt-4 inline-flex items-center text-sm font-medium text-relaive-primary transition-colors hover:text-relaive-primary-hover"
          >
            View Feature Comparison Table for plans
            <span aria-hidden="true" className="ml-1">
              →
            </span>
          </a>

          <div className="mt-8">
            <BillingToggle period={billingPeriod} onChange={setBillingPeriod} />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-16" aria-label={`${billingPeriod} plans`}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {topRowPlans.map((plan) => (
              <SubscriptionCard key={plan.title} {...plan} />
            ))}
          </div>

          <div className="mx-auto mt-6 grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
            {bottomRowPlans.map((plan) => (
              <SubscriptionCard key={plan.title} {...plan} />
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-relaive-secondary/20 bg-relaive-primary/10 px-6 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {VALUE_PROPS.map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-relaive-primary/15 text-relaive-primary">
                    {icon}
                  </span>
                  <p className="text-sm font-medium text-relaive-navy">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
