import { getReportTemplateIcon } from '../../../../../features/dashboard/components/generate-report/generate-report-icons'
import { StepActions } from '../../../../../features/dashboard/components/generate-report/step-actions'
import type { WizardRole } from './wizard-config'

// v2 reskin matching figma's StepReportType — role-locked to a single report type (no
// picker), plus the "Report will include" checklist figma shows for every role (originally
// investor/buyer-only in an earlier prototype draft — see figma-ui-migration-plan.md §9.7/§10).
// Role-parameterized: one component for all four roles instead of near-duplicates per role.

export type ReportTypeConfig = {
  templateId: string
  title: string
  description: string
  iconKey: 'vendor' | 'bank' | 'buyer' | 'investment'
  checklist: string[]
}

export const REPORT_TYPE_CONFIG: Record<WizardRole, ReportTypeConfig> = {
  agent: {
    templateId: 'vendor-appraisal',
    title: 'Vendor Appraisal',
    description:
      'A comprehensive market appraisal for property owners preparing to sell. Includes estimated value range, comparable sales evidence, and campaign strategy.',
    iconKey: 'vendor',
    checklist: [
      'Estimated Value Range',
      'Comparable Sales Evidence',
      'Market Analysis',
      'Campaign Strategy',
      'Property Description',
      'Vendor Recommendation',
    ],
  },
  valuer: {
    templateId: 'bank-valuation',
    title: 'Full Valuation Report',
    description:
      'A comprehensive formal valuation report prepared using the Direct Comparison Method. Includes certified assessed value, evidence summary, market context, and valuer certification.',
    iconKey: 'bank',
    checklist: [
      'Assessed Market Value',
      'Direct Comparison Method',
      'Comparable Evidence Summary',
      'Market Context',
      'Risk Assessment',
      'Valuer Certification',
    ],
  },
  investor: {
    templateId: 'investment-report',
    title: 'Investment Analysis Report',
    description:
      'Comprehensive investment assessment including ROI modelling, comparable sales evidence, market context, and risk analysis.',
    iconKey: 'investment',
    checklist: [
      'Investment Returns Summary',
      'ROI & Cash Flow Analysis',
      'Comparable Sales Evidence',
      'Suburb Market Context',
      'Risk Assessment',
      'Conclusion & Recommendation',
    ],
  },
  buyer: {
    templateId: 'buyer-advisory',
    title: 'Buyer Advisory',
    description:
      "An independent buyer's advisory report assessing fair value, comparable evidence, and key purchase considerations to help you buy with confidence.",
    iconKey: 'buyer',
    checklist: [
      'Fair Value Assessment',
      'Comparable Sales Evidence',
      'Price Range Analysis',
      'Market Context',
      'Key Purchase Considerations',
      'Buyer Recommendation',
    ],
  },
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SmallCheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

type ReportTypeStepProps = {
  role: WizardRole
  onBack: () => void
  onGenerate: () => void
  isGenerating: boolean
}

export function ReportTypeStep({ role, onBack, onGenerate, isGenerating }: ReportTypeStepProps) {
  const config = REPORT_TYPE_CONFIG[role]

  return (
    <div className="rounded-3xl bg-white p-6 shadow-[0_4px_24px_rgba(26,32,44,0.06)] sm:p-7">
      <h2 className="text-xl font-semibold text-relaive-navy sm:text-2xl">Report Type</h2>
      <p className="mt-1 text-sm text-relaive-gray">Select the type of report to generate</p>

      <div className="mt-6 flex items-center gap-5 rounded-2xl border-2 border-relaive-primary bg-white p-6 shadow-lg shadow-relaive-primary/10">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-relaive-primary to-relaive-secondary text-white shadow-md">
          {getReportTemplateIcon(config.iconKey)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold text-relaive-navy">{config.title}</p>
            <span className="rounded-full bg-relaive-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-relaive-primary">
              Selected
            </span>
          </div>
          <p className="text-sm text-relaive-gray">{config.description}</p>
        </div>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-relaive-primary">
          <CheckIcon />
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-black/[0.03] p-4">
        <h3 className="mb-2 text-xs font-semibold text-relaive-navy">Report will include</h3>
        <div className="grid grid-cols-2 gap-2">
          {config.checklist.map((item) => (
            <div key={item} className="flex items-center gap-2 text-xs text-relaive-gray">
              <span className="shrink-0 text-relaive-secondary">
                <SmallCheckIcon />
              </span>
              {item}
            </div>
          ))}
        </div>
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
