import { useEffect, useState } from 'react'
import { Card, CardTitle } from '../../../../components/ui/card/card'
import { Input } from '../../../../components/ui/input/input'
import { StatCard } from '../../../../components/ui/stat-card/stat-card'
import { Notification } from '../../../../components/notification/notification'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getAppraisalSummary, getRoiDisclaimerNotification, setRoiResult } from '../../../../services/common'
import {
  calculateRoi,
  type RoiCalculationInput,
  type RoiCalculationResponse,
  type RoiReturnTone,
  type RoiSummaryTone,
} from '../../../../services/investor'
import { ChartTrendIcon } from './generate-report-icons'
import { StepActions } from './step-actions'

const INPUT_CLASS =
  '!border-relaive-primary/25 !bg-relaive-primary/[0.06] !text-relaive-navy [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

const DollarIcon = <span className="text-sm font-medium">$</span>
const PercentIcon = <span className="text-sm font-medium">%</span>
const YearsIcon = <span className="text-xs font-medium">Yrs</span>

const numberFormatter = new Intl.NumberFormat('en-AU', {
  maximumFractionDigits: 0,
})

function formatSignedCurrency(amount: number): string {
  const formatted = `$${numberFormatter.format(Math.abs(amount))}`
  return amount < 0 ? `-${formatted}` : formatted
}

function parseCurrency(value: string): number {
  const digits = value.replace(/[^\d]/g, '')
  const parsed = Number(digits)
  return Number.isFinite(parsed) ? parsed : 0
}

function summaryAmountClass(tone: RoiSummaryTone, amount: number): string {
  if (tone === 'green') return 'text-emerald-600'
  if (tone === 'red') return 'text-red-600'
  if (tone === 'net') return amount >= 0 ? 'text-emerald-600' : 'text-red-600'
  return 'text-relaive-navy'
}

function returnAmountClass(tone: RoiReturnTone): string {
  if (tone === 'green') return 'text-emerald-600'
  if (tone === 'red') return 'text-red-600'
  return 'text-relaive-navy'
}

type SummaryRowProps = {
  label: string
  value: string
  valueClassName: string
  emphasize?: boolean
  isLast?: boolean
}

function SummaryRow({ label, value, valueClassName, emphasize = false, isLast = false }: SummaryRowProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 py-3 ${
        isLast ? '' : 'border-b border-black/5'
      } ${emphasize ? 'border-t border-black/10 pt-4 font-semibold' : ''}`}
    >
      <span className={`text-sm ${emphasize ? 'text-relaive-navy' : 'text-relaive-gray'}`}>{label}</span>
      <span className={`shrink-0 text-sm tabular-nums ${valueClassName}`}>{value}</span>
    </div>
  )
}

type RoiAnalysisPanelProps = {
  onBack: () => void
  onContinue: () => void
}

type RoiFormState = RoiCalculationInput

const EMPTY_FORM: RoiFormState = {
  purchasePrice: 0,
  deposit: 0,
  interestRate: 0,
  loanTermYears: 0,
  weeklyRent: 0,
  vacancyAllowance: 0,
  managementFee: 0,
  councilRates: 0,
  landlordInsurance: 0,
  maintenance: 0,
  landTax: 0,
}

function numberField(value: number): number | '' {
  return value === 0 ? '' : value
}

export function RoiAnalysisPanel({ onBack, onContinue }: RoiAnalysisPanelProps) {
  const { data: disclaimer } = useAsyncData(getRoiDisclaimerNotification, [])
  const { data: appraisalSummary } = useAsyncData(getAppraisalSummary, [])

  const [form, setForm] = useState<RoiFormState>(EMPTY_FORM)
  const [hasPrefilledPrice, setHasPrefilledPrice] = useState(false)
  const [result, setResult] = useState<RoiCalculationResponse | null>(null)
  const [calculationError, setCalculationError] = useState<string | null>(null)

  useEffect(() => {
    if (hasPrefilledPrice || !appraisalSummary) return
    const estimated = parseCurrency(appraisalSummary.midpointEstimate)
    if (estimated > 0) {
      setForm((current) => ({ ...current, purchasePrice: estimated }))
    }
    setHasPrefilledPrice(true)
  }, [appraisalSummary, hasPrefilledPrice])

  useEffect(() => {
    let cancelled = false
    calculateRoi(form)
      .then((response) => {
        if (cancelled) return
        setResult(response)
        setCalculationError(null)
        setRoiResult({
          grossYieldPct: response.grossYieldPct,
          netYieldPct: response.netYieldPct,
          monthlyCashFlow: response.monthlyCashFlow,
          cashOnCashReturnPct: response.cashOnCashReturnPct,
        })
      })
      .catch((error: Error) => {
        if (cancelled) return
        setCalculationError(error.message || 'Failed to calculate ROI.')
      })
    return () => {
      cancelled = true
    }
  }, [form])

  function handleChange(field: keyof RoiFormState) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value)
      setForm((current) => ({ ...current, [field]: Number.isFinite(value) ? value : 0 }))
    }
  }

  if (calculationError) {
    return (
      <Card>
        <p className="text-sm text-red-600">Unable to calculate ROI: {calculationError}</p>
      </Card>
    )
  }

  if (!disclaimer || !result) {
    return (
      <Card>
        <p className="text-sm text-relaive-gray">Loading ROI analysis…</p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8FD4D8] to-relaive-secondary-hover text-white shadow-md shadow-relaive-secondary/30">
          <ChartTrendIcon />
        </span>
        <div>
          <CardTitle>ROI Analysis</CardTitle>
          <p className="mt-0.5 text-sm text-relaive-gray">Estimate rental return and cash flow</p>
        </div>
      </div>

      <div className="mt-6">
        <Notification>{disclaimer.message}</Notification>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[6fr_4fr]">
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-black/5 p-4 sm:p-5">
            <h4 className="text-sm font-semibold text-relaive-navy sm:text-base">Purchase Detail</h4>
            <div className="mt-4 flex flex-col gap-4">
              <Input
                id="roi-purchase-price"
                label="Purchase Price"
                type="number"
                min={0}
                step="any"
                value={numberField(form.purchasePrice)}
                onChange={handleChange('purchasePrice')}
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="roi-deposit"
                label="Deposit"
                type="number"
                min={0}
                step="any"
                value={numberField(form.deposit)}
                onChange={handleChange('deposit')}
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="roi-interest-rate"
                label="Interest Rate"
                type="number"
                min={0}
                step="any"
                value={numberField(form.interestRate)}
                onChange={handleChange('interestRate')}
                endIcon={PercentIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="roi-loan-term"
                label="Loan Term"
                type="number"
                min={0}
                step="any"
                value={numberField(form.loanTermYears)}
                onChange={handleChange('loanTermYears')}
                endIcon={YearsIcon}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 p-4 sm:p-5">
            <h4 className="text-sm font-semibold text-relaive-navy sm:text-base">Rental Income</h4>
            <div className="mt-4 flex flex-col gap-4">
              <Input
                id="roi-weekly-rent"
                label="Weekly Rent"
                type="number"
                min={0}
                step="any"
                value={numberField(form.weeklyRent)}
                onChange={handleChange('weeklyRent')}
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="roi-vacancy-allowance"
                label="Vacancy Allowance"
                type="number"
                min={0}
                step="any"
                value={numberField(form.vacancyAllowance)}
                onChange={handleChange('vacancyAllowance')}
                endIcon={PercentIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="roi-management-fee"
                label="Management Fee"
                type="number"
                min={0}
                step="any"
                value={numberField(form.managementFee)}
                onChange={handleChange('managementFee')}
                endIcon={PercentIcon}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 p-4 sm:p-5">
            <h4 className="text-sm font-semibold text-relaive-navy sm:text-base">Annual Expenses</h4>
            <div className="mt-4 flex flex-col gap-4">
              <Input
                id="roi-council-rates"
                label="Council Rates"
                type="number"
                min={0}
                step="any"
                value={numberField(form.councilRates)}
                onChange={handleChange('councilRates')}
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="roi-landlord-insurance"
                label="Landlord Insurance"
                type="number"
                min={0}
                step="any"
                value={numberField(form.landlordInsurance)}
                onChange={handleChange('landlordInsurance')}
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="roi-maintenance"
                label="Maintenance"
                type="number"
                min={0}
                step="any"
                value={numberField(form.maintenance)}
                onChange={handleChange('maintenance')}
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="roi-land-tax"
                label="Land Tax"
                type="number"
                min={0}
                step="any"
                value={numberField(form.landTax)}
                onChange={handleChange('landTax')}
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-black/5 p-4 sm:p-5">
            <h4 className="text-sm font-semibold text-relaive-navy sm:text-base">Annual Summary</h4>
            <div className="mt-2">
              {result.annualSummary.map((row, index) => {
                const isLast = index === result.annualSummary.length - 1
                const isNet = row.tone === 'net'
                return (
                  <SummaryRow
                    key={row.label}
                    label={row.label}
                    value={formatSignedCurrency(row.amount)}
                    valueClassName={`${summaryAmountClass(row.tone, row.amount)}${isNet ? ' font-semibold' : ''}`}
                    emphasize={isNet}
                    isLast={isLast}
                  />
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {result.metrics.map((metric) => (
              <StatCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                trend={metric.trend}
                tone={metric.tone}
                valueClassName="text-[22px] sm:text-[28px]"
              />
            ))}
          </div>

          <div className="rounded-2xl border border-black/5 p-4 sm:p-5">
            <h4 className="text-sm font-semibold text-relaive-navy sm:text-base">Investment Returns</h4>
            <div className="mt-2">
              {result.investmentReturns.map((row, index) => (
                <SummaryRow
                  key={row.label}
                  label={row.label}
                  value={row.display}
                  valueClassName={returnAmountClass(row.tone)}
                  isLast={index === result.investmentReturns.length - 1}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>

      <StepActions onBack={onBack} onContinue={onContinue} continueLabel="Next: Report Type >" />
    </Card>
  )
}
