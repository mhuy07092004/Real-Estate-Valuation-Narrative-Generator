import type { ReactNode } from 'react'
import { calculateAffordability, type AffordabilityInputs } from './use-affordability-calculator'

// Shared core for Affordability — used by both the generate-report wizard's Buyer step and
// the standalone Affordability Calculator page (§4.5). Same no-real-difference situation as
// RoiAnalysisView: figma's wizard step (StepAffordability) and standalone page
// (AffordabilityPage) render the same input/results layout — no compact/full variant.
// Pure client-side math, no backend calls. See figma-ui-migration-plan.md §10.2/§10.4.

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
  step,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  prefix?: string
  suffix?: string
  step?: number
}) {
  return (
    <div className="flex items-center justify-between border-b border-black/5 py-2.5 last:border-0">
      <label className="text-sm text-relaive-gray">{label}</label>
      <div className="flex items-center gap-1.5 rounded-xl bg-black/5 px-3 py-1.5">
        {prefix ? <span className="text-xs text-relaive-gray/70">{prefix}</span> : null}
        <input
          type="number"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          step={step ?? 1000}
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
      <div className="px-5">{children}</div>
    </div>
  )
}

const LEVEL_STYLES = {
  Comfortable: { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500' },
  Moderate: { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500' },
  Stretched: { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', bar: 'bg-red-500' },
} as const

function formatCapacity(value: number): string {
  return value >= 1000000 ? `$${(value / 1000000).toFixed(2)}M` : `$${Math.round(value / 1000)}K`
}

type AffordabilityViewProps = {
  inputs: AffordabilityInputs
  onInputsChange: (inputs: AffordabilityInputs) => void
}

export function AffordabilityView({ inputs, onInputsChange }: AffordabilityViewProps) {
  const results = calculateAffordability(inputs)
  const update = (key: keyof AffordabilityInputs) => (value: number) => onInputsChange({ ...inputs, [key]: value })
  const levelStyle = LEVEL_STYLES[results.affordabilityLevel]

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <InputCard title="Your Income">
          <InputRow label="Your Annual Income" value={inputs.annualIncome} onChange={update('annualIncome')} prefix="$" />
          <InputRow label="Partner's Annual Income" value={inputs.partnerIncome} onChange={update('partnerIncome')} prefix="$" />
        </InputCard>

        <InputCard title="Deposit &amp; Debts">
          <InputRow label="Available Deposit" value={inputs.deposit} onChange={update('deposit')} prefix="$" />
          <InputRow label="Existing Monthly Debt" value={inputs.existingDebt} onChange={update('existingDebt')} prefix="$" step={100} />
          <InputRow label="Monthly Living Expenses" value={inputs.monthlyExpenses} onChange={update('monthlyExpenses')} prefix="$" step={100} />
        </InputCard>

        <InputCard title="Loan Details">
          <InputRow label="Interest Rate" value={inputs.interestRate} onChange={update('interestRate')} suffix="%" step={0.25} />
          <InputRow label="Loan Term" value={inputs.loanTerm} onChange={update('loanTerm')} suffix="years" step={5} />
        </InputCard>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-[#102132] to-[#1C2A38] p-6 text-white">
          <p className="mb-1 text-sm text-white/60">Estimated Borrowing Capacity</p>
          <p className="mb-1 text-4xl font-bold text-white">{formatCapacity(results.borrowingCapacity)}</p>
          <p className="mb-5 text-xs text-white/50">Based on your income and a 30% debt service ratio</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/10 p-3">
              <p className="mb-0.5 text-xs text-white/60">Monthly Repayment</p>
              <p className="text-xl font-bold text-relaive-secondary">${Math.round(results.repaymentOnCapacity).toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="mb-0.5 text-xs text-white/60">Max Loan Amount</p>
              <p className="text-xl font-bold text-white">{formatCapacity(results.maxLoan)}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl border p-5 ${levelStyle.bg} ${levelStyle.border}`}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="mb-0.5 text-xs text-relaive-gray">Affordability Level</p>
              <p className={`text-lg font-bold ${levelStyle.text}`}>{results.affordabilityLevel}</p>
            </div>
            <div className="text-right">
              <p className="mb-0.5 text-xs text-relaive-gray">Repayment-to-Income</p>
              <p className={`text-lg font-bold ${levelStyle.text}`}>{results.repaymentToIncome.toFixed(0)}%</p>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/60">
            <div className={`h-full rounded-full ${levelStyle.bar}`} style={{ width: `${Math.min(results.repaymentToIncome, 100)}%` }} />
          </div>
          <p className="mt-2 text-xs text-relaive-gray">Ideal range: below 30% of gross monthly income</p>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 p-4">
          <span className="mt-0.5 shrink-0 text-amber-600">
            <AlertIcon />
          </span>
          <p className="text-xs leading-relaxed text-amber-800">
            These are estimates for indicative purposes only and do not constitute financial advice. Individual
            circumstances vary. Speak with a licensed mortgage broker or financial adviser before making any
            borrowing decisions.
          </p>
        </div>
      </div>
    </div>
  )
}
