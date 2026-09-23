import { type ReactNode } from 'react'
import { FeatureCard } from '../ui/card/card'
import { InteractiveCard } from '../ui/card/interactive-card'
import { SectionShell } from './section-shell'

function BrainIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4C10.5 4 9.2 4.8 8.5 6C7.2 5.6 5.8 6.2 5.2 7.5C4.4 7.3 3.5 7.8 3.2 8.7C2.7 10.1 3.4 11.6 4.7 12.2C4.3 13.5 5 14.9 6.3 15.4C6.5 16.8 7.8 17.8 9.2 17.5C9.8 18.5 11 19 12.2 18.8C13.5 19.5 15.1 19.1 15.9 17.8C17.3 17.8 18.4 16.6 18.3 15.2C19.3 14.3 19.5 12.7 18.7 11.5C19.1 10.2 18.4 8.7 17.1 8.2C16.9 6.5 15.3 5.3 13.6 5.6C12.9 4.7 11.5 4 10 4H12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 10H9.01M15 10H15.01M10 14C10.5 14.5 11.5 15 12 15C12.5 15 13.5 14.5 14 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function BarChartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 20V10M12 20V4M18 20V14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
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

function MapPinIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21C12 21 19 14.5 19 9.5C19 5.9 15.9 3 12 3C8.1 3 5 5.9 5 9.5C5 14.5 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function LightningIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13 2L4 14H11L10 22L20 10H13L13 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type Feature = {
  icon: ReactNode
  title: string
  description: string
  features: string[]
  tags?: string[]
  className?: string
}

const FEATURES: Feature[] = [
  {
    icon: <BrainIcon />,
    title: 'AI Valuation Engine',
    description:
      'Machine learning and AI-written narratives built on real NSW sold-listing data to produce clear, professional appraisal summaries.',
    features: [
      'AI-generated valuation narratives',
      'AI price prediction',
      'Dynamic comparable sales analysis',
      'Automated valuation summaries',
    ],
    tags: ['Vendor Appraisals', 'Bank Valuations', 'Buyer Advisory'],
    className: 'md:col-span-2 md:row-span-2',
  },
  {
    icon: <BarChartIcon />,
    title: 'Market Insights',
    description: 'Suburb analytics, price trends, and rental yield data.',
    features: ['Suburb analytics', 'Median price & growth trends', 'Rental yield & days on market'],
  },
  {
    icon: <TrendIcon />,
    title: 'Investment & Affordability Tools',
    description: 'ROI and market comparison for investors, and an affordability calculator for buyers.',
    features: ['ROI calculation', 'Market comparison', 'Affordability calculator'],
  },
  {
    icon: <MapPinIcon />,
    title: 'Comparable Sales Intelligence',
    description: 'Comparable sales ranked by similarity to your subject property.',
    features: ['Nearby comparable sales', 'Similarity ranking', 'Address lookup & nearby amenities'],
  },
  {
    icon: <DocumentIcon />,
    title: 'Professional Reports',
    description: 'AI-generated appraisal reports you can share with clients by link or email.',
    features: ['AI-generated appraisal summaries', 'Shareable report link', 'Email reports to clients'],
  },
  {
    icon: <LightningIcon />,
    title: 'Guided Report Wizard',
    description: 'Step-by-step report creation with AI-written summaries, ready to share.',
    features: ['Step-by-step wizard', 'AI-written summaries', 'Role-specific report templates'],
  },
]

export function FeaturesSection() {
  return (
    <SectionShell
      id="features"
      eyebrow=""
      title="Premium Intelligence Suite"
      description="Everything you need for explainable, AI-powered property valuation and market intelligence."
      containerClassName="max-w-6xl"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5 lg:gap-6">
        {FEATURES.map((feature) => (
          <InteractiveCard key={feature.title} className={feature.className}>
            <FeatureCard {...feature} className="" />
          </InteractiveCard>
        ))}
      </div>
    </SectionShell>
  )
}
