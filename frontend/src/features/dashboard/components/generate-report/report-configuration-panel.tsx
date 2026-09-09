import { useParams } from 'react-router-dom'
import { Card, CardTitle } from '../../../../components/ui/card/card'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getNarrativePreview, getReportTemplate, type ReportRole } from '../../../../services/common'
import { CheckCircleIcon, ReportDocumentIcon } from './generate-report-icons'
import { StepActions } from './step-actions'

const REPORT_ROLES: ReportRole[] = ['agent', 'valuer', 'buyer', 'investor']

function toReportRole(role: string | undefined): ReportRole {
  return REPORT_ROLES.includes(role as ReportRole) ? (role as ReportRole) : 'agent'
}

type ReportConfigurationPanelProps = {
  onBack: () => void
  onContinue?: () => void
}

// The report template is locked to the current dashboard role — there is
// nothing to choose between anymore, this is a read-only confirmation of
// which template will be used, plus a live preview of the real narrative.
export function ReportConfigurationPanel({ onBack, onContinue }: ReportConfigurationPanelProps) {
  const { role: roleParam } = useParams<{ role?: string }>()
  const role = toReportRole(roleParam)

  const { data: template } = useAsyncData(() => getReportTemplate(role), [role])
  const { data: narrativePreview, isLoading: isNarrativeLoading } = useAsyncData(
    () => getNarrativePreview(template?.id),
    [template?.id],
  )

  const handleContinue = () => {
    if (!template) return
    onContinue?.()
  }

  return (
    <Card>
      <div className="flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8FD4D8] to-relaive-secondary-hover text-white shadow-md shadow-relaive-secondary/30">
          <ReportDocumentIcon />
        </span>
        <div>
          <CardTitle>Report Configuration</CardTitle>
          <p className="mt-0.5 text-sm text-relaive-gray">
            {template ? template.title : 'Loading report type…'}
          </p>
        </div>
      </div>

      {template ? (
        <p className="mt-4 text-sm text-relaive-navy/80">{template.description}</p>
      ) : null}

      {template && template.includes.length > 0 ? (
        <div className="mt-6 rounded-xl bg-slate-50 p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-relaive-navy">Report will include</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {template.includes.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-relaive-navy">
                <span className="shrink-0 text-emerald-600">
                  <CheckCircleIcon size={16} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {narrativePreview ? (
        <div
          className={`mt-6 rounded-xl border border-[#E5E7EB] bg-white p-5 transition-opacity sm:p-6 ${
            isNarrativeLoading ? 'opacity-60' : 'opacity-100'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-relaive-navy sm:text-lg">
              {narrativePreview.title}
            </h3>
            {isNarrativeLoading ? (
              <span className="shrink-0 text-xs font-medium text-relaive-gray">Regenerating…</span>
            ) : null}
          </div>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-relaive-navy sm:text-[15px]">
            {narrativePreview.sections.map((section, index) => (
              <p key={`${section.heading}-${index}`}>
                {section.heading ? <span className="font-semibold">{section.heading}</span> : null}{' '}
                {section.body}
              </p>
            ))}
          </div>
          <p className="mt-5 text-xs italic text-relaive-gray sm:text-sm">
            {narrativePreview.disclaimer}
          </p>
        </div>
      ) : null}

      <StepActions
        onBack={onBack}
        onContinue={handleContinue}
        continueLabel="Generate Report"
        continueDisabled={!template}
      />
    </Card>
  )
}
