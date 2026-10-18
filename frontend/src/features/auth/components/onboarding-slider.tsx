import { useState, type ReactNode } from 'react'
import { Button } from '../../../components/ui/button/button'
import { RoleSelection } from './role-selection'

// Same icons/copy as the landing page's FeaturesSection (features-section.tsx)
// — the 3 most broadly relevant across all 4 roles, reused here instead of
// writing new marketing copy.
function BrainIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function LightningIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13 2L4 14H11L10 22L20 10H13L13 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21C12 21 19 14.5 19 9.5C19 5.9 15.9 3 12 3C8.1 3 5 5.9 5 9.5C5 14.5 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

type FeatureSlide = {
  icon: ReactNode
  title: string
  description: string
}

const FEATURE_SLIDES: FeatureSlide[] = [
  {
    icon: <BrainIcon />,
    title: 'AI Valuation Engine',
    description:
      'Machine learning and AI-written narratives built on real sold-listing data to produce clear, professional appraisal summaries.',
  },
  {
    icon: <LightningIcon />,
    title: 'Guided Report Wizard',
    description: 'Step-by-step report creation with AI-written summaries, ready to share.',
  },
  {
    icon: <MapPinIcon />,
    title: 'Comparable Sales Intelligence',
    description: 'Comparable sales ranked by similarity to your subject property, with nearby amenities.',
  },
]

// Feature slides, then one final "choose your role" slide — RoleSelection
// keeps its own submit/Confirm button, so the slider's Next/Back controls
// only drive the feature slides and hand off once the user reaches it.
const ROLE_STEP = FEATURE_SLIDES.length
const TOTAL_STEPS = FEATURE_SLIDES.length + 1

export function OnboardingSlider() {
  const [step, setStep] = useState(0)
  const isRoleStep = step === ROLE_STEP

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${step * 100}%)` }}
        >
          {FEATURE_SLIDES.map((slide) => (
            <div key={slide.title} className="w-full shrink-0 px-2 text-center">
              <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-relaive-primary/10 text-relaive-primary">
                {slide.icon}
              </div>
              <h2 className="text-2xl font-bold text-relaive-navy">{slide.title}</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-relaive-gray">{slide.description}</p>
            </div>
          ))}
          <div className="w-full shrink-0 px-2">
            <RoleSelection />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2" aria-hidden="true">
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <span
            key={index}
            className={`size-2 rounded-full transition-colors ${
              index === step ? 'bg-relaive-primary' : 'bg-black/15'
            }`}
          />
        ))}
      </div>

      {!isRoleStep ? (
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0}
            className={step === 0 ? 'invisible' : undefined}
          >
            Back
          </Button>
          <button
            type="button"
            onClick={() => setStep(ROLE_STEP)}
            className="text-sm text-relaive-gray underline-offset-2 hover:underline"
          >
            Skip
          </button>
          <Button type="button" onClick={() => setStep((current) => current + 1)}>
            Next
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setStep((current) => current - 1)}
          className="self-center text-sm text-relaive-gray underline-offset-2 hover:underline"
        >
          Back
        </button>
      )}
    </div>
  )
}
