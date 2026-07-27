import { Button } from '../../../components/ui/button/button'
import { Card } from '../../../components/ui/card/card'
import { Input } from '../../../components/ui/input/input'
import { StatCard } from '../../../components/ui/stat-card/stat-card'
import { Notification } from '../../../components/notification/notification'
import { getAffordabilityDisclaimerNotification } from '../../../services/mock-common'
import {
  getAffordabilityCalculationMockData,
  type AffordabilityReturnTone,
  type AffordabilitySummaryTone,
} from '../../../services/mock-buyer'

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

function summaryAmountClass(tone: AffordabilitySummaryTone, amount: number): string {
  if (tone === 'green') return 'text-emerald-600'
  if (tone === 'red') return 'text-red-600'
  if (tone === 'net') return amount >= 0 ? 'text-emerald-600' : 'text-red-600'
  return 'text-relaive-navy'
}

function returnAmountClass(tone: AffordabilityReturnTone): string {
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

export function AffordabilityCalculation() {
  const data = getAffordabilityCalculationMockData()
  const disclaimer = getAffordabilityDisclaimerNotification()

  return (
    <div className="flex flex-col">
      <header className="font-sans px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
          AFFORDABILITY CALCULATOR
        </h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">
          Estimate borrowing capacity and purchase affordability
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
                id="affordability-purchase-price"
                label="Purchase Price"
                type="number"
                min={0}
                step="any"
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="affordability-deposit"
                label="Deposit"
                type="number"
                min={0}
                step="any"
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="affordability-interest-rate"
                label="Interest Rate"
                type="number"
                min={0}
                step="any"
                endIcon={PercentIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="affordability-loan-term"
                label="Loan Term"
                type="number"
                min={0}
                step="any"
                endIcon={YearsIcon}
                className={INPUT_CLASS}
              />
            </div>
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-relaive-navy">Rental Income</h2>
            <div className="mt-5 flex flex-col gap-4">
              <Input
                id="affordability-weekly-rent"
                label="Weekly Rent"
                type="number"
                min={0}
                step="any"
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="affordability-vacancy-allowance"
                label="Vacancy Allowance"
                type="number"
                min={0}
                step="any"
                endIcon={PercentIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="affordability-management-fee"
                label="Management Fee"
                type="number"
                min={0}
                step="any"
                endIcon={PercentIcon}
                className={INPUT_CLASS}
              />
            </div>
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-relaive-navy">Annual Expenses</h2>
            <div className="mt-5 flex flex-col gap-4">
              <Input
                id="affordability-council-rates"
                label="Council Rates"
                type="number"
                min={0}
                step="any"
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="affordability-landlord-insurance"
                label="Landlord Insurance"
                type="number"
                min={0}
                step="any"
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="affordability-maintenance"
                label="Maintenance"
                type="number"
                min={0}
                step="any"
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="affordability-land-tax"
                label="Land Tax"
                type="number"
                min={0}
                step="any"
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
            </div>
          </Card>

          <Button type="submit" variant="primary" className="w-fit">
            Calculate
          </Button>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <h2 className="text-base font-semibold text-relaive-navy">Annual Summary</h2>
            <div className="mt-2">
              {data.annualSummary.map((row, index) => {
                const isLast = index === data.annualSummary.length - 1
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
            {data.metrics.map((metric) => (
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
              {data.investmentReturns.map((row, index) => (
                <SummaryRow
                  key={row.label}
                  label={row.label}
                  value={row.display}
                  valueClassName={returnAmountClass(row.tone)}
                  isLast={index === data.investmentReturns.length - 1}
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
