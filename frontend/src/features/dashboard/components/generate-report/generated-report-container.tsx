import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../auth/hooks/use-auth'
import { SendReportCard } from '../../../../components/ui/send-report-card/send-report-card'
import type { ReportHeaderStat } from '../../../../components/ui/report-header-card/report-header-card'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getInitials } from '../../utils/dashboard-user'
import {
  getAgentRecommendations,
  getAppraisalDisclaimer,
  getAppraisalInputContext,
  getAppraisalSummary,
  getComparableSales,
  getDemandSignals,
  getExecutiveSummary,
  getNarrativePreview,
  getPropertySpecificFactors,
  getReportTemplates,
  persistGeneratedReport,
} from '../../../../services/common'
import { getAgentRecommendationIcon, ReportDocumentIcon } from './generate-report-icons'
import {
  GeneratedReportPanel,
  type GeneratedReportCertification,
  type GeneratedReportMetricCard,
  type GeneratedReportSection,
  type GeneratedReportStrategyCard,
  type GeneratedReportSummaryResult,
  type GeneratedReportTable,
  type GeneratedReportTwoColumnSection,
} from './generated-report-panel'

type GeneratedReportContainerProps = {
  selectedTemplateId?: string
  onBack: () => void
  onGenerateAnother: () => void
}

const ROLE_TITLE: Record<string, string> = {
  agent: 'Real Estate Agent',
  valuer: 'Property Valuer',
  investor: 'Investor',
  buyer: 'Buyer',
}

function formatToday(): string {
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

function parseCurrency(value: string): number {
  const digits = value.replace(/[^\d]/g, '')
  const parsed = Number(digits)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatCurrency(value: number): string {
  return `$${new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 }).format(value)}`
}

export function GeneratedReportContainer({
  selectedTemplateId,
  onBack,
  onGenerateAnother,
}: GeneratedReportContainerProps) {
  const { role } = useParams<{ role?: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: templates } = useAsyncData(getReportTemplates, [])
  const selectedTemplate =
    (templates ?? []).find((template) => template.id === selectedTemplateId) ?? templates?.[0]

  const { data: narrativePreview } = useAsyncData(
    () => getNarrativePreview(selectedTemplate?.id),
    [selectedTemplate?.id],
  )
  const { data: appraisalSummary } = useAsyncData(getAppraisalSummary, [])
  const { data: executiveSummary } = useAsyncData(getExecutiveSummary, [])
  const { data: propertyFactors } = useAsyncData(getPropertySpecificFactors, [])
  const { data: agentRecommendations } = useAsyncData(getAgentRecommendations, [])
  const { data: appraisalDisclaimer } = useAsyncData(getAppraisalDisclaimer, [])
  const { data: comparableSales } = useAsyncData(getComparableSales, [])
  const { data: demandSignals } = useAsyncData(getDemandSignals, [])

  const [shareOpen, setShareOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedJustNow, setSavedJustNow] = useState(false)

  const buildNarrative = (): string => {
    if (!narrativePreview) return 'Generated appraisal narrative unavailable.'
    return narrativePreview.sections
      .map((section) => `${section.heading} ${section.body}`)
      .join('\n\n')
  }

  const handleSave = async () => {
    if (!selectedTemplate || !appraisalSummary) return
    setIsSaving(true)
    try {
      await persistGeneratedReport({
        reportTemplateId: selectedTemplate.id,
        narrativeText: buildNarrative(),
        estimatedValue: parseCurrency(appraisalSummary.midpointEstimate),
      })
      setSavedJustNow(true)
      setTimeout(() => setSavedJustNow(false), 2500)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendSuccess = () => {
    setShareOpen(false)
    navigate(role ? `/dashboard/${role}` : '/dashboard')
  }

  if (
    !selectedTemplate ||
    !narrativePreview ||
    !appraisalSummary ||
    !executiveSummary ||
    !propertyFactors ||
    !agentRecommendations ||
    !appraisalDisclaimer ||
    !comparableSales ||
    !demandSignals
  ) {
    return (
      <div className="rounded-2xl border border-black/5 bg-white px-5 py-8 text-sm text-relaive-gray">
        Loading generated report…
      </div>
    )
  }

  const context = getAppraisalInputContext()

  const headerStats: ReportHeaderStat[] = [
    { id: 'estimated-value', label: 'Estimated Value', value: appraisalSummary.priceRange, accent: true },
    {
      id: 'midpoint',
      label: 'Midpoint',
      value: formatCurrency(parseCurrency(appraisalSummary.midpointEstimate)),
    },
    { id: 'property-type', label: 'Property Type', value: context?.propertyType || 'House' },
    {
      id: 'features',
      label: 'Bed · Bath · Car',
      value: `${context?.bedrooms ?? 3} bed · ${context?.bathrooms ?? 2} bath · ${context?.parking ?? 1} car`,
    },
  ]

  const sections: GeneratedReportSection[] = [
    {
      id: 'executive-summary',
      title: executiveSummary.title.replace(/^\d+\.\s*/, ''),
      paragraphs: executiveSummary.paragraphs,
    },
  ]

  const propertyAnalysisBody =
    narrativePreview.sections.find((section) => section.heading.toLowerCase().includes('property'))
      ?.body ?? narrativePreview.sections[narrativePreview.sections.length - 1]?.body

  const twoColumnSection: GeneratedReportTwoColumnSection = {
    title: 'Property Description',
    paragraphs: propertyAnalysisBody ? [propertyAnalysisBody] : [],
    highlightsTitle: 'Property Highlights',
    highlights: propertyFactors.valueAdding.map((item) => item.title),
  }

  const metricCards: GeneratedReportMetricCard[] = demandSignals.map((signal) => ({
    id: signal.id,
    trend: signal.tone === 'medium' ? 'flat' : 'up',
    value: `${signal.percent}%`,
    label: `${signal.label} · ${signal.level}`,
  }))

  const metricCardsIntro = `${appraisalSummary.suburbLine} continues to show healthy buyer demand, underpinned by ${
    demandSignals.find((signal) => signal.id === 'buyer-interest')?.level.toLowerCase() ?? 'strong'
  } buyer interest and ${
    demandSignals.find((signal) => signal.id === 'price-growth')?.level.toLowerCase() ?? 'steady'
  } price growth. Supply remains ${
    demandSignals.find((signal) => signal.id === 'supply-level')?.level.toLowerCase() ?? 'balanced'
  } relative to demand, which is helping to sustain competitive tension among buyers. The signals below summarise the current market conditions used to inform this appraisal.`

  const averagePrice = comparableSales.length
    ? Math.round(comparableSales.reduce((sum, comp) => sum + comp.price, 0) / comparableSales.length)
    : 0

  const table: GeneratedReportTable = {
    title: 'Comparable Sales',
    columns: ['Address', 'Configuration', 'Sold', 'Price'],
    rows: [
      ...comparableSales.map((comp) => ({
        id: comp.id,
        cells: [
          comp.address,
          `${comp.beds} bed · ${comp.baths} bath · ${comp.parking} car`,
          comp.soldAgo,
          formatCurrency(comp.price),
        ],
      })),
      {
        id: 'average',
        isTotal: true,
        cells: ['Average', '—', '—', formatCurrency(averagePrice)],
      },
    ],
  }

  const [rangeLowRaw, rangeHighRaw] = appraisalSummary.priceRange.split('–').map((part) => part.trim())
  const rangeLow = parseCurrency(rangeLowRaw ?? '0')
  const rangeHigh = parseCurrency(rangeHighRaw ?? rangeLowRaw ?? '0')
  const midpoint = parseCurrency(appraisalSummary.midpointEstimate)
  const progressPercent =
    rangeHigh > rangeLow ? ((midpoint - rangeLow) / (rangeHigh - rangeLow)) * 100 : 50

  const summaryResult: GeneratedReportSummaryResult = {
    rangeLow: rangeLowRaw ?? appraisalSummary.priceRange,
    rangeHigh: rangeHighRaw ?? '',
    midpointLabel: 'Midpoint Estimate',
    midpointValue: formatCurrency(midpoint),
    progressPercent,
  }

  const strategyCards: GeneratedReportStrategyCard[] = agentRecommendations.items.map((item) => ({
    id: item.id,
    icon: getAgentRecommendationIcon(item.iconKey),
    label: item.iconKey.charAt(0).toUpperCase() + item.iconKey.slice(1),
    title: item.title,
    description: item.description,
  }))

  const preparedByName = user?.fullName ?? 'Relaive User'

  const certification: GeneratedReportCertification = {
    name: preparedByName,
    title: ROLE_TITLE[role ?? ''] ?? 'Property Appraisal Specialist',
    initials: getInitials(preparedByName),
    disclaimer: `${appraisalDisclaimer.title} ${appraisalDisclaimer.message}`,
  }

  return (
    <div className="flex flex-col gap-6">
      <GeneratedReportPanel
        eyebrowIcon={<ReportDocumentIcon size={16} />}
        eyebrowLabel={`Relaive · ${selectedTemplate.title}`}
        preparedByName={preparedByName}
        date={formatToday()}
        reportTitle={appraisalSummary.street}
        reportSubtitle={`${appraisalSummary.suburbLine} · ${appraisalSummary.featuresLine}`}
        headerStats={headerStats}
        sections={sections}
        twoColumnSection={twoColumnSection}
        metricCards={metricCards}
        metricCardsIntro={metricCardsIntro}
        table={table}
        summaryResult={summaryResult}
        strategyCards={strategyCards}
        certification={certification}
        onBack={onBack}
        onGenerateAnother={onGenerateAnother}
        onShareViaEmail={() => setShareOpen((open) => !open)}
        onSaveReport={handleSave}
        isSaving={isSaving}
        saveLabel={savedJustNow ? 'Saved!' : 'Save Report'}
      />

      {shareOpen ? (
        <SendReportCard
          onClose={() => setShareOpen(false)}
          onSend={(payload) =>
            persistGeneratedReport({
              reportTemplateId: selectedTemplate.id,
              narrativeText: buildNarrative(),
              estimatedValue: parseCurrency(appraisalSummary.midpointEstimate),
              clientName: payload.clientName,
              clientEmail: payload.clientEmail,
            })
          }
          onSuccess={handleSendSuccess}
        />
      ) : null}
    </div>
  )
}
