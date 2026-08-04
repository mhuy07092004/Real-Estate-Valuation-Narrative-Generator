import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardTitle } from '../../../../components/ui/card/card'
import { OptionCardGroup, type OptionCardItem } from '../../../../components/ui/option-card/option-card'
import { Button } from '../../../../components/ui/button/button'
import { AppraisalSummaryCard } from '../../../../components/ui/appraisal-summary-card/appraisal-summary-card'
import { SendReportCard } from '../../../../components/ui/send-report-card/send-report-card'
import { Notification } from '../../../../components/notification/notification'
import { useAsyncData } from '../../../../hooks/use-async-data'
import {
  getAgentRecommendations,
  getAppraisalDisclaimer,
  getAppraisalSummary,
  getExecutiveSummary,
  getNarrativePreview,
  persistGeneratedReport,
  getPropertySpecificFactors,
  getReportTemplates,
} from '../../../../services/common'
import {
  CheckCircleIcon,
  getAgentRecommendationIcon,
  getReportTemplateIcon,
  ReportDocumentIcon,
  WarningCircleIcon,
} from './generate-report-icons'
import { StepActions } from './step-actions'

type ReportConfigurationPanelProps = {
  onBack: () => void
  initialSubmitted?: boolean
  initialSelectedTemplateId?: string
}

export function ReportConfigurationPanel({
  onBack,
  initialSubmitted = false,
  initialSelectedTemplateId,
}: ReportConfigurationPanelProps) {
  const navigate = useNavigate()
  const { role } = useParams<{ role?: string }>()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [sendToClientOpen, setSendToClientOpen] = useState(false)
  const { data: templates } = useAsyncData(getReportTemplates, [])
  const { data: narrativePreview } = useAsyncData(getNarrativePreview, [])
  const { data: appraisalSummary } = useAsyncData(getAppraisalSummary, [])
  const { data: executiveSummary } = useAsyncData(getExecutiveSummary, [])
  const { data: propertyFactors } = useAsyncData(getPropertySpecificFactors, [])
  const { data: agentRecommendations } = useAsyncData(getAgentRecommendations, [])
  const { data: appraisalDisclaimer } = useAsyncData(getAppraisalDisclaimer, [])

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
    if (!initialSubmitted) return
    if (!templates?.length) return

    const matchedTemplate = initialSelectedTemplateId
      ? templates.find((template) => template.id === initialSelectedTemplateId)
      : null

    if (!selectedId) {
      setSelectedId(matchedTemplate?.id ?? templates[0].id)
    }
    setSubmitted(true)
  }, [initialSubmitted, initialSelectedTemplateId, templates, selectedId])

  const parseEstimatedValue = (value: string | undefined): number => {
    const source = value ?? ''
    const digits = source.replace(/[^\d]/g, '')
    const parsed = Number(digits)
    if (!Number.isFinite(parsed) || parsed <= 0) return 850000
    return parsed
  }

  const buildNarrative = (): string => {
    if (!narrativePreview) {
      return 'Generated appraisal narrative unavailable.'
    }

    return narrativePreview.sections
      .map((section) => `${section.heading} ${section.body}`)
      .join('\n\n')
  }

  const saveReport = async (options: {
    clientName?: string
    clientEmail?: string
    markAsExported?: boolean
  }) => {
    if (!selectedTemplate) {
      throw new Error('Select a report template before saving.')
    }

    await persistGeneratedReport({
      reportTemplateId: selectedTemplate.id,
      narrativeText: buildNarrative(),
      estimatedValue: parseEstimatedValue(appraisalSummary?.midpointEstimate),
      clientName: options.clientName,
      clientEmail: options.clientEmail,
      markAsExported: options.markAsExported,
    })
  }

  const handleSelect = (id: string) => {
    if (submitted) return
    setSelectedId((current) => (current === id ? null : id))
  }

  const handleSendSuccess = () => {
    setSendToClientOpen(false)
    navigate(role ? `/dashboard/${role}` : '/dashboard')
  }

  const handleExportPdf = async () => {
    await saveReport({ markAsExported: true })
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

      {narrativePreview ? (
        <div className="mt-6 rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-6">
          <h3 className="text-base font-semibold text-relaive-navy sm:text-lg">
            {narrativePreview.title}
          </h3>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-relaive-navy sm:text-[15px]">
            {narrativePreview.sections.map((section) => (
              <p key={section.heading}>
                <span className="font-semibold">{section.heading}</span> {section.body}
              </p>
            ))}
          </div>
          <p className="mt-5 text-xs italic text-relaive-gray sm:text-sm">
            {narrativePreview.disclaimer}
          </p>
        </div>
      ) : null}

      {submitted && selectedTemplate ? (
        <div className="mt-6 flex flex-col gap-4">
          <Notification>
            <p className="font-semibold">Your {selectedTemplate.title} is ready</p>
          </Notification>

          {appraisalSummary ? <AppraisalSummaryCard summary={appraisalSummary} /> : null}

          {executiveSummary ? (
            <section className="mt-2">
              <div className="flex items-center gap-3">
                <h3 className="shrink-0 text-xs font-medium tracking-[0.08em] text-relaive-gray uppercase">
                  {executiveSummary.title}
                </h3>
                <div className="h-px flex-1 bg-[#E5E7EB]" />
              </div>

              <div className="mt-5 space-y-4 text-sm leading-relaxed text-relaive-navy sm:text-[15px]">
                {executiveSummary.paragraphs.map((paragraph, index) => (
                  <p key={index}>
                    {paragraph.map((segment, segmentIndex) =>
                      segment.highlight ? (
                        <span key={segmentIndex} className="font-semibold text-emerald-600">
                          {segment.text}
                        </span>
                      ) : (
                        <span key={segmentIndex}>{segment.text}</span>
                      ),
                    )}
                  </p>
                ))}
              </div>

              <Notification className="mt-6">
                <p className="font-semibold">{executiveSummary.observationTitle}</p>
                <p className="mt-1">{executiveSummary.observationMessage}</p>
              </Notification>
            </section>
          ) : null}

          {propertyFactors ? (
            <section className="mt-4">
              <div className="flex items-center gap-3">
                <h3 className="shrink-0 text-xs font-medium tracking-[0.08em] text-relaive-gray uppercase">
                  {propertyFactors.title}
                </h3>
                <div className="h-px flex-1 bg-[#E5E7EB]" />
              </div>

              <div className="mt-5 grid gap-8 lg:grid-cols-2">
                <div>
                  <h4 className="text-xs font-semibold tracking-[0.06em] text-emerald-700 uppercase">
                    {propertyFactors.valueAddingTitle}
                  </h4>
                  <ul className="mt-4 flex flex-col gap-4">
                    {propertyFactors.valueAdding.map((item) => (
                      <li key={item.id} className="flex items-start gap-2.5">
                        <span className="mt-0.5 shrink-0 text-emerald-600">
                          <CheckCircleIcon />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-relaive-navy">{item.title}</p>
                          <p className="mt-0.5 text-sm leading-relaxed text-relaive-gray">
                            {item.description}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-semibold tracking-[0.06em] text-amber-700 uppercase">
                    {propertyFactors.riskTitle}
                  </h4>
                  <ul className="mt-4 flex flex-col gap-4">
                    {propertyFactors.risk.map((item) => (
                      <li key={item.id} className="flex items-start gap-2.5">
                        <span className="mt-0.5 shrink-0 text-amber-600">
                          <WarningCircleIcon />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-relaive-navy">{item.title}</p>
                          <p className="mt-0.5 text-sm leading-relaxed text-relaive-gray">
                            {item.description}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ) : null}

          {agentRecommendations ? (
            <section className="mt-4">
              <div className="flex items-center gap-3">
                <h3 className="shrink-0 text-xs font-medium tracking-[0.08em] text-relaive-gray uppercase">
                  {agentRecommendations.title}
                </h3>
                <div className="h-px flex-1 bg-[#E5E7EB]" />
              </div>

              <div className="mt-5 flex flex-col gap-5">
                {agentRecommendations.items.map((item) => {
                  const content = (
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 shrink-0 text-relaive-primary">
                        {getAgentRecommendationIcon(item.iconKey)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-relaive-navy">{item.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-relaive-gray">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  )

                  if (item.highlighted) {
                    return (
                      <Notification key={item.id} icon={<span className="sr-only" />}>
                        {content}
                      </Notification>
                    )
                  }

                  return <div key={item.id}>{content}</div>
                })}
              </div>
            </section>
          ) : null}

          {appraisalDisclaimer ? (
            <Notification className="mt-2">
              <p className="leading-relaxed">
                <span className="font-semibold">{appraisalDisclaimer.title}</span>{' '}
                {appraisalDisclaimer.message}
              </p>
              <div className="mt-4 border-t border-amber-200/80 pt-3">
                <p className="text-xs text-amber-800/80">{appraisalDisclaimer.footer}</p>
              </div>
            </Notification>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" size="md" onClick={handleExportPdf}>
              Export PDF
            </Button>
            <Button type="button" variant="outline" size="md">
              Edit Report
            </Button>
            <Button
              type="button"
              variant={sendToClientOpen ? 'primary' : 'outline'}
              size="md"
              onClick={() => setSendToClientOpen((open) => !open)}
            >
              Send to Client
            </Button>
          </div>

          {sendToClientOpen ? (
            <SendReportCard
              onClose={() => setSendToClientOpen(false)}
              onSend={(payload) =>
                saveReport({
                  clientName: payload.clientName,
                  clientEmail: payload.clientEmail,
                })
              }
              onSuccess={handleSendSuccess}
            />
          ) : null}
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
