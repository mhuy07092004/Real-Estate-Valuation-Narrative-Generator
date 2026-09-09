import { useEffect, useState } from 'react'
import { Card } from '../../../components/ui/card/card'
import { Input } from '../../../components/ui/input/input'
import { StatCard } from '../../../components/ui/stat-card/stat-card'
import { Notification } from '../../../components/notification/notification'
import { useAsyncData } from '../../../hooks/use-async-data'
import { getRoiDisclaimerNotification } from '../../../services/common'
import {
  calculateRoi,
  type RoiCalculationInput,
  type RoiCalculationResponse,
  type RoiReturnTone,
  type RoiSummaryTone,
} from '../../../services/investor'

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

export function RoiCalculation() {
  const { data: disclaimer } = useAsyncData(getRoiDisclaimerNotification, [])
  const [form, setForm] = useState<RoiFormState>(EMPTY_FORM)
  const [result, setResult] = useState<RoiCalculationResponse | null>(null)
  const [calculationError, setCalculationError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    calculateRoi(form)
      .then((response) => {
        if (cancelled) return
        setResult(response)
        setCalculationError(null)
      })
      .catch((error: Error) => {
        if (!cancelled) setCalculationError(error.message || 'Failed to calculate ROI.')
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
    return <div className="p-6 text-sm text-red-600 sm:p-8">Unable to calculate ROI: {calculationError}</div>
  }

  if (!result || !disclaimer) {
    return <div className="p-6 text-sm text-relaive-gray sm:p-8">Loading ROI calculator…</div>
  }

  return (
    <div className="flex flex-col">
      <header className="font-sans px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
          ROI & CASH FLOW CALCULATOR
        </h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">
          Analyze rental return, cash flow, and investment viability
        </p>
      </header>

      <form
        className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8"
        onSubmit={(event) => event.preventDefault()}
      >
        <Notification>{disclaimer.message}</Notification>

        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-[6fr_4fr]">
        <div className="flex flex-col gap-4 sm:gap-5">
          <Card>
            <h2 className="text-base font-semibold text-relaive-navy">Purchase Detail</h2>
            <div className="mt-5 flex flex-col gap-4">
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
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-relaive-navy">Rental Income</h2>
            <div className="mt-5 flex flex-col gap-4">
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
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-relaive-navy">Annual Expenses</h2>
            <div className="mt-5 flex flex-col gap-4">
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
          </Card>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <h2 className="text-base font-semibold text-relaive-navy">Annual Summary</h2>
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
          </Card>

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

          <Card>
            <h2 className="text-base font-semibold text-relaive-navy">Investment Returns</h2>
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
          </Card>
        </aside>
        </div>
      </form>
    </div>
  )
}
