import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAsyncData } from '../../../../../hooks/use-async-data'
import { useAuth } from '../../../../../features/auth/hooks/use-auth'
import { Button } from '../../../../../components/ui/button/button'
import { SendReportCard } from '../../../../../components/ui/send-report-card/send-report-card'
import {
  getAgentRecommendations,
  getAppraisalDisclaimer,
  getAppraisalInputContext,
  getAppraisalSummary,
  getComparableSales,
  getNarrativePreview,
  getPropertySpecificFactors,
  persistGeneratedReport,
} from '../../../../../services/common'
import { REPORT_TYPE_CONFIG, ReportTypeStep } from './report-type-step'
import { VendorAppraisalReport } from './vendor-appraisal-report'
import { InvestmentAnalysisReport } from './investment-analysis-report'
import { FullValuationReport } from './full-valuation-report'
import { BuyerAdvisoryReport } from './buyer-advisory-report'
import { ProcessingOverlayV2 } from './processing-overlay'
import { resolveWizardRole } from './wizard-config'
import { calculateRoi } from '../roi-analysis/use-roi-calculator'
import { getRoiScenario } from '../roi-analysis/roi-scenario-store'
import { calculateAffordability } from '../affordability/use-affordability-calculator'
import { getAffordabilityInputs } from '../affordability/affordability-scenario-store'

// v2 orchestrator for the wizard's final step — figma splits this into two steps ("Report
// Type" then "Generated Report"); kept as one macro wizard step (same URL/stepper contract
// as v1) with an internal phase switch. Role-parameterized (§10.1): picks the report-type
// config, narrative reportType, and report-document component per role instead of being
// Agent-only. See figma-ui-migration-plan.md §9 / §10.2.

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 11a8 8 0 10-2.34 5.66M20 11V5m0 6h-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

type ReportConfigurationPanelProps = {
  onBack: () => void
  onGenerateAnother: () => void
  initialSubmitted?: boolean
}

function parseEstimatedValue(value: string | undefined): number {
  const digits = (value ?? '').replace(/[^\d]/g, '')
  const parsed = Number(digits)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 850000
}

export function ReportConfigurationPanel({ onBack, onGenerateAnother, initialSubmitted = false }: ReportConfigurationPanelProps) {
  const navigate = useNavigate()
  const { role } = useParams<{ role?: string }>()
  const wizardRole = resolveWizardRole(role)
  const isAgent = wizardRole === 'agent'
  const isValuer = wizardRole === 'valuer'
  const isInvestor = wizardRole === 'investor'
  const isBuyer = wizardRole === 'buyer'
  const templateId = REPORT_TYPE_CONFIG[wizardRole].templateId

  const { user } = useAuth()
  const [phase, setPhase] = useState<'type' | 'generating' | 'report'>(initialSubmitted ? 'report' : 'type')
  const [sendOpen, setSendOpen] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const context = getAppraisalInputContext()
  const { data: summary } = useAsyncData(getAppraisalSummary, [])
  const { data: narrative } = useAsyncData(() => getNarrativePreview(templateId), [templateId])
  const { data: disclaimer } = useAsyncData(getAppraisalDisclaimer, [])
  const { data: comparables } = useAsyncData(getComparableSales, [])

  // Agent-only report content.
  const { data: factors } = useAsyncData(getPropertySpecificFactors, [])
  const { data: recommendations } = useAsyncData(getAgentRecommendations, [])

  // Investor-only: the user's own real ROI scenario from the wizard's ROI Analysis step
  // (not async — pure client-side computation, see roi-analysis/use-roi-calculator.ts).
  const roiScenario = isInvestor ? getRoiScenario() : null
  const roiResult = roiScenario ? calculateRoi(roiScenario) : null

  // Buyer-only: the user's own real affordability inputs from the wizard's Affordability
  // step (not async — pure client-side computation).
  const affordabilityInputs = isBuyer ? getAffordabilityInputs() : null
  const affordabilityResult = affordabilityInputs ? calculateAffordability(affordabilityInputs) : null

  function buildNarrativeText(): string {
    return (narrative?.sections ?? []).map((section) => `${section.heading} ${section.body}`).join('\n\n')
  }

  async function saveReport(options: { clientName?: string; clientEmail?: string; markAsExported?: boolean }) {
    await persistGeneratedReport({
      reportTemplateId: templateId,
      narrativeText: buildNarrativeText(),
      estimatedValue: parseEstimatedValue(summary?.midpointEstimate),
      clientName: options.clientName,
      clientEmail: options.clientEmail,
      markAsExported: options.markAsExported,
    })
  }

  async function handleExportPdf() {
    setError(null)
    try {
      await saveReport({ markAsExported: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not export report. Please try again.')
    }
  }

  async function handleSaveDraft() {
    setError(null)
    try {
      await saveReport({})
      setDraftSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save report. Please try again.')
    }
  }

  function handleSendSuccess() {
    setSendOpen(false)
    navigate(role ? `/dashboard/${role}` : '/dashboard')
  }

  const isReportDataReady = Boolean(
    context &&
      summary &&
      narrative &&
      disclaimer &&
      comparables &&
      (!isAgent || (factors && recommendations)) &&
      (!isInvestor || (roiScenario && roiResult)) &&
      (!isBuyer || (affordabilityInputs && affordabilityResult)),
  )

  if (phase === 'type') {
    return <ReportTypeStep role={wizardRole} onBack={onBack} onGenerate={() => setPhase('generating')} isGenerating={false} />
  }

  if (phase === 'generating') {
    return <ProcessingOverlayV2 role={wizardRole} dataReady={isReportDataReady} onDone={() => setPhase('report')} />
  }

  if (!isReportDataReady || !context || !summary || !narrative || !disclaimer || !comparables) {
    return (
      <div className="rounded-2xl border border-black/5 bg-white px-5 py-8 text-sm text-relaive-gray">
        Preparing your report…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="md" onClick={onBack}>
          ← Back
        </Button>
        <Button type="button" variant="outline" size="md" onClick={onGenerateAnother}>
          <RefreshIcon /> <span className="ml-2">Generate another report</span>
        </Button>
        <div className="flex-grow" />
        <Button
          type="button"
          variant={sendOpen ? 'primary' : 'outline'}
          size="md"
          onClick={() => setSendOpen((open) => !open)}
        >
          Share via email
        </Button>
        <Button
          type="button"
          variant={draftSaved ? 'outline' : 'primary'}
          size="md"
          onClick={handleSaveDraft}
          disabled={draftSaved}
          className={draftSaved ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50' : undefined}
        >
          {draftSaved ? (
            <>
              <CheckIcon /> <span className="ml-2">Saved</span>
            </>
          ) : (
            'Save Report'
          )}
        </Button>
      </div>

      {sendOpen ? (
        <SendReportCard
          onClose={() => setSendOpen(false)}
          onSend={(payload) => saveReport({ clientName: payload.clientName, clientEmail: payload.clientEmail })}
          onSuccess={handleSendSuccess}
        />
      ) : null}

      {isAgent && factors && recommendations ? (
        <VendorAppraisalReport
          context={context}
          summary={summary}
          narrative={narrative}
          factors={factors}
          recommendations={recommendations}
          disclaimer={disclaimer}
          comparables={comparables}
          agentName={user?.fullName ?? 'Agent'}
        />
      ) : isInvestor && roiResult && roiScenario ? (
        <InvestmentAnalysisReport
          context={context}
          summary={summary}
          narrative={narrative}
          disclaimer={disclaimer}
          comparables={comparables}
          roi={roiResult}
          scenario={roiScenario}
          agentName={user?.fullName ?? 'Investment Analyst'}
        />
      ) : isValuer ? (
        <FullValuationReport
          context={context}
          summary={summary}
          narrative={narrative}
          disclaimer={disclaimer}
          comparables={comparables}
          valuerName={user?.fullName ?? 'Valuer'}
        />
      ) : isBuyer && affordabilityResult && affordabilityInputs ? (
        <BuyerAdvisoryReport
          context={context}
          summary={summary}
          narrative={narrative}
          disclaimer={disclaimer}
          comparables={comparables}
          affordability={affordabilityResult}
          combinedIncome={affordabilityInputs.annualIncome + affordabilityInputs.partnerIncome}
          deposit={affordabilityInputs.deposit}
          interestRate={affordabilityInputs.interestRate}
          loanTerm={affordabilityInputs.loanTerm}
          agentName={user?.fullName ?? 'Buyer Advisor'}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="md" onClick={handleExportPdf}>
          Export PDF
        </Button>
      </div>
    </div>
  )
}
