import type { ReactNode } from 'react'
import { FeatureCard } from '../card/card'
import { InteractiveCard } from '../card/interactive-card'
import { NavDropdownPanel } from './nav-dropdown-panel'

function AgentIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20V10L8 7V20M8 20H16M8 20V10L12 7V20M16 20H20V12L16 9V20Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 13.5H6.51M10.5 13.5H10.51M14.5 13.5H14.51"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ValuerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.5 19.5C5.5 16.4 8.3 14.5 12 14.5C15.7 14.5 18.5 16.4 18.5 19.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function InvestorIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 16L9 11L13 15L20 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 6H20V11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BuyerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 11L12 4L20 11V20H4V11Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10 20V14H14V20" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function LightningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13 2L4 14H11L10 22L20 10H13L13 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BarChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 20V10M12 20V4M18 20V14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 3H16L19 6V21H5V3H8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8 3V6H19M9 12H15M9 16H13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

type Workflow = {
  icon: ReactNode
  title: string
  description: string
  features: string[]
}

const WORKFLOWS: Workflow[] = [
  {
    icon: <AgentIcon />,
    title: 'For Real Estate Agents',
    description:
      'Generate professional vendor appraisal reports with AI-powered market intelligence tailored for client-ready delivery.',
    features: [
      'Generate vendor appraisal reports',
      'Compare local comparable sales',
      'AI-generated property narratives',
      'Track and manage client progress',
    ],
  },
  {
    icon: <ValuerIcon />,
    title: 'For Property Valuers',
    description:
      'Manage valuation cases, collect and review property evidence, explore market insights, and organise valuation information.',
    features: [
      'Manage valuation cases',
      'Create new valuations',
      'Review and save property evidence',
      'Explore market insights',
    ],
  },
  {
    icon: <InvestorIcon />,
    title: 'For Investors',
    description:
      'Explore investment opportunities, compare properties and market data, analyse potential returns, and generate investment reports.',
    features: [
      'Generate investment reports',
      "Overview of different suburbs' comparison",
      'Explore suburbs and market insights',
      'Calculate potential ROI',
    ],
  },
  {
    icon: <BuyerIcon />,
    title: 'For Buyers',
    description:
      'Compare properties, evaluate affordability and receive market context with buyer advisory reports.',
    features: [
      'Buyer advisory reports',
      'Property comparison tools',
      'Market context & insights',
      'Property inspection insights',
    ],
  },
]

const STATS: { icon: ReactNode; label: string }[] = [
  { icon: <LightningIcon />, label: 'Reports generated in under 30 seconds' },
  { icon: <BarChartIcon />, label: 'AI-powered market analysis' },
  { icon: <DocumentIcon />, label: 'Professional, export-ready reports' },
]

export function PlatformDropdown({ open }: { open: boolean }) {
  return (
    <NavDropdownPanel open={open}>
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-2xl font-semibold text-relaive-navy sm:text-3xl">
              Tailored AI Workflows
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-relaive-gray sm:text-base">
              Choose your workflow and start generating intelligent property valuations tailored to
              your role.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {WORKFLOWS.map((workflow) => (
              <InteractiveCard key={workflow.title}>
                <FeatureCard {...workflow} />
              </InteractiveCard>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center gap-4 border-t border-black/5 pt-6 sm:flex-row sm:gap-10">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2 text-sm font-medium text-relaive-navy/80"
              >
                <span className="text-relaive-primary">{stat.icon}</span>
                {stat.label}
              </div>
            ))}
          </div>
        </div>
    </NavDropdownPanel>
  )
}
