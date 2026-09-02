import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Stepper } from '../../components/ui/Progress-Bar/Stepper'
import { StepTransition } from '../../components/ui/step-transition/step-transition'
import { useAsyncData } from '../../hooks/use-async-data'
import {
  getAppraisalSteps,
  getPersistedReport,
  setAppraisalInputContext,
  type AppraisalInputContext,
} from '../../services/common'
import { PropertyInputPanel } from '../../features/dashboard/components/generate-report/property-input-panel'
import { ComparablesPanel } from '../../features/dashboard/components/generate-report/comparables-panel'
import { MarketIntelligencePanel } from '../../features/dashboard/components/generate-report/market-intelligence-panel'
import { RoiAnalysisPanel } from '../../features/dashboard/components/generate-report/roi-analysis-panel'
import { AffordabilityPanel } from '../../features/dashboard/components/generate-report/affordability-panel'
import { ReportConfigurationPanel } from '../../features/dashboard/components/generate-report/report-configuration-panel'
import { GeneratedReportContainer } from '../../features/dashboard/components/generate-report/generated-report-container'

type ExtraStep = 'roi' | 'affordability' | null

function getExtraStepForRole(role?: string): ExtraStep {
  if (role === 'investor') return 'roi'
  if (role === 'buyer') return 'affordability'
  return null
}

const BASE_STEP_HEADERS = [
  {
    title: 'Property Details',
    subtitle: 'Enter the subject property information',
  },
  {
    title: 'Comparable Sales',
    subtitle: 'Selected similar properties',
  },
  {
    title: 'Market Intelligence',
    subtitle: 'Suburb analytics and trends',
  },
] as const

const TAIL_STEP_HEADERS = [
  {
    title: 'Report Type',
    subtitle: 'Select template and customize',
  },
  {
    title: 'Generated Report',
    subtitle: 'Your appraisal is ready',
  },
] as const

const EXTRA_STEP_HEADERS: Record<'roi' | 'affordability', { title: string; subtitle: string }> = {
  roi: {
    title: 'ROI Analysis',
    subtitle: 'Estimate rental return and cash flow',
  },
  affordability: {
    title: 'Affordability',
    subtitle: 'Model your borrowing capacity',
  },
}

export function GenerateReport() {
  const { role } = useParams<{ role?: string }>()
  const extraStep = getExtraStepForRole(role)

  const stepHeaders = useMemo(
    () =>
      extraStep
        ? [...BASE_STEP_HEADERS, EXTRA_STEP_HEADERS[extraStep], ...TAIL_STEP_HEADERS]
        : [...BASE_STEP_HEADERS, ...TAIL_STEP_HEADERS],
    [extraStep],
  )
  const lastStepIndex = stepHeaders.length - 1
  const reportTypeIndex = extraStep ? 4 : 3
  const generatedIndex = lastStepIndex

  const [searchParams] = useSearchParams()
  const openReadyView = searchParams.get('ready') === '1'
  const initialStep = useMemo(() => {
    if (openReadyView) return lastStepIndex
    const raw = Number(searchParams.get('step') ?? '1')
    if (!Number.isFinite(raw)) return 0
    return Math.min(Math.max(raw - 1, 0), lastStepIndex)
  }, [searchParams, openReadyView, lastStepIndex])
  const selectedReportId = searchParams.get('reportId')
  const { data: selectedReport } = useAsyncData(
    () =>
      selectedReportId
        ? getPersistedReport(selectedReportId)
        : Promise.resolve(null),
    [selectedReportId],
  )
  const [hasHydratedFromSavedReport, setHasHydratedFromSavedReport] = useState(
    selectedReportId == null,
  )

  const [currentStep, setCurrentStep] = useState(initialStep)
  const [direction, setDirection] = useState<1 | -1>(1)
  const currentStepRef = useRef(initialStep)

  const goToStep = (next: number) => {
    setDirection(next >= currentStepRef.current ? 1 : -1)
    currentStepRef.current = next
    setCurrentStep(next)
  }

  const { data: steps } = useAsyncData(() => getAppraisalSteps(role), [role])
  const header = stepHeaders[currentStep] ?? stepHeaders[0]

  useEffect(() => {
    if (!selectedReportId) {
      setHasHydratedFromSavedReport(true)
      return
    }

    if (!selectedReport) {
      setHasHydratedFromSavedReport(false)
      return
    }

    const context: AppraisalInputContext = {
      address: `${selectedReport.propertyAddressLine}, ${selectedReport.propertySuburb} ${selectedReport.propertyState} ${selectedReport.propertyPostcode}`,
      propertyType: selectedReport.propertyType,
      bedrooms: selectedReport.bedrooms,
      bathrooms: selectedReport.bathrooms,
      parking: selectedReport.parking,
      landSizeSqm: selectedReport.landSizeSqm,
    }

    setAppraisalInputContext(context)
    setHasHydratedFromSavedReport(true)
  }, [selectedReportId, selectedReport])

  const initialTemplateId = useMemo(() => {
    if (!selectedReport?.narrativeText) return undefined
    const match = selectedReport.narrativeText.match(/^\[([^\]]+)\]\s*/)
    return match?.[1]
  }, [selectedReport])

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (initialTemplateId) setSelectedTemplateId(initialTemplateId)
  }, [initialTemplateId])

  const handleStepOneContinue = (context?: AppraisalInputContext) => {
    if (context) {
      setAppraisalInputContext(context)
    }
    goToStep(1)
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
        <Stepper steps={steps ?? []} activeStep={currentStep} />

        <StepTransition
          stepKey={currentStep}
          direction={direction}
          className="flex flex-col gap-5 sm:gap-6"
        >
          <header className="font-sans">
            <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
              {header.title}
            </h1>
            <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">
              {header.subtitle}
            </p>
          </header>

          {currentStep === 0 ? (
            <PropertyInputPanel onContinue={handleStepOneContinue} />
          ) : null}

          {currentStep === 1 ? (
            <ComparablesPanel
              onBack={() => goToStep(0)}
              onContinue={() => goToStep(2)}
            />
          ) : null}

          {currentStep === 2 ? (
            <MarketIntelligencePanel
              onBack={() => goToStep(1)}
              onContinue={() => goToStep(3)}
            />
          ) : null}

          {extraStep && currentStep === 3 ? (
            extraStep === 'roi' ? (
              <RoiAnalysisPanel
                onBack={() => goToStep(2)}
                onContinue={() => goToStep(reportTypeIndex)}
              />
            ) : (
              <AffordabilityPanel
                onBack={() => goToStep(2)}
                onContinue={() => goToStep(reportTypeIndex)}
              />
            )
          ) : null}

          {currentStep === reportTypeIndex ? (
            hasHydratedFromSavedReport ? (
              <ReportConfigurationPanel
                onBack={() => goToStep(extraStep ? 3 : 2)}
                onContinue={(templateId) => {
                  setSelectedTemplateId(templateId)
                  goToStep(generatedIndex)
                }}
                initialSelectedTemplateId={selectedTemplateId}
              />
            ) : (
              <div className="rounded-2xl border border-black/5 bg-white px-5 py-8 text-sm text-relaive-gray">
                Loading saved report...
              </div>
            )
          ) : null}

          {currentStep === generatedIndex ? (
            hasHydratedFromSavedReport ? (
              <GeneratedReportContainer
                selectedTemplateId={selectedTemplateId}
                onBack={() => goToStep(reportTypeIndex)}
                onGenerateAnother={() => {
                  setSelectedTemplateId(undefined)
                  goToStep(0)
                }}
              />
            ) : (
              <div className="rounded-2xl border border-black/5 bg-white px-5 py-8 text-sm text-relaive-gray">
                Loading saved report...
              </div>
            )
          ) : null}
        </StepTransition>
      </div>
    </div>
  )
}
