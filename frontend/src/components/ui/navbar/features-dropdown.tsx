import { useEffect, useState, type ReactNode } from 'react'
import { NavDropdownPanel } from './nav-dropdown-panel'

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

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true" className="shrink-0">
      <circle cx="9" cy="9" r="8" fill="white" stroke="currentColor" strokeWidth="1.5" />
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

type FeatureItem = {
  id: string
  icon: ReactNode
  title: string
  summary: string
  features: string[]
}

type FeatureCategory = {
  id: string
  label: string
  tabIcon: ReactNode
  items: FeatureItem[]
}

const CATEGORIES: FeatureCategory[] = [
  {
    id: 'ai-valuation',
    label: 'AI Valuation',
    tabIcon: <BrainIcon size={16} />,
    items: [
      {
        id: 'ai-appraisal',
        icon: <BrainIcon />,
        title: 'AI Property Appraisal',
        summary:
          'Generate professional property appraisal narratives in seconds using AI-powered valuation intelligence.',
        features: [
          'Automated appraisal generation',
          'Intelligent price prediction',
          'Comparable sales integration',
          'Professional narrative writing',
          'Suburb-aware valuation',
          'Rapid report generation',
        ],
      },
      {
        id: 'confidence-scoring',
        icon: <SparklesIcon />,
        title: 'Explainable AI Reasoning',
        summary:
          'Understand exactly why the valuation was generated and which factors influenced the final estimate.',
        features: [
          'AI reasoning breakdown',
          'Evidence transparency',
          'Property data analysis',
          'Comparable sales explanation',
          'Market factor analysis',
          'Valuation factor summary',
        ],
      },
      {
        id: 'instant-report',
        icon: <ClockIcon />,
        title: 'AI Narrative Timeline',
        summary:
          'See how the valuation report is built step by step using property data, market insights, and comparable sales.',
        features: [
          'Live AI workflow visualisation',
          'Market analysis stages',
          'Narrative assembly tracking',
          'Valuation generation timeline',
          'Comparable retrieval progress',
          'Email report delivery',
        ],
      },
    ],
  },
  {
    id: 'property-intelligence',
    label: 'Property Intelligence',
    tabIcon: <FoldedMapIcon />,
    items: [
      {
        id: 'comparable-sales',
        icon: <MapPinIcon />,
        title: 'Comparable Sales Intelligence',
        summary: 'AI-powered similarity scoring and property clustering with map overlays.',
        features: [
          'Nearby sales ranked by similarity',
          'Attribute-based property clustering',
          'Interactive map overlays',
          'Evidence package builder',
        ],
      },
      {
        id: 'property-profiles',
        icon: <DocumentIcon />,
        title: 'Property Profile Enrichment',
        summary: 'Pull together beds, baths, land, zoning, and amenity context in one view.',
        features: [
          'Beds, baths and land attributes',
          'Zoning and planning context',
          'Listing attribute enrichment',
          'Less portal hopping',
        ],
      },
      {
        id: 'suburb-analytics',
        icon: <BarChartIcon />,
        title: 'Suburb Analytics',
        summary: 'Demographic, demand, and yield signals at the suburb level.',
        features: [
          'Median price trends',
          'Days on market signals',
          'Rental yield snapshots',
          'Demographic shift tracking',
          'Local demand indicators',
          'Appraisal market framing',
        ],
      },
      {
        id: 'evidence-centre',
        icon: <LayersIcon />,
        title: 'Evidence Centre',
        summary: 'Organise valuation evidence in a structured, reusable workspace.',
        features: [
          'Pinned comparable sales',
          'Consistent evidence trails',
          'Report version tracking',
          'Reusable evidence packages',
        ],
      },
    ],
  },
  {
    id: 'market-investment',
    label: 'Market & Investment',
    tabIcon: <ChartIcon />,
    items: [
      {
        id: 'market-comparable-sales',
        icon: <MapPinIcon />,
        title: 'Comparable Sales',
        summary:
          'Understand property values through similar recently sold properties.',
        features: [
          'Comparable sales analysis',
          'Similar property comparison',
          'Sales evidence',
          'Save property easily',
        ],
      },
      {
        id: 'suburb-exploration',
        icon: <FoldedMapIcon size={20} />,
        title: 'Suburb Exploration',
        summary:
          'Compare different suburbs and understand how they perform relative to each other.',
        features: [
          'Compare up to 4 suburbs side by side',
          'Suburb performance comparison',
          'Market comparison',
          'Report ready to export',
        ],
      },
      {
        id: 'investment-analysis',
        icon: <ChartIcon size={20} />,
        title: 'Investment Analysis',
        summary: 'Evaluate potential investment returns for selected properties.',
        features: [
          'ROI calculator',
          'Affordability calculator',
          'Investment return analysis',
          'Comparable sales analysis',
        ],
      },
    ],
  },
  {
    id: 'workflow-collaboration',
    label: 'Workflow',
    tabIcon: <UsersIcon />,
    items: [
      {
        id: 'shared-evidence',
        icon: <ShareIcon />,
        title: 'Shared Evidence Trails',
        summary: 'Keep comparables and rationale attached to every shared report.',
        features: [
          'Comparables travel with share',
          'Confidence notes attached',
          'Reviewer context preserved',
          'Linked supporting sales',
          'Rationale on every report',
          'No lost evidence trail',
        ],
      },
      {
        id: 'workflow-automation',
        icon: <ClockIcon />,
        title: 'Workflow Shortcuts',
        summary: 'Reuse templates and automations to cut repetitive appraisal steps.',
        features: [
          'Saved report structures',
          'Auto-fill common fields',
          'One-click generation',
          'Dashboard workflow shortcuts',
          'Reusable automations',
          'Fewer repetitive steps',
        ],
      },
    ],
  },
]

function FeatureBlock({ item }: { item: FeatureItem }) {
  return (
    <article className="flex flex-col gap-3 py-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8F4F8] text-relaive-primary">
          {item.icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-relaive-navy sm:text-lg">{item.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-relaive-gray">{item.summary}</p>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 sm:pl-[3.75rem]">
        {item.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-sm leading-snug text-relaive-gray"
          >
            <span className="mt-0.5 text-relaive-secondary">
              <CheckIcon />
            </span>
            {feature}
          </li>
        ))}
      </ul>
    </article>
  )
}

export function FeaturesDropdown({ open }: { open: boolean }) {
  const [activeCategoryId, setActiveCategoryId] = useState(CATEGORIES[0].id)

  useEffect(() => {
    if (!open) {
      setActiveCategoryId(CATEGORIES[0].id)
    }
  }, [open])

  return (
    <NavDropdownPanel open={open}>
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
        <div
          role="tablist"
          aria-label="Feature categories"
          className="mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-1 rounded-full bg-slate-100/90 p-1.5"
        >
          {CATEGORIES.map((category) => {
            const active = category.id === activeCategoryId
            return (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveCategoryId(category.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary focus-visible:ring-offset-2 sm:px-5 ${
                  active
                    ? 'bg-white text-relaive-navy shadow-sm'
                    : 'text-relaive-gray hover:text-relaive-navy'
                }`}
              >
                <span className={active ? 'text-relaive-primary' : 'text-relaive-gray'}>
                  {category.tabIcon}
                </span>
                {category.label}
              </button>
            )
          })}
        </div>

        <div className="grid [&>*]:col-start-1 [&>*]:row-start-1" role="tabpanel">
          {CATEGORIES.map((category) => {
            const active = category.id === activeCategoryId
            return (
              <div
                key={category.id}
                className={`flex flex-col divide-y divide-black/5 ${
                  active ? 'z-10' : 'invisible pointer-events-none'
                }`}
                aria-hidden={!active}
              >
                {category.items.map((item) => (
                  <FeatureBlock key={item.id} item={item} />
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </NavDropdownPanel>
  )
}
