import { useState, type ReactNode } from 'react'
import {
  SubscriptionCard,
  type SubscriptionCardProps,
} from '../../ui/card/subscription-card'
import { PLAN_TIERS, type PlanIconKey } from '../../../services/plans'

type BillingPeriod = 'monthly' | 'annually'

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

const ICON_BY_KEY: Record<PlanIconKey, ReactNode> = {
  lightning: <LightningIcon />,
  users: <UsersIcon />,
  chart: <ChartIcon />,
}

const PLANS: SubscriptionCardProps[] = PLAN_TIERS.map(({ iconKey, ...tier }) => ({
  ...tier,
  icon: ICON_BY_KEY[iconKey],
}))

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
        className="relative inline-flex rounded-full border border-black/5 bg-white/80 p-1 shadow-sm"
        role="group"
        aria-label="Billing period"
      >
        <div
          className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-relaive-secondary/25 transition-transform duration-300 ease-out"
          style={{
            transform: period === 'monthly' ? 'translateX(0)' : 'translateX(100%)',
          }}
        />
        {(['monthly', 'annually'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`relative z-10 rounded-full px-6 py-2 text-sm font-medium capitalize transition-colors duration-300 ${
              period === option
                ? 'text-relaive-navy'
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

export function PlanPrice() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')

  return (
    <div id="plan-pricing" className="scroll-mt-20">
      <section className="mx-auto max-w-4xl px-6 pt-16 pb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-relaive-navy sm:text-4xl lg:text-5xl">
          Flexible Plans for Modern Property Intelligence
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-relaive-gray">
          Choose a plan tailored to your workflow, valuation needs, investment goals, or
          enterprise operations.
        </p>
        <a
          href="#plan-comparison"
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
          {PLANS.map((plan) => (
            <SubscriptionCard key={plan.title} {...plan} billingPeriod={billingPeriod} />
          ))}
        </div>
      </section>
    </div>
  )
}
