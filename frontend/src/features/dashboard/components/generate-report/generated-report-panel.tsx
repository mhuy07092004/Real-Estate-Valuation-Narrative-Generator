import type { ReactNode } from 'react'
import { Button } from '../../../../components/ui/button/button'
import { Card } from '../../../../components/ui/card/card'
import { SectionDivider } from '../../../../components/ui/section-divider/section-divider'
import { ReportHeaderCard, type ReportHeaderStat } from '../../../../components/ui/report-header-card/report-header-card'
import type { ExecutiveSummarySegment } from '../../../../services/common'
import { ArrowLeftIcon, BookmarkIcon, CheckCircleIcon, RefreshIcon, SendIcon, TrendFlatIcon, TrendUpIcon } from './generate-report-icons'

export type GeneratedReportSection = {
  id: string
  title: string
  paragraphs: ExecutiveSummarySegment[][]
}

export type GeneratedReportTwoColumnSection = {
  title: string
  paragraphs: string[]
  highlightsTitle: string
  highlights: string[]
}

export type GeneratedReportMetricTrend = 'up' | 'flat'

export type GeneratedReportMetricCard = {
  id: string
  trend: GeneratedReportMetricTrend
  value: string
  label: string
}

export type GeneratedReportTableRow = {
  id: string
  cells: string[]
  isTotal?: boolean
}

export type GeneratedReportTable = {
  title: string
  columns: string[]
  rows: GeneratedReportTableRow[]
}

export type GeneratedReportSummaryResult = {
  rangeLow: string
  rangeHigh: string
  midpointLabel: string
  midpointValue: string
  progressPercent: number
}

export type GeneratedReportStrategyCard = {
  id: string
  icon: ReactNode
  label: string
  title: string
  description: string
}

export type GeneratedReportCertification = {
  name: string
  title: string
  initials: string
  disclaimer: string
}

export type GeneratedReportPanelProps = {
  eyebrowIcon: ReactNode
  eyebrowLabel: string
  preparedByName: string
  date: string
  reportTitle: string
  reportSubtitle: string
  headerStats: ReportHeaderStat[]
  sections: GeneratedReportSection[]
  twoColumnSection: GeneratedReportTwoColumnSection
  metricCards: GeneratedReportMetricCard[]
  metricCardsIntro?: string
  table: GeneratedReportTable
  summaryResult: GeneratedReportSummaryResult
  strategyCards: GeneratedReportStrategyCard[]
  certification: GeneratedReportCertification
  onBack?: () => void
  onGenerateAnother?: () => void
  onShareViaEmail?: () => void
  onSaveReport?: () => void
  isSaving?: boolean
  saveLabel?: string
}

function ParagraphSegments({ segments }: { segments: ExecutiveSummarySegment[] }) {
  return (
    <>
      {segments.map((segment, index) =>
        segment.highlight ? (
          <span key={index} className="font-semibold text-emerald-600">
            {segment.text}
          </span>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  )
}

function MetricTrendCard({ card }: { card: GeneratedReportMetricCard }) {
  return (
    <Card className="items-center text-center">
      <span className={card.trend === 'up' ? 'text-emerald-500' : 'text-relaive-gray'}>
        {card.trend === 'up' ? <TrendUpIcon /> : <TrendFlatIcon />}
      </span>
      <p className="mt-3 text-2xl font-bold tracking-tight text-relaive-navy sm:text-3xl">
        {card.value}
      </p>
      <p className="mt-1.5 text-sm text-relaive-gray">{card.label}</p>
    </Card>
  )
}

function StrategyCard({ card }: { card: GeneratedReportStrategyCard }) {
  return (
    <Card>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-relaive-primary/10 text-relaive-primary">
        {card.icon}
      </span>
      <p className="mt-4 text-xs font-semibold tracking-[0.06em] text-relaive-gray uppercase">
        {card.label}
      </p>
      <h4 className="mt-1 text-base font-semibold text-relaive-navy sm:text-lg">{card.title}</h4>
      <p className="mt-2 text-sm leading-relaxed text-relaive-gray">{card.description}</p>
    </Card>
  )
}

export function GeneratedReportPanel({
  eyebrowIcon,
  eyebrowLabel,
  preparedByName,
  date,
  reportTitle,
  reportSubtitle,
  headerStats,
  sections,
  twoColumnSection,
  metricCards,
  metricCardsIntro,
  table,
  summaryResult,
  strategyCards,
  certification,
  onBack,
  onGenerateAnother,
  onShareViaEmail,
  onSaveReport,
  isSaving = false,
  saveLabel = 'Save Report',
}: GeneratedReportPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        {onBack ? (
          <Button type="button" variant="outline" size="md" onClick={onBack}>
            <span className="inline-flex items-center gap-2">
              <ArrowLeftIcon />
              Back
            </span>
          </Button>
        ) : null}

        {onGenerateAnother ? (
          <Button type="button" variant="outline" size="md" onClick={onGenerateAnother}>
            <span className="inline-flex items-center gap-2">
              <RefreshIcon />
              Generate another report
            </span>
          </Button>
        ) : null}

        <div className="ml-auto flex flex-wrap items-center gap-3">
          {onShareViaEmail ? (
            <Button type="button" variant="outline" size="md" onClick={onShareViaEmail}>
              <span className="inline-flex items-center gap-2">
                <SendIcon />
                Share via email
              </span>
            </Button>
          ) : null}

          {onSaveReport ? (
            <Button type="button" variant="primary" size="md" onClick={onSaveReport} disabled={isSaving}>
              <span className="inline-flex items-center gap-2">
                <BookmarkIcon />
                {isSaving ? 'Saving…' : saveLabel}
              </span>
            </Button>
          ) : null}
        </div>
      </div>

      <ReportHeaderCard
        eyebrowIcon={eyebrowIcon}
        eyebrowLabel={eyebrowLabel}
        preparedByName={preparedByName}
        date={date}
        title={reportTitle}
        subtitle={reportSubtitle}
        stats={headerStats}
      />

      <Card>
        <div className="flex flex-col gap-8">
          {sections.map((section) => (
            <section key={section.id}>
              <SectionDivider label={section.title} />
              <div className="mt-5 space-y-4 text-sm leading-relaxed text-relaive-navy sm:text-[15px]">
                {section.paragraphs.map((paragraph, index) => (
                  <p key={index}>
                    <ParagraphSegments segments={paragraph} />
                  </p>
                ))}
              </div>
            </section>
          ))}

          <section>
            <SectionDivider label={twoColumnSection.title} />
            <div className="mt-5 grid gap-6 lg:grid-cols-[3fr_2fr]">
              <div className="space-y-4 text-sm leading-relaxed text-relaive-navy sm:text-[15px]">
                {twoColumnSection.paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              <div className="rounded-2xl bg-slate-50 p-5 sm:p-6">
                <h4 className="text-xs font-semibold tracking-[0.06em] text-relaive-gray uppercase">
                  {twoColumnSection.highlightsTitle}
                </h4>
                <ul className="mt-4 flex flex-col gap-3">
                  {twoColumnSection.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-sm text-relaive-navy">
                      <span className="mt-0.5 shrink-0 rounded-full bg-relaive-primary/15 p-0.5 text-relaive-primary">
                        <CheckCircleIcon size={15} />
                      </span>
                      <span className="leading-snug">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section>
            <SectionDivider label="Market Analysis" />
            {metricCardsIntro ? (
              <p className="mt-5 text-sm leading-relaxed text-relaive-navy sm:text-[15px]">
                {metricCardsIntro}
              </p>
            ) : null}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {metricCards.map((card) => (
                <MetricTrendCard key={card.id} card={card} />
              ))}
            </div>
          </section>

          <section>
            <SectionDivider label={table.title} />
            <div className="mt-5 overflow-x-auto rounded-2xl border border-black/5">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="bg-gray-50/60">
                    {table.columns.map((column) => (
                      <th
                        key={column}
                        className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-relaive-gray sm:px-6"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {table.rows.map((row) => (
                    <tr
                      key={row.id}
                      className={row.isTotal ? 'bg-relaive-primary/[0.06] font-semibold' : ''}
                    >
                      {row.cells.map((cell, index) => (
                        <td
                          key={index}
                          className={`px-4 py-3.5 text-sm sm:px-6 ${
                            row.isTotal ? 'text-relaive-primary' : 'text-relaive-navy'
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <SectionDivider label="Appraisal Result" />
            <div className="mt-5 rounded-2xl border border-relaive-primary/20 bg-relaive-primary/[0.04] p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium tracking-[0.08em] text-relaive-gray uppercase">
                    Estimated Range
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-relaive-navy sm:text-3xl">
                    {summaryResult.rangeLow} – {summaryResult.rangeHigh}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium tracking-[0.08em] text-relaive-gray uppercase">
                    {summaryResult.midpointLabel}
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-relaive-primary sm:text-3xl">
                    {summaryResult.midpointValue}
                  </p>
                </div>
              </div>

              <div className="relative mt-6 h-2 w-full overflow-hidden rounded-full bg-relaive-primary/15">
                <div className="h-full rounded-full bg-relaive-primary" style={{ width: '100%' }} />
                <span
                  className="absolute top-1/2 h-4 w-4 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-white bg-relaive-navy shadow-sm"
                  style={{ left: `${Math.min(Math.max(summaryResult.progressPercent, 0), 100)}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-relaive-gray">
                <span>{summaryResult.rangeLow}</span>
                <span>{summaryResult.rangeHigh}</span>
              </div>
            </div>
          </section>

          <section>
            <SectionDivider label="Recommended Strategy" />
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {strategyCards.map((card) => (
                <StrategyCard key={card.id} card={card} />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4 border-t border-black/5 pt-6 sm:flex-row sm:items-start">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-relaive-secondary to-relaive-primary text-lg font-semibold text-white">
              {certification.initials}
            </span>
            <div>
              <p className="text-sm font-semibold text-relaive-navy">{certification.name}</p>
              <p className="text-sm text-relaive-gray">{certification.title}</p>
              <p className="mt-3 text-xs leading-relaxed text-relaive-gray/90">
                {certification.disclaimer}
              </p>
            </div>
          </section>
        </div>
      </Card>
    </div>
  )
}
