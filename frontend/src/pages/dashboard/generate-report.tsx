import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Stepper } from '../../components/ui/Progress-Bar/Stepper'
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
import { ReportConfigurationPanel } from '../../features/dashboard/components/generate-report/report-configuration-panel'

const STEP_HEADERS = [
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
  {
    title: 'Report Type',
    subtitle: 'Select template and customize',
  },
  {
    title: 'Generated Report',
    subtitle: 'Your appraisal is ready',
  },
] as const

const LAST_STEP_INDEX = STEP_HEADERS.length - 1

export function GenerateReport() {
  const [searchParams] = useSearchParams()
  const openReadyView = searchParams.get('ready') === '1'
  const initialStep = useMemo(() => {
    if (openReadyView) return LAST_STEP_INDEX
    const raw = Number(searchParams.get('step') ?? '1')
    if (!Number.isFinite(raw)) return 0
    return Math.min(Math.max(raw - 1, 0), LAST_STEP_INDEX)
  }, [searchParams, openReadyView])
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
  const { data: steps } = useAsyncData(getAppraisalSteps, [])
  const header = STEP_HEADERS[currentStep] ?? STEP_HEADERS[0]

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

  const handleStepOneContinue = (context?: AppraisalInputContext) => {
    if (context) {
      setAppraisalInputContext(context)
    }
    setCurrentStep(1)
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
        <Stepper steps={steps ?? []} activeStep={currentStep} />

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
            onBack={() => setCurrentStep(0)}
            onContinue={() => setCurrentStep(2)}
          />
        ) : null}

        {currentStep === 2 ? (
          <MarketIntelligencePanel
            onBack={() => setCurrentStep(1)}
            onContinue={() => setCurrentStep(3)}
          />
        ) : null}

        {currentStep === 3 || currentStep === 4 ? (
          hasHydratedFromSavedReport ? (
            <ReportConfigurationPanel
              onBack={() => setCurrentStep(currentStep === 4 ? 3 : 2)}
              onContinue={() => setCurrentStep(4)}
              forceSubmitted={currentStep === 4}
              initialSelectedTemplateId={initialTemplateId}
            />
          ) : (
            <div className="rounded-2xl border border-black/5 bg-white px-5 py-8 text-sm text-relaive-gray">
              Loading saved report...
            </div>
          )
        ) : null}
      </div>
    </div>
  )
}
