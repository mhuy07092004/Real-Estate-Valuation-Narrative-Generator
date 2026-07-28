type StepStatus = 'completed' | 'active' | 'upcoming'

export type StepperItem = {
  id: string
  label: string
}

export type StepperProps = {
  steps: StepperItem[]
  /** 0-based index of the current step */
  activeStep: number
  className?: string
  onStepClick?: (index: number) => void
}

function getStepStatus(index: number, activeStep: number): StepStatus {
  if (index < activeStep) return 'completed'
  if (index === activeStep) return 'active'
  return 'upcoming'
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5.5 12.5L10 17L18.5 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StepIcon({
  number,
  status,
}: {
  number: number
  status: StepStatus
}) {
  const base =
    'flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold'

  if (status === 'active') {
    return (
      <span
        className={`${base} bg-gradient-to-br from-[#8FD4D8] to-relaive-secondary-hover text-white shadow-md shadow-relaive-secondary/30`}
      >
        {number}
      </span>
    )
  }

  if (status === 'completed') {
    return (
      <span className={`${base} bg-emerald-500 text-white`}>
        <CheckIcon />
      </span>
    )
  }

  return (
    <span className={`${base} bg-[#EEF2F6] text-[#A0AEC0]`}>{number}</span>
  )
}

export function Stepper({
  steps,
  activeStep,
  className = '',
  onStepClick,
}: StepperProps) {
  return (
    <nav
      aria-label="Progress"
      className={`overflow-x-auto rounded-3xl bg-white px-4 py-6 sm:px-8 sm:py-7 ${className}`}
    >
      <ol className="flex min-w-max items-start sm:min-w-0">
        {steps.map((step, index) => {
          const status = getStepStatus(index, activeStep)
          const isLast = index === steps.length - 1
          const labelClass =
            status === 'upcoming'
              ? 'text-relaive-gray'
              : 'text-relaive-secondary'

          const content = (
            <>
              <StepIcon number={index + 1} status={status} />
              <span
                className={`mt-2.5 max-w-[7.5rem] text-center text-xs font-medium leading-snug sm:text-sm ${labelClass}`}
              >
                {step.label}
              </span>
            </>
          )

          return (
            <li
              key={step.id}
              className={`flex items-start ${isLast ? 'shrink-0' : 'min-w-0 flex-1'}`}
              aria-current={status === 'active' ? 'step' : undefined}
            >
              <div className="flex shrink-0 flex-col items-center">
                {onStepClick ? (
                  <button
                    type="button"
                    onClick={() => onStepClick(index)}
                    className="flex flex-col items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-secondary"
                  >
                    {content}
                  </button>
                ) : (
                  content
                )}
              </div>

              {!isLast && (
                <div
                  className="mx-2 mt-5 h-px min-w-4 flex-1 bg-[#E2E8F0] sm:mx-3"
                  aria-hidden
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
