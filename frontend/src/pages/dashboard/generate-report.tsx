import { useState } from 'react'
import { Stepper } from '../../components/ui/Progress-Bar/Stepper'
import { useAsyncData } from '../../hooks/use-async-data'
import { getAppraisalSteps } from '../../services/common'
import { PropertyInputPanel } from '../../features/dashboard/components/generate-report/property-input-panel'
import { ComparablesPanel } from '../../features/dashboard/components/generate-report/comparables-panel'
import { MarketIntelligencePanel } from '../../features/dashboard/components/generate-report/market-intelligence-panel'
import { ReportConfigurationPanel } from '../../features/dashboard/components/generate-report/report-configuration-panel'

export function GenerateReport() {
  const [currentStep, setCurrentStep] = useState(0)
  const { data: steps } = useAsyncData(getAppraisalSteps, [])

  return (
    <div className="flex flex-col">
      <header className="font-sans px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
          Generate Appraisal
        </h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">
          A.I Powered Property Intelligence Platform
        </p>
      </header>

      <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
        <Stepper steps={steps ?? []} activeStep={currentStep} />

        {currentStep === 0 ? (
          <PropertyInputPanel onContinue={() => setCurrentStep(1)} />
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

        {currentStep === 3 ? (
          <ReportConfigurationPanel onBack={() => setCurrentStep(2)} />
        ) : null}
      </div>
    </div>
  )
}
