import { getReportTemplateIcon } from '../../../../../features/dashboard/components/generate-report/generate-report-icons'
import { StepActions } from '../../../../../features/dashboard/components/generate-report/step-actions'

// v2 reskin matching figma's StepReportType — role-locked to a single report type (no
// picker) instead of v1's 4-option OptionCardGroup. Agent-only for now: always
// "Vendor Appraisal". See figma-ui-migration-plan.md §9 (Generate Appraisal wizard).

export const AGENT_REPORT_TEMPLATE_ID = 'vendor-appraisal'
const AGENT_REPORT_TITLE = 'Vendor Appraisal'
const AGENT_REPORT_DESCRIPTION =
  'A comprehensive market appraisal for property owners preparing to sell. Includes estimated value range, comparable sales evidence, and campaign strategy.'

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

type ReportTypeStepProps = {
  onBack: () => void
  onGenerate: () => void
  isGenerating: boolean
}

export function ReportTypeStep({ onBack, onGenerate, isGenerating }: ReportTypeStepProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-[0_4px_24px_rgba(26,32,44,0.06)] sm:p-7">
      <h2 className="text-xl font-semibold text-relaive-navy sm:text-2xl">Report Type</h2>
      <p className="mt-1 text-sm text-relaive-gray">Select the type of report to generate</p>

      <div className="mt-6 flex items-center gap-5 rounded-2xl border-2 border-relaive-primary bg-white p-6 shadow-lg shadow-relaive-primary/10">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-relaive-primary to-relaive-secondary text-white shadow-md">
          {getReportTemplateIcon('vendor')}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold text-relaive-navy">{AGENT_REPORT_TITLE}</p>
            <span className="rounded-full bg-relaive-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-relaive-primary">
              Selected
            </span>
          </div>
          <p className="text-sm text-relaive-gray">{AGENT_REPORT_DESCRIPTION}</p>
        </div>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-relaive-primary">
          <CheckIcon />
        </span>
      </div>

      <StepActions
        onBack={onBack}
        onContinue={onGenerate}
        continueLabel={isGenerating ? 'Generating…' : 'Generate Report'}
        continueDisabled={isGenerating}
      />
    </div>
  )
}
