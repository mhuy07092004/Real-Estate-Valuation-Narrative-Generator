import { useState, type ReactNode } from 'react'
import { Button } from '../../ui/button/button'

const PLAN_NAMES = ['Starter', 'Professional', 'Investor Pro', 'Team Workspace'] as const

type CellValue =
  | { type: 'text'; value: ReactNode }
  | { type: 'check' }
  | { type: 'dash' }

type ComparisonRow = {
  feature: string
  values: CellValue[]
}

type PlanCta = {
  label: string
  href: string
  icon?: 'lightning' | 'lock'
}

function LightningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13 2L4 14H11L10 22L20 10H13L13 2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M8 11V8C8 5.79086 9.79086 4 12 4C14.2091 4 16 5.79086 16 8V11"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className="mx-auto shrink-0 text-relaive-secondary"
    >
      <circle cx="9" cy="9" r="8" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.5 9L7.5 11L12.5 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
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

function ComparisonCell({ cell }: { cell: CellValue }) {
  if (cell.type === 'check') {
    return <CheckIcon />
  }

  if (cell.type === 'dash') {
    return <span className="text-relaive-gray">—</span>
  }

  return <span className="text-sm text-relaive-navy">{cell.value}</span>
}

const getComparisonRows = (billingPeriod: 'monthly' | 'annually'): ComparisonRow[] => [
  {
    feature: 'Price',
    values: [
      { type: 'text', value: 'Free' },
      { type: 'text', value: billingPeriod === 'annually' ? (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs text-relaive-gray line-through">$79/month</span>
            <div className="flex items-center gap-1">
              <span>$63.2/month</span>
              <span className="rounded bg-green-100 px-1 py-0.5 text-[10px] font-semibold text-green-700 whitespace-nowrap">Save 20%</span>
            </div>
          </div>
        ) : '$79/month' },
      { type: 'text', value: billingPeriod === 'annually' ? (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs text-relaive-gray line-through">$129/month</span>
            <div className="flex items-center gap-1">
              <span>$103.2/month</span>
              <span className="rounded bg-green-100 px-1 py-0.5 text-[10px] font-semibold text-green-700 whitespace-nowrap">Save 20%</span>
            </div>
          </div>
        ) : '$129/month' },
      { type: 'text', value: billingPeriod === 'annually' ? (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs text-relaive-gray line-through">$299/month</span>
            <div className="flex items-center gap-1">
              <span>$239.2/month</span>
              <span className="rounded bg-green-100 px-1 py-0.5 text-[10px] font-semibold text-green-700 whitespace-nowrap">Save 20%</span>
            </div>
          </div>
        ) : '$299/month' },
    ],
  },
  {
    feature: 'AI Report Generation',
    values: [
      { type: 'text', value: '5 reports/ month' },
      { type: 'text', value: '50 reports/ month' },
      { type: 'text', value: '100 reports/ month' },
      { type: 'text', value: 'Unlimited reports/ month' },
    ],
  },
  {
    feature: 'Property Valuation Summary',
    values: [{ type: 'check' }, { type: 'check' }, { type: 'check' }, { type: 'check' }],
  },
  {
    feature: 'Comparable Sales Analysis',
    values: [
      { type: 'text', value: 'Basic' },
      { type: 'text', value: 'Advanced' },
      { type: 'text', value: 'Advanced' },
      { type: 'text', value: 'Advanced' },
    ],
  },
  {
    feature: 'Editable Report Builder',
    values: [
      { type: 'dash' },
      { type: 'text', value: 'Basic' },
      { type: 'text', value: 'Advanced' },
      { type: 'text', value: 'Advanced' },
    ],
  },
  {
    feature: 'Customize report templates',
    values: [{ type: 'dash' }, { type: 'check' }, { type: 'check' }, { type: 'check' }],
  },
  {
    feature: 'Export PDF / Word report',
    values: [
      { type: 'text', value: 'Limited' },
      { type: 'text', value: 'Unlimited' },
      { type: 'text', value: 'Unlimited' },
      { type: 'text', value: 'Unlimited' },
    ],
  },
  {
    feature: 'Investment Analytics',
    values: [{ type: 'dash' }, { type: 'dash' }, { type: 'check' }, { type: 'check' }],
  },
  {
    feature: 'ROI & Cash Flow Forecasting',
    values: [{ type: 'dash' }, { type: 'dash' }, { type: 'check' }, { type: 'check' }],
  },
  {
    feature: 'Team collaboration',
    values: [{ type: 'dash' }, { type: 'dash' }, { type: 'dash' }, { type: 'check' }],
  },
  {
    feature: 'Shared Workspace',
    values: [{ type: 'dash' }, { type: 'dash' }, { type: 'dash' }, { type: 'check' }],
  },
  {
    feature: 'Best for',
    values: [
      { type: 'text', value: 'Beginners' },
      { type: 'text', value: 'Valuers, agents & consultants' },
      { type: 'text', value: 'Property investors & analysts' },
      { type: 'text', value: 'Agencies & collaborative teams' },
    ],
  },
]

const PLAN_CTAS: PlanCta[] = [
  { label: 'Start Free', href: '#' },
  { label: 'Upgrade to Pro', href: '#', },
  { label: 'Start Investor Pro', href: '#' },
  { label: 'Start Team Workspace', href: '#',},
]

const VALUE_PROPS = [
  { icon: <LightningIcon />, text: 'Save hours on appraisal writing' },
  { icon: <SparkleIcon />, text: 'Generate reports in under 30 seconds' },
  { icon: <BarChartIcon />, text: 'AI-assisted market analysis' },
  { icon: <ShieldIcon />, text: 'Explainable valuation confidence' },
]

export function PlanComparison() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly')

  return (
    <section
      id="plan-comparison"
      className="scroll-mt-20 border-t border-black/5 bg-white px-6 py-16"
      aria-label="Feature comparison table"
    >
      <div className="mx-auto max-w-7xl">

        <div className="mt-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-relaive-navy sm:text-4xl">
            Feature Comparison Table
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-relaive-gray">
            Choose a plan tailored to your workflow, valuation needs, investment goals, or
            enterprise operations.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <div
            className="relative inline-flex rounded-full border border-black/5 bg-white/80 p-1 shadow-sm"
            role="group"
            aria-label="Billing period"
          >
            <div
              className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-relaive-secondary/25 transition-transform duration-300 ease-out"
              style={{
                transform: billingPeriod === 'monthly' ? 'translateX(0)' : 'translateX(100%)',
              }}
            />
            {(['monthly', 'annually'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setBillingPeriod(option)}
                className={`relative z-10 rounded-full px-6 py-2 text-sm font-medium capitalize transition-colors duration-300 ${
                  billingPeriod === option
                    ? 'text-relaive-navy'
                    : 'text-relaive-gray hover:text-relaive-navy'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-black/5">
                <th className="py-4 pr-4 text-left text-sm font-medium text-relaive-gray" />
                {PLAN_NAMES.map((name) => (
                  <th
                    key={name}
                    className="px-4 py-4 text-center text-sm font-semibold text-relaive-navy"
                  >
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {getComparisonRows(billingPeriod).map((row) => (
                <tr key={row.feature} className="border-b border-black/5">
                  <td className="py-4 pr-4 text-left text-sm font-medium text-relaive-navy">
                    {row.feature}
                  </td>
                  {row.values.map((cell, index) => (
                    <td key={`${row.feature}-${index}`} className="px-4 py-4 text-center">
                      <ComparisonCell cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="py-6 pr-4 text-left text-sm font-medium text-relaive-navy">
                  Upgrade now
                </td>
                {PLAN_CTAS.map((cta) => (
                  <td key={cta.label} className="px-4 py-6 text-center">
                    <Button variant="primary" href={cta.href} size="sm" className="whitespace-nowrap">
                      {cta.label}
                      {cta.icon === 'lightning' ? (
                        <span className="ml-1.5">
                          <LightningIcon />
                        </span>
                      ) : null}
                      {cta.icon === 'lock' ? (
                        <span className="ml-1.5">
                          <LockIcon />
                        </span>
                      ) : null}
                      {!cta.icon ? (
                        <span aria-hidden="true" className="ml-1">
                          →
                        </span>
                      ) : null}
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
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
      </div>
    </section>
  )
}
