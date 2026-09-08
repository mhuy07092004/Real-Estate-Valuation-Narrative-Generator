import type { ReactNode } from 'react'
import { FeatureCard } from '../card/card'
import { InteractiveCard } from '../card/interactive-card'
import { NavDropdownPanel } from './nav-dropdown-panel'

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z" />
    </svg>
  )
}

function TargetIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3L13.5 9.5L20 11L13.5 12.5L12 19L10.5 12.5L4 11L10.5 9.5L12 3Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M19 3L19.6 5.4L22 6L19.6 6.6L19 9L18.4 6.6L16 6L18.4 5.4L19 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3L5 6.5V11.5C5 16 8.2 19.8 12 21C15.8 19.8 19 16 19 11.5V6.5L12 3Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12L11.2 13.7L14.8 10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TrendIcon() {
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

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 8V12L15 14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.25" stroke="currentColor" strokeWidth="1.75" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.25" stroke="currentColor" strokeWidth="1.75" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.25" stroke="currentColor" strokeWidth="1.75" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.25" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

type AboutCard = {
  icon: ReactNode
  title: string
  description: string
  features: string[]
}

const ABOUT_CARDS: AboutCard[] = [
  {
    icon: <TargetIcon />,
    title: 'Our Mission',
    description:
      'To transform complex property data into clear, explainable intelligence that helps professionals make faster and more confident valuation decisions.',
    features: [
      'Simplify appraisal workflows',
      'Reduce time and manual effort',
      'Improve market understanding',
      'Increase transparency in AI valuation',
    ],
  },
  {
    icon: <SparkleIcon />,
    title: 'Why Relaive Exists',
    description:
      'Property professionals often spend hours gathering data and writing reports. Relaive was built to streamline this process using AI and market intelligence.',
    features: [
      'Streamline valuation workflows',
      'Combine market intelligence',
      'Support professionals with explainable AI',
      'Reduce risk of missing important market insights',
    ],
  },
  {
    icon: <ShieldIcon />,
    title: 'Explainable AI Philosophy',
    description:
      'Every valuation should be transparent. Relaive focuses on clear reasoning, evidence-based insights, and human-reviewed outputs.',
    features: [
      'Explainable reasoning',
      'Evidence-based valuation',
      'Confidence indicators',
      'Comparables sales transparency',
    ],
  },
  {
    icon: <TrendIcon />,
    title: 'Product Vision',
    description:
      'We envision a future where property intelligence is instant, explainable, and accessible - empowering smarter decisions across the real estate industry.',
    features: [
      'Generate evidence-based appraisal narratives',
      'Analyze comparable property sales',
      'Understand suburb and market trends',
      'Evaluate investment opportunities',
    ],
  },
]

const STEPS = [
  { n: 1, title: 'Input property', description: 'Enter property information' },
  { n: 2, title: 'AI Analysis', description: 'Retrieve comparable sales & market data' },
  { n: 3, title: 'Generate report', description: 'Create explainable appraisal narrative' },
  { n: 4, title: 'Review Evidence', description: 'Check confidence and reasoning factors' },
  { n: 5, title: 'Customize', description: 'Edit and personalize report' },
  { n: 6, title: 'Export', description: 'Download professional output' },
]

const TRUST_ITEMS = [
  {
    title: 'Comparable sales data',
    subtitle: 'See exactly how AI reached conclusions',
  },
  {
    title: 'Property market trends',
    subtitle: 'Comparable sales and market data transparency',
  },
  {
    title: 'Historical transaction analysis',
    subtitle: 'AI-assisted, professional judgment supported',
  },
  {
    title: 'Suburb demographics & insights',
    subtitle: 'Clear visibility into valuation reliability',
  },
  {
    title: 'AI-powered narrative generation',
    subtitle: 'Complete workflow and reasoning logs',
  },
  {
    title: 'Predictive property analytics',
    subtitle: 'Transparent assumptions and limitations',
  },
]

const WORKFLOWS = [
  { title: 'Real Estate Agents', description: 'Client-ready appraisal reports' },
  { title: 'Property Valuers', description: 'Evidence-based valuation analysis' },
  { title: 'Investors', description: 'ROI forecasting and market intelligence' },
  { title: 'Buyers', description: 'Simplified property context' },
  { title: 'Teams & Agencies', description: 'Collaborative workflows' },
]

function SectionHeading({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-relaive-primary text-white">
        {icon}
      </span>
      <h3 className="text-lg font-semibold text-relaive-navy sm:text-xl">{children}</h3>
    </div>
  )
}

function StepCard({ n, title, description }: { n: number; title: string; description: string }) {
  return (
    <article className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white px-4 py-4 shadow-[0_4px_18px_rgba(26,32,44,0.05)]">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-relaive-primary text-xs font-semibold text-white">
        {n}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-relaive-navy">{title}</p>
        <p className="mt-0.5 text-sm leading-snug text-relaive-gray">{description}</p>
      </div>
    </article>
  )
}

function TrustItem({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-relaive-primary" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-relaive-navy">{title}</p>
        <p className="mt-0.5 text-sm leading-snug text-relaive-gray">{subtitle}</p>
      </div>
    </div>
  )
}

function MiniWorkflowCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-black/5 bg-white px-4 py-5 shadow-[0_4px_18px_rgba(26,32,44,0.05)]">
      <p className="text-sm font-semibold text-relaive-navy">{title}</p>
      <p className="mt-1 text-sm leading-snug text-relaive-gray">{description}</p>
    </article>
  )
}

export function AboutDropdown({ open }: { open: boolean }) {
  return (
    <NavDropdownPanel open={open}>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-relaive-primary/20 bg-relaive-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-relaive-primary">
            <StarIcon />
            About Relaive
          </span>
          <h2 className="text-[22px] font-semibold leading-tight text-relaive-navy sm:text-[29px] lg:text-[32px]">
            AI-Powered Property Intelligence for Faster, Smarter Valuations
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-relaive-gray sm:text-base">
            Relaive is an AI-powered property intelligence platform designed to help real estate
            agents, valuers, and investors generate faster, smarter, and more transparent property
            valuations.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:gap-6">
          {ABOUT_CARDS.map((card) => (
            <InteractiveCard key={card.title}>
              <FeatureCard {...card} className="h-full" />
            </InteractiveCard>
          ))}
        </div>

        <section className="flex flex-col gap-5 border-t border-black/5 pt-8">
          <SectionHeading icon={<ClockIcon />}>How Relaive Works</SectionHeading>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((step) => (
              <StepCard key={step.n} {...step} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-5 border-t border-black/5 pt-8">
          <SectionHeading icon={<RingsIcon />}>
            Trust Through Structure Real Estate Data Sources
          </SectionHeading>
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST_ITEMS.map((item) => (
              <TrustItem key={item.title} {...item} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-5 border-t border-black/5 pt-8">
          <SectionHeading icon={<GridIcon />}>Built for Modern Property Workflows</SectionHeading>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {WORKFLOWS.map((item) => (
              <MiniWorkflowCard key={item.title} {...item} />
            ))}
          </div>
        </section>
      </div>
    </NavDropdownPanel>
  )
}
