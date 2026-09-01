import { useEffect, useMemo, useState } from 'react'
import { Card, CardTitle } from '../../../../components/ui/card/card'
import { OptionCardGroup, type OptionCardItem } from '../../../../components/ui/option-card/option-card'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getNarrativePreview, getReportTemplates } from '../../../../services/common'
import { ChartTrendIcon, CheckCircleIcon, getReportTemplateIcon, ReportDocumentIcon } from './generate-report-icons'
import { StepActions } from './step-actions'

type ReportConfigurationPanelProps = {
  onBack: () => void
  onContinue?: (templateId: string) => void
  initialSelectedTemplateId?: string
}

export function ReportConfigurationPanel({
  onBack,
  onContinue,
  initialSelectedTemplateId,
}: ReportConfigurationPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: templates } = useAsyncData(getReportTemplates, [])
  const { data: narrativePreview, isLoading: isNarrativeLoading } = useAsyncData(
    () => getNarrativePreview(selectedId ?? undefined),
    [selectedId],
  )

  const optionItems = useMemo<OptionCardItem[]>(
    () =>
      (templates ?? []).map((template) => ({
        id: template.id,
        title: template.title,
        description: template.description,
        icon: getReportTemplateIcon(template.iconKey),
      })),
    [templates],
  )
  const selectedTemplate = (templates ?? []).find((template) => template.id === selectedId)

  useEffect(() => {
    if (!templates?.length) return
    if (selectedId) return

    const matchedTemplate = initialSelectedTemplateId
      ? templates.find((template) => template.id === initialSelectedTemplateId)
      : null

    setSelectedId(matchedTemplate?.id ?? templates[0].id)
  }, [initialSelectedTemplateId, templates, selectedId])

  const handleSelect = (id: string) => {
    setSelectedId(id)
  }

  const handleContinue = () => {
    if (!selectedId) return
    onContinue?.(selectedId)
  }

  return (
    <Card>
      <div className="flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8FD4D8] to-relaive-secondary-hover text-white shadow-md shadow-relaive-secondary/30">
          <ReportDocumentIcon />
        </span>
        <div>
          <CardTitle>Report Configuration</CardTitle>
          <p className="mt-0.5 text-sm text-relaive-gray">Select template and customize</p>
        </div>
      </div>

      <div className="mt-6">
        <OptionCardGroup
          items={optionItems}
          selectedId={selectedId}
          onSelect={handleSelect}
          layout="list"
        />
      </div>

      {selectedTemplate && selectedTemplate.includes?.length ? (
        <div className="mt-6 rounded-xl bg-slate-50 p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-relaive-navy">Report will include</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {selectedTemplate.includes.map((item) => (
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
        continueLabel={
          <span className="inline-flex items-center gap-2">
            Generate Report
            <ChartTrendIcon size={16} />
          </span>
        }
        continueDisabled={!selectedId}
      />
    </Card>
  )
}
