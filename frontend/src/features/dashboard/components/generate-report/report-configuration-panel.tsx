import { useMemo, useState } from 'react'
import { Card, CardTitle } from '../../../../components/ui/card/card'
import { OptionCardGroup, type OptionCardItem } from '../../../../components/ui/option-card/option-card'
import { Button } from '../../../../components/ui/button/button'
import { Notification } from '../../../../components/notification/notification'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getReportTemplates } from '../../../../services/common'
import { getReportTemplateIcon, ReportDocumentIcon } from './generate-report-icons'
import { StepActions } from './step-actions'

type ReportConfigurationPanelProps = {
  onBack: () => void
}

export function ReportConfigurationPanel({ onBack }: ReportConfigurationPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const { data: templates } = useAsyncData(getReportTemplates, [])

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

  const handleSelect = (id: string) => {
    if (submitted) return
    setSelectedId((current) => (current === id ? null : id))
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
          columns={2}
        />
      </div>

      {submitted && selectedTemplate ? (
        <div className="mt-6 flex flex-col gap-4">
          <Notification>
            <p className="font-semibold">Your {selectedTemplate.title} is ready</p>
          </Notification>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="primary" size="md">
              View
            </Button>
            <Button type="button" variant="outline" size="md">
              Download
            </Button>
          </div>
        </div>
      ) : (
        <StepActions
          onBack={onBack}
          onContinue={() => setSubmitted(true)}
          continueLabel="Submit"
          continueDisabled={!selectedId}
        />
      )}
    </Card>
  )
}
