import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Stepper } from '../../../components/ui/Progress-Bar/Stepper'
import { useAsyncData } from '../../../hooks/use-async-data'
import { getPersistedReport, setAppraisalInputContext, type AppraisalInputContext } from '../../../services/common'
import { PropertyInputPanel } from '../../features/dashboard/components/generate-report/property-input-panel'
import { ComparablesPanelV2 } from '../../features/dashboard/components/generate-report/comparables-panel'
import { MarketIntelligencePanelV2 } from '../../features/dashboard/components/generate-report/market-intelligence-panel'
import { RoiAnalysisPanelV2 } from '../../features/dashboard/components/generate-report/roi-analysis-panel'
import { AffordabilityPanelV2 } from '../../features/dashboard/components/generate-report/affordability-panel'
import { ReportConfigurationPanel } from '../../features/dashboard/components/generate-report/report-configuration-panel'
import { resolveWizardRole, WIZARD_STEPS } from '../../features/dashboard/components/generate-report/wizard-config'

// v2 wizard shell — role-parameterized (§10.1): step count/labels/panels vary per role
// instead of the wizard being Agent-only. Step 1 (Property Details), Comparables, and
// Market Intelligence are shared across every role; Investor inserts a ROI Analysis step;
// Valuer/Buyer roles are configured in wizard-config.ts but their extra step
// (Evidence Centre / Affordability) isn't built yet — falls back to a placeholder rather
// than crashing if reached. See figma-ui-migration-plan.md §9 / §10.

export function GenerateReportV2() {
  const { role: roleParam } = useParams<{ role?: string }>()
  const wizardRole = resolveWizardRole(roleParam)
  const steps = WIZARD_STEPS[wizardRole]
  const lastStepIndex = steps.length - 1

  const [searchParams] = useSearchParams()
  const initialStep = useMemo(() => {
    const raw = Number(searchParams.get('step') ?? '1')
    if (!Number.isFinite(raw)) return 0
    return Math.min(Math.max(raw - 1, 0), lastStepIndex)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  const openReadyView = searchParams.get('ready') === '1'
  const selectedReportId = searchParams.get('reportId')
  const { data: selectedReport } = useAsyncData(
    () => (selectedReportId ? getPersistedReport(selectedReportId) : Promise.resolve(null)),
    [selectedReportId],
  )
  const [hasHydratedFromSavedReport, setHasHydratedFromSavedReport] = useState(selectedReportId == null)

  const [currentStep, setCurrentStep] = useState(initialStep)

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

  const handleStepOneContinue = (context?: AppraisalInputContext) => {
    if (context) {
      setAppraisalInputContext(context)
    }
    setCurrentStep(1)
  }

  const handleGenerateAnother = () => {
    setCurrentStep(0)
  }

  const stepId = steps[currentStep]?.id

  function renderStep() {
    if (stepId === 'property-input') {
      return <PropertyInputPanel role={wizardRole} onContinue={handleStepOneContinue} />
    }

    if (stepId === 'comparables' || stepId === 'evidence-centre') {
      return (
        <ComparablesPanelV2
          role={wizardRole}
          onBack={() => setCurrentStep(currentStep - 1)}
          onContinue={() => setCurrentStep(currentStep + 1)}
        />
      )
    }

    if (stepId === 'market-intelligence') {
      return <MarketIntelligencePanelV2 onBack={() => setCurrentStep(currentStep - 1)} onContinue={() => setCurrentStep(currentStep + 1)} />
    }

    if (stepId === 'roi-analysis') {
      return <RoiAnalysisPanelV2 onBack={() => setCurrentStep(currentStep - 1)} onContinue={() => setCurrentStep(currentStep + 1)} />
    }

    if (stepId === 'affordability') {
      return <AffordabilityPanelV2 onBack={() => setCurrentStep(currentStep - 1)} onContinue={() => setCurrentStep(currentStep + 1)} />
    }

    if (stepId === 'report') {
      return hasHydratedFromSavedReport ? (
        <ReportConfigurationPanel
          onBack={() => setCurrentStep(currentStep - 1)}
          onGenerateAnother={handleGenerateAnother}
          initialSubmitted={openReadyView}
        />
      ) : (
        <div className="rounded-2xl border border-black/5 bg-white px-5 py-8 text-sm text-relaive-gray">
          Loading saved report...
        </div>
      )
    }

    // Evidence Centre (Valuer) / Affordability (Buyer) — configured in wizard-config.ts,
    // not built yet. Placeholder rather than a crash if this role's wizard is reached.
    return (
      <div className="rounded-2xl border border-black/5 bg-white px-5 py-8 text-sm text-relaive-gray">
        This step ({steps[currentStep]?.label}) is coming soon.
      </div>
    )
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
        <Stepper steps={steps} activeStep={currentStep} />

        {renderStep()}
      </div>
    </div>
  )
}
