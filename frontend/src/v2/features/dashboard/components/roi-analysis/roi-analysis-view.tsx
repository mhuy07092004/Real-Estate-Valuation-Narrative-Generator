import { useState, type ReactNode } from 'react'
import { calculateRoi, type RoiScenario } from './use-roi-calculator'

// Shared core for ROI Analysis — used by both the generate-report wizard's Investor step
// and the standalone ROI Calculator page (§4.5). Figma has no real layout difference
// between the wizard step (StepROI) and the standalone page (ROICalculatorPage) beyond
// page chrome — both wrap the exact same input/results grid — so this core doesn't take
// a compact/full variant prop; the wrapper components (roi-analysis-panel.tsx, the
// standalone page) differ only in title/back-continue chrome around this same content.
// See figma-ui-migration-plan.md §10.2. Pure client-side math, no backend calls.

function TrendingUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 19h16M6 16l4-5 3 3 5-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 7h3v3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="16" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

function InputRow({
  label,
  value,
  onChange,
  prefix,
  suffix,
  min,
  max,
  step,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  prefix?: string
  suffix?: string
  min?: number
  max?: number
  step?: number
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <label className="text-sm text-relaive-gray">{label}</label>
      <div className="flex items-center gap-1 rounded-xl bg-black/5 px-3 py-1.5">
        {prefix ? <span className="text-xs text-relaive-gray/70">{prefix}</span> : null}
        <input
          type="number"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          min={min}
          max={max}
          step={step ?? 1}
          className="w-24 bg-transparent text-right text-sm font-medium text-relaive-navy focus:outline-none"
        />
        {suffix ? <span className="text-xs text-relaive-gray/70">{suffix}</span> : null}
      </div>
    </div>
  )
}

function InputCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
      <div className="border-b border-black/5 bg-black/[0.02] px-5 py-3.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-relaive-gray">{title}</p>
      </div>
      <div className="divide-y divide-black/5 px-5">{children}</div>
    </div>
  )
}

type RoiAnalysisViewProps = {
  scenario: RoiScenario
  onScenarioChange: (scenario: RoiScenario) => void
}

export function RoiAnalysisView({ scenario, onScenarioChange }: RoiAnalysisViewProps) {
  const [showExpenses, setShowExpenses] = useState(true)
  const result = calculateRoi(scenario)
  const update = (key: keyof RoiScenario) => (value: number) => onScenarioChange({ ...scenario, [key]: value })

  const annualRent = scenario.weeklyRent * 52 * (1 - scenario.vacancyRate / 100)
  const annualManagementFees = (annualRent * scenario.managementFee) / 100
  const annualOperatingExpenses = scenario.councilRates + scenario.insurance + scenario.maintenance + scenario.landTax + scenario.otherCosts

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <InputCard title="Purchase Details">
          <InputRow label="Purchase Price" value={scenario.purchasePrice} onChange={update('purchasePrice')} prefix="$" step={5000} />
          <InputRow label="Deposit" value={scenario.deposit} onChange={update('deposit')} prefix="$" step={5000} />
          <InputRow label="Interest Rate" value={scenario.interestRate} onChange={update('interestRate')} suffix="%" step={0.05} min={1} max={15} />
          <InputRow label="Loan Term" value={scenario.loanTerm} onChange={update('loanTerm')} suffix="years" min={10} max={30} />
        </InputCard>

        <InputCard title="Rental Income">
          <InputRow label="Weekly Rent" value={scenario.weeklyRent} onChange={update('weeklyRent')} prefix="$" step={10} />
          <InputRow label="Vacancy Allowance" value={scenario.vacancyRate} onChange={update('vacancyRate')} suffix="%" step={0.5} min={0} max={20} />
          <InputRow label="Management Fee" value={scenario.managementFee} onChange={update('managementFee')} suffix="%" step={0.5} min={0} max={15} />
        </InputCard>

        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
          <button
            type="button"
            onClick={() => setShowExpenses((open) => !open)}
            className="flex w-full items-center justify-between border-b border-black/5 bg-black/[0.02] px-5 py-3.5"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-relaive-gray">Annual Expenses</p>
            {showExpenses ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </button>
          {showExpenses ? (
            <div className="divide-y divide-black/5 px-5">
              <InputRow label="Council Rates" value={scenario.councilRates} onChange={update('councilRates')} prefix="$" step={50} />
              <InputRow label="Landlord Insurance" value={scenario.insurance} onChange={update('insurance')} prefix="$" step={50} />
              <InputRow label="Maintenance" value={scenario.maintenance} onChange={update('maintenance')} prefix="$" step={100} />
              <InputRow label="Land Tax" value={scenario.landTax} onChange={update('landTax')} prefix="$" step={100} />
              <InputRow label="Other Costs" value={scenario.otherCosts} onChange={update('otherCosts')} prefix="$" step={50} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-[#102132] to-[#1C2A38] p-6 text-white">
          <div className="mb-5 flex items-center gap-2">
            <span className="text-relaive-secondary">
              <TrendingUpIcon />
            </span>
            <span className="text-sm font-semibold text-white/80">Investment Returns</span>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="mb-0.5 text-xs text-white/50">Gross Yield</p>
              <p className="text-3xl font-bold text-relaive-secondary">{result.grossYield.toFixed(1)}%</p>
            </div>
            <div>
              <p className="mb-0.5 text-xs text-white/50">Net Yield</p>
              <p className="text-3xl font-bold text-white">{result.netYield.toFixed(1)}%</p>
            </div>
            <div>
              <p className="mb-0.5 text-xs text-white/50">Monthly Cash Flow</p>
              <p className={`text-2xl font-bold ${result.monthlyCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {result.monthlyCashFlow >= 0 ? '+' : ''}${Math.abs(result.monthlyCashFlow).toFixed(0)}/mo
              </p>
            </div>
            <div>
              <p className="mb-0.5 text-xs text-white/50">Cash-on-Cash Return</p>
              <p className={`text-2xl font-bold ${result.cashOnCash >= 0 ? 'text-amber-300' : 'text-red-400'}`}>{result.cashOnCash.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
          <div className="border-b border-black/5 px-5 py-3.5">
            <p className="text-sm font-semibold text-relaive-navy">Annual Summary</p>
          </div>
          <div className="divide-y divide-black/5 px-5">
            {[
              { label: 'Annual Rental Income', value: `$${annualRent.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, type: 'income' as const },
              { label: 'Annual Mortgage Repayments', value: `-$${(result.monthlyRepayment * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, type: 'expense' as const },
              { label: 'Annual Operating Expenses', value: `-$${annualOperatingExpenses.toLocaleString()}`, type: 'expense' as const },
              { label: 'Management Fees', value: `-$${annualManagementFees.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, type: 'expense' as const },
              {
                label: 'Net Annual Cash Flow',
                value: `${result.annualCashFlow >= 0 ? '+' : ''}$${Math.abs(result.annualCashFlow).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                type: 'total' as const,
              },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-3">
                <span className={`text-sm ${row.type === 'total' ? 'font-semibold text-relaive-navy' : 'text-relaive-gray'}`}>{row.label}</span>
                <span
                  className={`text-sm font-semibold ${
                    row.type === 'income'
                      ? 'text-emerald-600'
                      : row.type === 'expense'
                        ? 'text-relaive-gray'
                        : result.annualCashFlow >= 0
                          ? 'text-emerald-600'
                          : 'text-red-500'
                  }`}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <p className="mb-1 text-xs text-relaive-gray">Loan Amount</p>
            <p className="text-lg font-semibold text-relaive-navy">${result.loanAmount.toLocaleString()}</p>
            <p className="text-xs text-relaive-gray/70">Monthly repayment: ${result.monthlyRepayment.toFixed(0)}</p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <p className="mb-1 text-xs text-relaive-gray">Break-even Rent</p>
            <p className="text-lg font-semibold text-relaive-navy">${result.breakEvenRent}/wk</p>
            <p className="text-xs text-relaive-gray/70">Current: ${scenario.weeklyRent}/wk</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 p-4">
          <span className="mt-0.5 shrink-0 text-amber-600">
            <AlertIcon />
          </span>
          <p className="text-xs leading-relaxed text-amber-800">
            These calculations are estimates for indicative purposes only. They do not constitute financial advice.
            Consult a qualified financial adviser before making investment decisions.
          </p>
        </div>
      </div>
    </div>
  )
}
