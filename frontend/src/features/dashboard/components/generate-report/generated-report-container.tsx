import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../../auth/hooks/use-auth'
import { SendReportCard } from '../../../../components/ui/send-report-card/send-report-card'
import type { ReportHeaderStat } from '../../../../components/ui/report-header-card/report-header-card'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getInitials } from '../../utils/dashboard-user'
import {
  getAffordabilityOutlook,
  getAffordabilityResult,
  getAgentRecommendations,
  getAppraisalDisclaimer,
  getAppraisalInputContext,
  getAppraisalSummary,
  getComparableSales,
  getExecutiveSummary,
  getGrowthOutlook,
  getNarrativePreview,
  getReportTemplate,
  getRoiResult,
  createShareLink,
  persistGeneratedReport,
  sendReportEmail,
  type AffordabilityPersistResult,
  type PersistedReport,
  type ReportRole,
  type RoiPersistResult,
} from '../../../../services/common'
import { getClientListMockData, type ClientItem } from '../../../../services/agent'
import { getAgentRecommendationIcon, ReportDocumentIcon } from './generate-report-icons'
import {
  GeneratedReportPanel,
  type GeneratedReportCertification,
  type GeneratedReportSection,
  type GeneratedReportStrategyCard,
  type GeneratedReportSummaryResult,
  type GeneratedReportTable,
} from './generated-report-panel'

const REPORT_ROLES: ReportRole[] = ['agent', 'valuer', 'buyer', 'investor']

function toReportRole(role: string | undefined): ReportRole {
  return REPORT_ROLES.includes(role as ReportRole) ? (role as ReportRole) : 'agent'
}

type GeneratedReportContainerProps = {
  onBack: () => void
  onGenerateAnother: () => void
  savedReport: PersistedReport | null
  clientId: string | null
}

// A reopened report uses its own persisted ROI values (the wizard's Step 3
// is skipped entirely when jumping straight to this step via `ready=1`, so
// the local ROI store would be stale or empty); a freshly-generated report
// uses whatever Step 3 just computed in this session.
function resolveRoiForDisplay(savedReport: PersistedReport | null): RoiPersistResult | null {
  if (savedReport) {
    if (savedReport.roiGrossYieldPct === null || savedReport.roiNetYieldPct === null || savedReport.roiMonthlyCashFlow === null) {
      return null
    }
    return {
      grossYieldPct: savedReport.roiGrossYieldPct,
      netYieldPct: savedReport.roiNetYieldPct,
      monthlyCashFlow: savedReport.roiMonthlyCashFlow,
      cashOnCashReturnPct: savedReport.roiCashOnCashReturnPct,
    }
  }
  return getRoiResult()
}

// Same pattern as resolveRoiForDisplay, for the buyer role.
function resolveAffordabilityForDisplay(savedReport: PersistedReport | null): AffordabilityPersistResult | null {
  if (savedReport) {
    if (
      savedReport.affordabilityEstimatedBorrowingCapacity === null ||
      savedReport.affordabilityMaxLoanAmount === null ||
      savedReport.affordabilityRepaymentToIncomePct === null
    ) {
      return null
    }
    return {
      estimatedBorrowingCapacity: savedReport.affordabilityEstimatedBorrowingCapacity,
      maxLoanAmount: savedReport.affordabilityMaxLoanAmount,
      repaymentToIncomePct: savedReport.affordabilityRepaymentToIncomePct,
    }
  }
  return getAffordabilityResult()
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
  onBack,
  onGenerateAnother,
  savedReport,
  clientId,
}: GeneratedReportContainerProps) {
  const { role } = useParams<{ role?: string }>()
  const { user } = useAuth()
  const reportRole = toReportRole(role)
  const initialClientId = clientId ?? savedReport?.clientId ?? null
  // Save once: every Save / Share / Email reuses this id instead of creating a new row.
  const savedReportIdRef = useRef<string | null>(savedReport?.reportId ?? null)
  const { data: clients } = useAsyncData(
    () => (reportRole === 'agent' ? getClientListMockData() : Promise.resolve<ClientItem[]>([])),
    [reportRole],
  )
  const roiForDisplay = reportRole === 'investor' ? resolveRoiForDisplay(savedReport) : null
  const affordabilityForDisplay = reportRole === 'buyer' ? resolveAffordabilityForDisplay(savedReport) : null

  const { data: selectedTemplate } = useAsyncData(() => getReportTemplate(reportRole), [reportRole])

  const { data: narrativePreview } = useAsyncData(
    () => getNarrativePreview(selectedTemplate?.id),
    [selectedTemplate?.id],
  )
  const { data: appraisalSummary } = useAsyncData(getAppraisalSummary, [])
  const { data: executiveSummary } = useAsyncData(getExecutiveSummary, [])
  const { data: agentRecommendations } = useAsyncData(getAgentRecommendations, [])
  const { data: appraisalDisclaimer } = useAsyncData(getAppraisalDisclaimer, [])
  const { data: comparableSales } = useAsyncData(getComparableSales, [])
  const { data: growthOutlook } = useAsyncData(
    () => (reportRole === 'investor' ? getGrowthOutlook(roiForDisplay) : Promise.resolve(null)),
    [reportRole, roiForDisplay?.grossYieldPct, roiForDisplay?.netYieldPct, roiForDisplay?.monthlyCashFlow, roiForDisplay?.cashOnCashReturnPct],
  )
  const { data: affordabilityOutlook } = useAsyncData(
    () => (reportRole === 'buyer' ? getAffordabilityOutlook(affordabilityForDisplay) : Promise.resolve(null)),
    [
      reportRole,
      affordabilityForDisplay?.estimatedBorrowingCapacity,
      affordabilityForDisplay?.maxLoanAmount,
      affordabilityForDisplay?.repaymentToIncomePct,
    ],
  )

  const [shareOpen, setShareOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedJustNow, setSavedJustNow] = useState(false)
  const sharePanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!shareOpen) return
    sharePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [shareOpen])

  const buildNarrative = (): string => {
    if (!narrativePreview) return 'Generated appraisal narrative unavailable.'
    return narrativePreview.sections
      .map((section) => `${section.heading} ${section.body}`)
      .join('\n\n')
  }

  // Snapshot of exactly what's on screen right now — persisted alongside the
  // report so a later share link (or reopen) shows the same figures
  // forever, not a live re-fetch that can drift as comparable/market data
  // changes underneath it.
  const buildSnapshotFields = () => ({
    priceRangeLow: rangeLow,
    priceRangeHigh: rangeHigh,
    sections,
    comparables: comparableSales ?? [],
    strategyCards: (agentRecommendations?.items ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      iconKey: item.iconKey,
    })),
  })

  const ensureSaved = async (): Promise<string> => {
    if (savedReportIdRef.current) return savedReportIdRef.current
    if (!selectedTemplate || !appraisalSummary) throw new Error('Report is still loading.')

    const { reportId } = await persistGeneratedReport({
      role: reportRole,
      clientId: initialClientId ?? undefined,
      reportTemplateId: selectedTemplate.id,
      narrativeText: buildNarrative(),
      estimatedValue: parseCurrency(appraisalSummary.midpointEstimate),
      roi: roiForDisplay,
      affordability: affordabilityForDisplay,
      ...buildSnapshotFields(),
    })
    savedReportIdRef.current = reportId
    return reportId
  }

  const handleSave = async () => {
    if (!selectedTemplate || !appraisalSummary) return
    setIsSaving(true)
    try {
      await ensureSaved()
      setSavedJustNow(true)
      setTimeout(() => setSavedJustNow(false), 2500)
    } finally {
      setIsSaving(false)
    }
  }

  if (
    !selectedTemplate ||
    !narrativePreview ||
    !appraisalSummary ||
    !executiveSummary ||
    !agentRecommendations ||
    !appraisalDisclaimer ||
    !comparableSales ||
    (reportRole === 'investor' && !growthOutlook) ||
    (reportRole === 'buyer' && !affordabilityOutlook)
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
    ...(reportRole === 'investor' && growthOutlook
      ? [
          {
            id: 'growth-outlook',
            title: growthOutlook.title.replace(/^\d+\.\s*/, ''),
            paragraphs: growthOutlook.paragraphs,
          },
        ]
      : []),
    ...(reportRole === 'buyer' && affordabilityOutlook
      ? [
          {
            id: 'affordability-outlook',
            title: affordabilityOutlook.title.replace(/^\d+\.\s*/, ''),
            paragraphs: affordabilityOutlook.paragraphs,
          },
        ]
      : []),
  ]

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
        sharePanel={
          shareOpen ? (
            <div ref={sharePanelRef}>
              <SendReportCard
                onClose={() => setShareOpen(false)}
                clients={clients ?? []}
                initialClientId={initialClientId}
                onSend={async (payload) => {
                  const reportId = await ensureSaved()
                  const shareUrl = await createShareLink(reportId, {
                    clientId: payload.clientId,
                    clientName: payload.clientName || undefined,
                    clientEmail: payload.clientEmail || undefined,
                  })
                  return { shareUrl }
                }}
                onSendEmail={async (payload) => {
                  const reportId = await ensureSaved()
                  const shareUrl = await sendReportEmail(reportId, {
                    clientId: payload.clientId,
                    clientName: payload.clientName,
                    clientEmail: payload.clientEmail,
                    note: payload.note,
                  })
                  return { shareUrl }
                }}
              />
            </div>
          ) : null
        }
      />
    </div>
  )
}
