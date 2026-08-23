import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Stepper } from '../../../components/ui/Progress-Bar/Stepper'
import { useAsyncData } from '../../../hooks/use-async-data'
import {
  getAppraisalSteps,
  getPersistedReport,
  setAppraisalInputContext,
  type AppraisalInputContext,
} from '../../../services/common'
import { PropertyInputPanel } from '../../features/dashboard/components/generate-report/property-input-panel'
import { ComparablesPanelV2 } from '../../features/dashboard/components/generate-report/comparables-panel'
import { MarketIntelligencePanelV2 } from '../../features/dashboard/components/generate-report/market-intelligence-panel'
import { ReportConfigurationPanel } from '../../features/dashboard/components/generate-report/report-configuration-panel'

// v2 wizard: all 4 steps now match figma's actual pattern. Step 1 (Property Details) uses
// filled inputs/spinner counters/pill selector. Steps 2-3 use the shared cores (§4.5). Step 4
// (Report Type -> Generated Report) is a figma-style document (dark header banner, section
// dividers, comparable-sales table, valuation range bar, campaign cards, agent certification)
// instead of v1's lighter component-composed panel — see figma-ui-migration-plan.md §9.

export function GenerateReportV2() {
  const [searchParams] = useSearchParams()
  const initialStep = useMemo(() => {
    const raw = Number(searchParams.get('step') ?? '1')
    if (!Number.isFinite(raw)) return 0
    return Math.min(Math.max(raw - 1, 0), 3)
  }, [searchParams])
  const openReadyView = searchParams.get('ready') === '1'
  const selectedReportId = searchParams.get('reportId')
  const { data: selectedReport } = useAsyncData(
    () => (selectedReportId ? getPersistedReport(selectedReportId) : Promise.resolve(null)),
    [selectedReportId],
  )
  const [hasHydratedFromSavedReport, setHasHydratedFromSavedReport] = useState(selectedReportId == null)

  const [currentStep, setCurrentStep] = useState(initialStep)
  const { data: steps } = useAsyncData(getAppraisalSteps, [])

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

  const handleGenerateAnother = () => {
    setCurrentStep(0)
  }

  return (
    <div className="flex flex-col">
      <header className="font-sans px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
          Generate Appraisal
        </h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">A.I Powered Property Intelligence Platform</p>
      </header>

      <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
        <Stepper steps={steps ?? []} activeStep={currentStep} />

        {currentStep === 0 ? <PropertyInputPanel onContinue={handleStepOneContinue} /> : null}

        {currentStep === 1 ? (
          <ComparablesPanelV2 onBack={() => setCurrentStep(0)} onContinue={() => setCurrentStep(2)} />
        ) : null}

        {currentStep === 2 ? (
          <MarketIntelligencePanelV2 onBack={() => setCurrentStep(1)} onContinue={() => setCurrentStep(3)} />
        ) : null}

        {currentStep === 3 ? (
          hasHydratedFromSavedReport ? (
            <ReportConfigurationPanel
              onBack={() => setCurrentStep(2)}
              onGenerateAnother={handleGenerateAnother}
              initialSubmitted={openReadyView}
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
