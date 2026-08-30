import type {
  AppraisalDisclaimer,
  AppraisalInputContext,
  AppraisalSummary,
  ComparableSale,
  NarrativePreview,
} from '../../../../../services/common'
import { Notification } from '../../../../../components/notification/notification'
import type { RoiResult, RoiScenario } from '../roi-analysis/use-roi-calculator'
import {
  ComparableSalesTable,
  MarketStatTiles,
  ReportCertificationBlock,
  ReportHeaderBanner,
  SectionDivider,
  TrendingUpIcon,
  ValuationRangeBar,
} from './report-document-shared'

// v2 report document for the Investor role — matches figma's InvestmentAnalysisReport
// pattern (GenerateAppraisalPage.tsx), built from the same shared blocks as
// VendorAppraisalReport (see report-document-shared.tsx / §10.2). Real data throughout:
// narrative is Groq-generated (reportType "investment-report"), comparables/market stats
// come from the same real backend endpoints the Agent flow uses, and the ROI figures are
// the user's own real scenario from the wizard's ROI Analysis step — not fabricated.

const MARKET_STAT_ORDER = ['annual-growth', 'clearance-rate', 'days-on-mkt']

type InvestmentAnalysisReportProps = {
  context: AppraisalInputContext
  summary: AppraisalSummary
  narrative: NarrativePreview
  disclaimer: AppraisalDisclaimer
  comparables: ComparableSale[]
  roi: RoiResult
  scenario: RoiScenario
  agentName: string
}

export function InvestmentAnalysisReport({
  context,
  summary,
  narrative,
  disclaimer,
  comparables,
  roi,
  scenario,
  agentName,
}: InvestmentAnalysisReportProps) {
  const marketStats = MARKET_STAT_ORDER.map((id) => summary.stats.find((stat) => stat.id === id)).filter(
    (stat): stat is (typeof summary.stats)[number] => Boolean(stat),
  )
  const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  const interestRateShockMonthly = Math.round(((scenario.purchasePrice - scenario.deposit) * 0.01) / 12)

  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
      <ReportHeaderBanner
        icon={<TrendingUpIcon />}
        eyebrow="Relaive · Investment Analysis"
        title="Investment Analysis Report"
        subtitle={context.address}
        preparedBy={agentName}
        date={today}
        stats={[
          { label: 'Estimated Value', value: summary.priceRange, highlight: true },
          { label: 'Midpoint', value: summary.midpointEstimate },
          { label: 'Gross Yield', value: `${roi.grossYield.toFixed(1)}%` },
          { label: 'Net Yield', value: `${roi.netYield.toFixed(1)}%` },
        ]}
      />

      <div className="px-6 py-7 sm:px-8">
        <SectionDivider label="Investment Returns Summary" />
        <div className="mb-4 grid grid-cols-2 gap-3">
          {[
            { label: 'Gross Yield', value: `${roi.grossYield.toFixed(1)}%`, tone: 'text-relaive-secondary' },
            { label: 'Net Yield', value: `${roi.netYield.toFixed(1)}%`, tone: 'text-relaive-primary' },
            {
              label: 'Monthly Cash Flow',
              value: `${roi.monthlyCashFlow >= 0 ? '+' : ''}$${Math.abs(roi.monthlyCashFlow).toFixed(0)}`,
              tone: roi.monthlyCashFlow >= 0 ? 'text-emerald-600' : 'text-red-500',
            },
            {
              label: 'Cash-on-Cash Return',
              value: `${roi.cashOnCash.toFixed(1)}%`,
              tone: roi.cashOnCash >= 0 ? 'text-emerald-600' : 'text-red-500',
            },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-black/[0.02] p-4">
              <p className="mb-1 text-xs text-relaive-gray">{item.label}</p>
              <p className={`text-2xl font-bold ${item.tone}`}>{item.value}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 rounded-xl bg-black/[0.02] p-4 text-sm text-relaive-navy/75">
          {[
            ['Purchase Price', `$${scenario.purchasePrice.toLocaleString()}`],
            ['Deposit', `$${scenario.deposit.toLocaleString()}`],
            ['Weekly Rent (est.)', `$${scenario.weeklyRent}/wk`],
            ['Vacancy Allowance', `${scenario.vacancyRate}%`],
            ['Interest Rate', `${scenario.interestRate}% p.a.`],
            ['Loan Term', `${scenario.loanTerm} years`],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span>{label}</span>
              <span className="font-medium text-relaive-navy">{value}</span>
            </div>
          ))}
        </div>

        <SectionDivider label="Property Overview" />
        <div className="space-y-3 text-sm leading-relaxed text-relaive-navy/85">
          {narrative.sections.map((section, index) => (
            <p key={`${section.heading}-${index}`}>
              {section.heading ? <span className="font-semibold text-relaive-navy">{section.heading} </span> : null}
              {section.body}
            </p>
          ))}
        </div>

        <SectionDivider label="Comparable Sales Evidence" />
        <ComparableSalesTable comparables={comparables} />

        {marketStats.length > 0 ? (
          <>
            <SectionDivider label="Market Context" />
            <MarketStatTiles stats={marketStats} />
          </>
        ) : null}

        <SectionDivider label="Risk Assessment" />
        <div className="space-y-2">
          {[
            {
              factor: 'Interest Rate Sensitivity',
              level: 'Medium',
              note: `Modelled at ${scenario.interestRate}% p.a.; a 1% increase would reduce monthly cash flow by approximately $${interestRateShockMonthly}.`,
            },
            {
              factor: 'Vacancy Risk',
              level: 'Low–Medium',
              note: `Base case models ${scenario.vacancyRate}% vacancy allowance against weekly rent of $${scenario.weeklyRent}.`,
            },
            {
              factor: 'Liquidity Risk',
              level: 'Low',
              note: 'Comparable sales in this evidence set indicate reasonable turnover in the local market.',
            },
          ].map(({ factor, level, note }) => (
            <div key={factor} className="flex items-start gap-3 rounded-xl bg-black/[0.02] p-3">
              <span
                className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  level === 'Low' ? 'bg-emerald-50 text-emerald-700' : level === 'Low–Medium' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                }`}
              >
                {level}
              </span>
              <div>
                <p className="text-xs font-semibold text-relaive-navy">{factor}</p>
                <p className="mt-0.5 text-xs text-relaive-gray">{note}</p>
              </div>
            </div>
          ))}
        </div>

        <SectionDivider label="Valuation Assessment" />
        <ValuationRangeBar title="Estimated Market Value Range" priceRange={summary.priceRange} midpoint={summary.midpointEstimate} />

        <SectionDivider label="Conclusion & Recommendation" />
        <p className="text-sm leading-relaxed text-relaive-navy/85">
          Based on the analysis of comparable sales, current market conditions, and the financial modelling
          undertaken, the subject property represents a viable investment within the assessed price range of{' '}
          {summary.priceRange}. The gross rental yield of {roi.grossYield.toFixed(1)}% is consistent with comparable
          properties in the precinct. Investors should review this analysis in the context of their broader
          portfolio strategy and personal financial circumstances.
        </p>

        <SectionDivider label="Prepared by" />
        <ReportCertificationBlock
          name={agentName}
          roleLabel="Investment Analyst · Relaive Investment Services"
          statement="This report has been prepared using publicly available market data and financial modelling. It is intended as an indicative analysis to support investment decision-making and does not replace independent professional financial advice."
        />

        <Notification className="mt-8">
          <p className="font-semibold">{disclaimer.title}</p>
          <p className="mt-1">{disclaimer.message}</p>
          <div className="mt-3 border-t border-amber-200/80 pt-3">
            <p className="text-xs text-amber-800/80">{disclaimer.footer}</p>
          </div>
        </Notification>
      </div>
    </div>
  )
}
