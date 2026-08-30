import { useMemo, useState } from 'react'
import {
  DEFAULT_CAPITAL_GROWTH_INPUTS,
  computeAnnualCashFlow,
  computeCapitalGrowth,
  computeTaxEstimate,
  type CapitalGrowthInputs,
} from '../../../features/dashboard/components/investment-intelligence/use-capital-growth-calculator'

// Net-new v2 page — figma: InvestmentIntelligencePage.tsx (357 lines, 4 tabs: Calculator /
// Cash Flow / Portfolio / Risk). A prior planning pass wrongly wrote this whole page off as
// "a duplicate of ROICalculatorPage" (figma-ui-migration-plan.md §10.3 item 2 — corrected
// below). Only the Calculator tab even resembles the existing ROI Calculator, and even that
// tab uses a different model entirely (holding period + growth rate → exit value, IRR, NPV —
// none of which exist in `roi-analysis/use-roi-calculator.ts`, which models today's loan/cash
// flow, not a multi-year hold). The other three tabs have zero equivalent anywhere else in
// this app. See `use-capital-growth-calculator.ts` for the ported/reactive math.
//
// Portfolio tab: no real suburb-ranking/investment-tracking data source exists in this repo
// (checked `services/investor.ts`, `v2/services/common.ts` — only per-address market metrics
// exist, not a cross-suburb ranked dataset). Uses the prototype's static suburb list as
// illustrative placeholder content (not user-specific data) — logged in
// backend/V2_BACKEND_TODO.md (Investor section) as a net-new data source needed.
//
// Risk tab: in the prototype this tab is NOT derived from the Calculator tab's inputs (its
// risk-factor scores are a separate static array, independent of purchase price/growth
// rate/etc.) — ported as-is, same illustrative-content treatment as Portfolio.

type InvTab = 'calculator' | 'cashflow' | 'portfolio' | 'risk'

const TABS: { id: InvTab; label: string }[] = [
  { id: 'calculator', label: 'Calculator' },
  { id: 'cashflow', label: 'Cash Flow' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'risk', label: 'Risk Analysis' },
]

const PORTFOLIO_SUBURBS = [
  { name: 'Richmond VIC', invested: 1280000, currentValue: 1480000, yieldPct: 3.4, rank: 1 },
  { name: 'Surry Hills NSW', invested: 1500000, currentValue: 1720000, yieldPct: 3.1, rank: 2 },
  { name: 'South Yarra VIC', invested: 1800000, currentValue: 2040000, yieldPct: 2.8, rank: 3 },
  { name: 'Fortitude Valley QLD', invested: 620000, currentValue: 598000, yieldPct: 4.2, rank: 4 },
] as const

const RISK_FACTORS = [
  { label: 'Market Risk', score: 28, level: 'Low' },
  { label: 'Liquidity Risk', score: 35, level: 'Low' },
  { label: 'Interest Rate Risk', score: 52, level: 'Medium' },
  { label: 'Rental Vacancy Risk', score: 20, level: 'Very Low' },
  { label: 'Regulatory Risk', score: 30, level: 'Low' },
] as const

const POSITIVE_DRIVERS = ['Strong rental demand', 'Infrastructure investment', 'Population growth', 'Limited supply pipeline']
const RISK_MITIGANTS = ['Geographic diversification', 'Long-term hold strategy', 'High-quality tenants', 'Low LVR positions']

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  return `$${(value / 1000).toFixed(0)}K`
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(value)
}

function formatSigned(value: number): string {
  const formatted = formatCurrency(Math.abs(value))
  return value >= 0 ? `+${formatted}` : `-${formatted}`
}

function riskTone(score: number): { text: string; bar: string } {
  if (score < 30) return { text: 'text-relaive-secondary', bar: 'bg-relaive-secondary' }
  if (score < 50) return { text: 'text-relaive-primary', bar: 'bg-relaive-primary' }
  return { text: 'text-amber-500', bar: 'bg-amber-400' }
}

function ParameterSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  display,
}: {
  label: string
  value: number
  onChange: (next: number) => void
  min: number
  max: number
  step: number
  display: string
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between">
        <label className="text-sm text-relaive-navy">{label}</label>
        <span className="text-sm font-semibold text-relaive-primary">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-relaive-primary/10 accent-relaive-primary"
      />
    </div>
  )
}

function CalculatorTab({ inputs, onChange }: { inputs: CapitalGrowthInputs; onChange: (next: CapitalGrowthInputs) => void }) {
  const result = useMemo(() => computeCapitalGrowth(inputs), [inputs])

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-5 rounded-2xl border border-black/5 bg-white p-6">
        <h3 className="text-base font-medium text-relaive-navy">Investment Parameters</h3>
        <ParameterSlider
          label="Purchase Price"
          value={inputs.purchasePrice}
          onChange={(purchasePrice) => onChange({ ...inputs, purchasePrice })}
          min={200000}
          max={5000000}
          step={10000}
          display={`$${inputs.purchasePrice.toLocaleString()}`}
        />
        <ParameterSlider
          label="Weekly Rental Income"
          value={inputs.weeklyRent}
          onChange={(weeklyRent) => onChange({ ...inputs, weeklyRent })}
          min={200}
          max={5000}
          step={50}
          display={`$${inputs.weeklyRent.toLocaleString()}`}
        />
        <ParameterSlider
          label="Holding Period (years)"
          value={inputs.holdingYears}
          onChange={(holdingYears) => onChange({ ...inputs, holdingYears })}
          min={1}
          max={20}
          step={1}
          display={String(inputs.holdingYears)}
        />
        <ParameterSlider
          label="Annual Growth Rate (%)"
          value={inputs.growthRate}
          onChange={(growthRate) => onChange({ ...inputs, growthRate })}
          min={0}
          max={20}
          step={0.5}
          display={`${inputs.growthRate}%`}
        />
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-relaive-navy to-[#1C2A38] p-6 text-white">
          <h3 className="mb-5 text-sm text-white/60">Projected Returns</h3>
          <div className="space-y-4">
            {[
              { label: 'Projected Property Value', value: formatCompact(result.projectedValue) },
              { label: 'Capital Growth', value: formatCompact(result.capitalGrowth) },
              { label: 'Total Rental Income', value: formatCompact(result.totalRentalIncome) },
              { label: 'Gross Rental Yield', value: `${result.grossYield.toFixed(2)}% p.a.` },
              { label: 'Total Return', value: `${result.totalReturn.toFixed(1)}%`, highlight: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0">
                <span className="text-sm text-white/70">{item.label}</span>
                <span className={item.highlight ? 'text-lg font-semibold text-relaive-secondary' : 'text-sm font-semibold text-white'}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-5">
          <h3 className="mb-4 text-sm font-medium text-relaive-navy">Additional Metrics</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'IRR (est.)', value: `${result.irrEstimate.toFixed(1)}%` },
              { label: `NPV (${'7'}% disc.)`, value: formatCompact(result.npv) },
              { label: 'Cash-on-Cash', value: `${result.cashOnCash.toFixed(1)}%` },
              { label: 'Holding Cost', value: `${formatCompact(result.holdingCostAnnual)}/yr` },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-relaive-primary/5 p-3">
                <div className="mb-1 text-xs text-relaive-gray">{item.label}</div>
                <div className="text-sm font-semibold text-relaive-primary">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-relaive-primary/10 bg-gradient-to-br from-relaive-primary/5 to-relaive-secondary/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-medium text-relaive-navy">AI Recommendation</span>
          </div>
          <p className="text-sm text-relaive-navy/80">
            Based on current parameters, this investment shows{' '}
            <strong className="text-relaive-secondary">{result.totalReturn >= 50 ? 'strong' : result.totalReturn >= 20 ? 'moderate' : 'modest'}</strong>{' '}
            fundamentals over a {inputs.holdingYears}-year hold. A lower entry price below{' '}
            {formatCompact(inputs.purchasePrice * 0.97)} would improve gross yield to{' '}
            {(((inputs.weeklyRent * 52) / (inputs.purchasePrice * 0.97)) * 100).toFixed(2)}%.
          </p>
        </div>
      </div>
    </div>
  )
}

function CashFlowTab({ inputs }: { inputs: CapitalGrowthInputs }) {
  const cashFlow = useMemo(() => computeAnnualCashFlow(inputs), [inputs])
  const tax = useMemo(() => computeTaxEstimate(inputs, cashFlow), [inputs, cashFlow])

  const rows = [
    { label: 'Gross Rental Income', value: cashFlow.grossRentalIncome },
    { label: 'Property Management (8%)', value: cashFlow.propertyManagement },
    { label: 'Mortgage Repayment (est.)', value: cashFlow.mortgageRepayment },
    { label: 'Council Rates', value: cashFlow.councilRates },
    { label: 'Insurance', value: cashFlow.insurance },
    { label: 'Maintenance (1%)', value: cashFlow.maintenance },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="rounded-2xl border border-black/5 bg-white p-6 md:col-span-2">
        <h3 className="mb-6 text-base font-medium text-relaive-navy">Annual Cash Flow Projection</h3>
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-xl bg-relaive-primary/5 p-3">
              <span className="text-sm text-relaive-navy">{row.label}</span>
              <span className={`text-sm font-semibold ${row.value >= 0 ? 'text-relaive-secondary' : 'text-relaive-primary'}`}>
                {formatSigned(row.value)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-xl border border-relaive-primary/20 bg-gradient-to-r from-relaive-primary/10 to-relaive-secondary/10 p-4">
            <span className="text-sm font-semibold text-relaive-navy">Net Cash Flow</span>
            <span className="text-lg font-semibold text-relaive-secondary">{formatSigned(cashFlow.netCashFlow)} / year</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-5">
        <h3 className="mb-4 text-sm font-medium text-relaive-navy">Tax Estimate</h3>
        <div className="space-y-3">
          {[
            { label: 'Rental Income Tax', value: tax.rentalIncomeTax },
            { label: 'Negative Gearing Benefit', value: -tax.negativeGearingBenefit },
            { label: 'Depreciation Claims', value: -tax.depreciationClaims },
            { label: 'Net Tax Estimate', value: tax.netTaxEstimate },
          ].map((item) => (
            <div key={item.label} className="flex justify-between text-sm">
              <span className="text-relaive-gray">{item.label}</span>
              <span className="font-medium text-relaive-navy">{formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PortfolioTab() {
  return (
    <div className="space-y-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-medium text-relaive-navy">Portfolio Comparison</h3>
        <span className="text-xs text-relaive-gray">Investment ranking by AI score — illustrative sample data</span>
      </div>
      {PORTFOLIO_SUBURBS.map((suburb) => {
        const roiPct = ((suburb.currentValue - suburb.invested) / suburb.invested) * 100
        const up = roiPct >= 0
        return (
          <div
            key={suburb.name}
            className="rounded-2xl border border-black/5 bg-white p-5 transition-all hover:border-relaive-primary/25 hover:shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
                  suburb.rank === 1 ? 'bg-gradient-to-br from-relaive-primary to-relaive-secondary text-white' : 'bg-relaive-primary/10 text-relaive-primary'
                }`}
              >
                #{suburb.rank}
              </div>
              <div className="flex-grow">
                <h3 className="mb-1 text-sm font-medium text-relaive-navy">{suburb.name}</h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-relaive-gray">
                  <span>Invested: {formatCompact(suburb.invested)}</span>
                  <span>Current: {formatCompact(suburb.currentValue)}</span>
                  <span>Yield: {suburb.yieldPct}%</span>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-semibold ${up ? 'text-relaive-secondary' : 'text-red-500'}`}>
                  {up ? '+' : ''}
                  {roiPct.toFixed(1)}%
                </div>
                <div className="text-xs text-relaive-gray">Total Return</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RiskTab() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-black/5 bg-white p-6">
        <h3 className="mb-5 text-base font-medium text-relaive-navy">Risk Assessment</h3>
        <div className="space-y-4">
          {RISK_FACTORS.map((item) => {
            const tone = riskTone(item.score)
            return (
              <div key={item.label}>
                <div className="mb-1.5 flex justify-between">
                  <span className="text-sm text-relaive-navy">{item.label}</span>
                  <span className={`text-xs font-medium ${tone.text}`}>{item.level}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-relaive-primary/10">
                  <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${item.score}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-relaive-primary/10 bg-gradient-to-br from-relaive-primary/5 to-relaive-secondary/5 p-5">
          <span className="text-sm font-medium text-relaive-navy">AI Risk Summary</span>
          <div className="mb-2 mt-2 text-4xl font-semibold text-relaive-secondary">Low Risk</div>
          <p className="text-sm text-relaive-navy/70">
            Overall portfolio risk is well-managed. Key exposure is to interest rate movements. Diversification across
            states reduces concentration risk significantly.
          </p>
        </div>

        {[
          { label: 'Positive Drivers', items: POSITIVE_DRIVERS },
          { label: 'Risk Mitigants', items: RISK_MITIGANTS },
        ].map((section) => (
          <div key={section.label} className="rounded-2xl border border-black/5 bg-white p-5">
            <h4 className="mb-3 text-sm font-medium text-relaive-navy">{section.label}</h4>
            <div className="space-y-2">
              {section.items.map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-relaive-navy/70">
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-relaive-secondary" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function InvestmentIntelligencePageV2() {
  const [activeTab, setActiveTab] = useState<InvTab>('calculator')
  const [inputs, setInputs] = useState<CapitalGrowthInputs>(DEFAULT_CAPITAL_GROWTH_INPUTS)

  const snapshot = useMemo(() => {
    const totalInvested = PORTFOLIO_SUBURBS.reduce((sum, s) => sum + s.invested, 0)
    const totalCurrent = PORTFOLIO_SUBURBS.reduce((sum, s) => sum + s.currentValue, 0)
    const avgYield = PORTFOLIO_SUBURBS.reduce((sum, s) => sum + s.yieldPct, 0) / PORTFOLIO_SUBURBS.length
    const portfolioRoi = ((totalCurrent - totalInvested) / totalInvested) * 100
    return { totalCurrent, avgYield, portfolioRoi }
  }, [])

  return (
    <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-relaive-navy sm:text-[28px]">Investment Intelligence</h1>
        <p className="mt-1 text-sm text-relaive-gray sm:text-base">ROI modelling, cash flow projections, and portfolio analysis</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Portfolio ROI', value: `${snapshot.portfolioRoi >= 0 ? '+' : ''}${snapshot.portfolioRoi.toFixed(1)}%` },
          { label: 'Total Value', value: formatCompact(snapshot.totalCurrent) },
          { label: 'Avg Yield', value: `${snapshot.avgYield.toFixed(1)}%` },
          { label: 'Risk Score', value: 'Low' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-black/5 bg-white p-5">
            <div className="text-2xl font-semibold text-relaive-navy">{stat.value}</div>
            <div className="mt-0.5 text-xs text-relaive-gray">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 border-b border-black/5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`-mb-px border-b-2 px-5 py-3 text-sm transition-all ${
              activeTab === tab.id ? 'border-relaive-primary text-relaive-primary' : 'border-transparent text-relaive-gray hover:text-relaive-navy'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'calculator' ? <CalculatorTab inputs={inputs} onChange={setInputs} /> : null}
      {activeTab === 'cashflow' ? <CashFlowTab inputs={inputs} /> : null}
      {activeTab === 'portfolio' ? <PortfolioTab /> : null}
      {activeTab === 'risk' ? <RiskTab /> : null}
    </div>
  )
}
