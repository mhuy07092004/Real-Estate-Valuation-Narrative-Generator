import { useState, type ReactNode } from 'react'
import { Footer } from '../../ui/footer/footer'
import { Navbar } from '../../ui/navbar/navbar'

function BrainIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function FoldedMapIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14.5 5.5L21 3V19L14.5 21.5L7.5 19L3 21V5L9.5 2.5L14.5 5.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.5 2.5V19" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M14.5 5.5V21.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function ChartIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function UsersIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function SparklesIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3L13.5 9.5L20 11L13.5 12.5L12 19L10.5 12.5L4 11L10.5 9.5L12 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
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

function TargetIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
}

function ClockIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 7V12L15 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MapPinIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21C12 21 19 14.5 19 9.5C19 5.9 15.9 3 12 3C8.1 3 5 5.9 5 9.5C5 14.5 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function DocumentIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function BarChartIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 20V10M12 20V4M18 20V14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function LayersIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L2 7L12 12L22 7L12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M2 12L12 17L22 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M2 17L12 22L22 17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ShareIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8.6 13.5L15.4 17.5M15.4 6.5L8.6 10.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function ChevronRightIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 text-relaive-accent transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
    >
      <path
        d="M9 6L15 12L9 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BadgeSparkleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z" />
    </svg>
  )
}

type FeatureItem = {
  id: string
  icon: ReactNode
  title: string
  summary: string
  details: string
}

type FeatureCategory = {
  id: string
  label: string
  tabIcon: ReactNode
  badge: string
  title: string
  description: string
  items: FeatureItem[]
}

const CATEGORIES: FeatureCategory[] = [
  {
    id: 'ai-valuation',
    label: 'AI Valuation',
    tabIcon: <BrainIcon size={16} />,
    badge: 'AI Valuation',
    title: 'AI-Powered Property Intelligence',
    description:
      'Generate explainable, evidence-based property appraisal narratives using advanced AI and market intelligence.',
    items: [
      {
        id: 'ai-appraisal',
        icon: <BrainIcon />,
        title: 'AI Property Appraisal',
        summary:
          'Generate professional property appraisal narratives in seconds using AI-powered valuation intelligence.',
        details:
          'Our AI analyses millions of Australian property transactions to produce clear, professional appraisal narratives in seconds. Outputs include market interpretation, comparable context, and investor-ready language you can edit before export.',
      },
      {
        id: 'confidence-scoring',
        icon: <SparklesIcon />,
        title: 'Explainable AI Reasoning',
        summary:
          'Understand exactly why the valuation was generated and which factors influenced the final estimate.',
        details:
          'Every valuation includes transparent reasoning. See which data points, comparables, and market signals contributed most so you can trust — and explain — the result.',
      },
      {
        id: 'evidence-narrative',
        icon: <TargetIcon />,
        title: 'Confidence Radar',
        summary: 'View valuation confidence, evidence strength, and risk signals in real time.',
        details:
          'Narratives are grounded in comparable sales, suburb trends, and property attributes. Each claim links back to evidence so reports stay audit-ready and easy to defend with clients or lenders.',
      },
      {
        id: 'instant-report',
        icon: <ClockIcon />,
        title: 'AI Narrative Timeline',
        summary:
          'See how the valuation report is built step by step using property data, market insights, and comparable sales.',
        details:
          'From address input to a polished draft report in under 30 seconds. Export to PDF or DOCX, apply templates, and hand off to clients without rebuilding the same narrative from scratch.',
      },
    ],
  },
  {
    id: 'property-intelligence',
    label: 'Property Intelligence',
    tabIcon: <FoldedMapIcon />,
    badge: 'Property Intelligence',
    title: 'Deep Property & Suburb Insights',
    description:
      'Explore comparable sales, property attributes, and suburb intelligence to support confident appraisal decisions.',
    items: [
      {
        id: 'comparable-sales',
        icon: <MapPinIcon />,
        title: 'Comparable Sales Intelligence',
        summary: 'AI-powered similarity scoring and property clustering with map overlays.',
        details:
          'Surface nearby sales ranked by similarity, not just distance. Cluster properties by attributes and visualise them on the map to build stronger evidence packages.',
      },
      {
        id: 'property-profiles',
        icon: <DocumentIcon />,
        title: 'Property Profile Enrichment',
        summary: 'Pull together beds, baths, land, zoning, and amenity context in one view.',
        details:
          'Dummy detail: enriched property cards combine listing attributes, historical sales, and neighbourhood amenity scores so you spend less time hunting across portals.',
      },
      {
        id: 'suburb-analytics',
        icon: <BarChartIcon />,
        title: 'Suburb Analytics',
        summary: 'Demographic, demand, and yield signals at the suburb level.',
        details:
          'Dummy detail: review median prices, days on market, rental yields, and demographic shifts to frame every appraisal with the right local market story.',
      },
      {
        id: 'evidence-centre',
        icon: <LayersIcon />,
        title: 'Evidence Centre',
        summary: 'Organise valuation evidence in a structured, reusable workspace.',
        details:
          'Dummy detail: pin comparables, notes, and attachments to a case so your evidence trail stays consistent across team members and report versions.',
      },
    ],
  },
  {
    id: 'market-investment',
    label: 'Market & Investment',
    tabIcon: <ChartIcon />,
    badge: 'Market & Investment',
    title: 'Market Trends & Investment Signals',
    description:
      'Track suburb growth, yield opportunities, and forecast indicators tailored for investors and advisors.',
    items: [
      {
        id: 'trend-forecasting',
        icon: <ChartIcon size={20} />,
        title: 'Trend Forecasting',
        summary: 'Predictive analytics for suburb growth and investment opportunity.',
        details:
          'Dummy detail: forecast models highlight suburbs with momentum so investors can prioritise deals before the market fully prices them in.',
      },
      {
        id: 'yield-insights',
        icon: <BarChartIcon />,
        title: 'Yield & Cashflow Insights',
        summary: 'Estimate rental yield and cashflow scenarios for target properties.',
        details:
          'Dummy detail: model rent bands, vacancy assumptions, and holding costs to compare investment options side by side.',
      },
      {
        id: 'demand-indicators',
        icon: <TargetIcon />,
        title: 'Demand Indicators',
        summary: 'Monitor buyer and renter demand signals across key markets.',
        details:
          'Dummy detail: track enquiry volume, listing competition, and absorption rates to time acquisitions and pricing advice.',
      },
      {
        id: 'portfolio-view',
        icon: <LayersIcon />,
        title: 'Portfolio Snapshot',
        summary: 'Summarise exposure and performance across saved investment assets.',
        details:
          'Dummy detail: a lightweight portfolio view groups saved properties by suburb, yield, and risk so advisors can brief clients quickly.',
      },
    ],
  },
  {
    id: 'workflow-collaboration',
    label: 'Workflow & Collaboration',
    tabIcon: <UsersIcon />,
    badge: 'Workflow & Collaboration',
    title: 'Smarter Team Workflows',
    description:
      'Collaborate on appraisals, share client-ready reports, and keep valuation workflows moving without friction.',
    items: [
      {
        id: 'team-workspace',
        icon: <UsersIcon size={20} />,
        title: 'Team Workspace',
        summary: 'Share cases, notes, and drafts across agents, valuers, and advisors.',
        details:
          'Dummy detail: assign ownership, leave comments on draft narratives, and keep everyone aligned on the latest evidence package.',
      },
      {
        id: 'client-reports',
        icon: <DocumentIcon />,
        title: 'Client-Ready Reports',
        summary: 'Export polished appraisal packages your clients can actually use.',
        details:
          'Dummy detail: apply brand templates, lock approved sections, and deliver PDFs that look professional without extra design work.',
      },
      {
        id: 'shared-evidence',
        icon: <ShareIcon />,
        title: 'Shared Evidence Trails',
        summary: 'Keep comparables and rationale attached to every shared report.',
        details:
          'Dummy detail: when you share a valuation, the supporting sales and confidence notes travel with it so reviewers never lose context.',
      },
      {
        id: 'workflow-automation',
        icon: <ClockIcon />,
        title: 'Workflow Shortcuts',
        summary: 'Reuse templates and automations to cut repetitive appraisal steps.',
        details:
          'Dummy detail: save preferred report structures, auto-fill common fields, and kick off generation with a single click from the dashboard.',
      },
    ],
  },
]

function FeatureAccordionItem({
  item,
  open,
  onToggle,
}: {
  item: FeatureItem
  open: boolean
  onToggle: () => void
}) {
  const contentId = `${item.id}-content`

  return (
    <article
      className={`rounded-2xl border border-slate-100/80 bg-white shadow-[0_4px_18px_rgba(26,32,44,0.06)] transition-shadow duration-200 ${
        open ? 'shadow-[0_8px_28px_rgba(26,32,44,0.1)]' : 'hover:shadow-[0_6px_22px_rgba(26,32,44,0.08)]'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-start gap-4 rounded-2xl p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary focus-visible:ring-offset-2 sm:items-center sm:p-6"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F4F8] text-relaive-primary">
          {item.icon}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-relaive-navy sm:text-lg">{item.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-relaive-gray">{item.summary}</p>
        </div>

        <span className="mt-1 sm:mt-0">
          <ChevronRightIcon open={open} />
        </span>
      </button>

      <div
        id={contentId}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`border-t border-slate-100 px-5 pb-5 pt-0 transition-opacity duration-200 sm:px-6 sm:pb-6 ${
              open ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <p className="pl-[3.75rem] text-sm leading-relaxed text-relaive-gray sm:pl-16">
              {item.details}
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}

export function FeaturesPage() {
  const [activeCategoryId, setActiveCategoryId] = useState(CATEGORIES[0].id)
  const [openItemId, setOpenItemId] = useState<string | null>(null)

  const activeCategory =
    CATEGORIES.find((category) => category.id === activeCategoryId) ?? CATEGORIES[0]

  function handleCategoryChange(categoryId: string) {
    setActiveCategoryId(categoryId)
    setOpenItemId(null)
  }

  function handleToggle(itemId: string) {
    setOpenItemId((current) => (current === itemId ? null : itemId))
  }

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

        <section id="features-page" className="relative scroll-mt-20 px-6 pt-10 pb-24 lg:px-10">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 sm:gap-10">
            <div
              role="tablist"
              aria-label="Feature categories"
              className="flex flex-wrap items-center justify-start gap-2 sm:gap-3"
            >
              {CATEGORIES.map((category) => {
                const active = category.id === activeCategoryId
                return (
                  <button
                    key={category.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary focus-visible:ring-offset-2 sm:px-5 ${
                      active
                        ? 'bg-gradient-to-r from-relaive-secondary to-relaive-primary text-white shadow-md shadow-relaive-primary/25'
                        : 'border border-slate-200/80 bg-white text-relaive-navy shadow-sm hover:border-relaive-primary/30 hover:bg-slate-50'
                    }`}
                  >
                    <span className={active ? 'text-white' : 'text-relaive-primary'}>
                      {category.tabIcon}
                    </span>
                    {category.label}
                  </button>
                )
              })}
            </div>

            <div className="flex max-w-3xl flex-col items-start gap-2.5 text-left sm:gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-relaive-primary/20 bg-relaive-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-relaive-primary">
                <BadgeSparkleIcon />
                {activeCategory.badge}
              </span>

              <h1 className="text-[22px] font-semibold leading-tight text-relaive-navy sm:text-[28px] lg:text-[32px]">
                {activeCategory.title}
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-relaive-gray sm:text-[15px]">
                {activeCategory.description}
              </p>
            </div>

            <div className="flex flex-col gap-3.5 sm:gap-4" role="tabpanel">
              {activeCategory.items.map((item) => (
                <FeatureAccordionItem
                  key={item.id}
                  item={item}
                  open={openItemId === item.id}
                  onToggle={() => handleToggle(item.id)}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
