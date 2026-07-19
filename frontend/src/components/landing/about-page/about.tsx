import type { ReactNode } from 'react'
import { FeatureCard } from '../../ui/card/card'
import { Footer } from '../../ui/footer/footer'
import { Navbar } from '../../ui/navbar/navbar'

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
      'We envision a future where property intelligence is instant, explainable, and accessible — empowering smarter decisions across the real estate industry.',
    features: [
      'Generate evidence-based appraisal narratives',
      'Analyze comparable property sales',
      'Understand suburb and market trends',
      'Evaluate investment opportunities',
    ],
  },
]

export function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#f5f7fa] via-white to-relaive-surface">
      <Navbar />

      <main className="relative flex-1 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-16 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(123,178,196,0.22)_0%,transparent_70%)] blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 bottom-10 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(251,242,232,0.7)_0%,transparent_70%)] blur-2xl"
        />

        <section id="about-page" className="relative scroll-mt-20 px-6 pt-10 pb-24">
          <div className="mx-auto flex max-w-6xl flex-col gap-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-relaive-primary/20 bg-relaive-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-relaive-primary">
                <StarIcon />
                About Relaive
              </span>

              <h1 className="max-w-4xl text-2xl font-bold leading-tight text-relaive-navy sm:text-3xl lg:whitespace-nowrap lg:text-4xl">
                AI-Powered Property Intelligence for Faster, Smarter Valuations
              </h1>

              <p className="mx-auto max-w-2xl text-sm leading-relaxed text-relaive-gray sm:text-base">
                Relaive is an AI-powered property intelligence platform designed to help real estate
                agents, valuers, and investors generate faster, smarter, and more transparent property
                valuations.
              </p>
            </div>

            <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:gap-6">
              {ABOUT_CARDS.map((card) => (
                <FeatureCard key={card.title} {...card} className="h-full" />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
