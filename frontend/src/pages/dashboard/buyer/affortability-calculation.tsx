import { Button } from '../../../components/ui/button/button'
import { Card } from '../../../components/ui/card/card'
import { Input } from '../../../components/ui/input/input'
import { StatCard } from '../../../components/ui/stat-card/stat-card'
import { Notification } from '../../../components/notification/notification'
import { useAsyncData } from '../../../hooks/use-async-data'
import { getAffordabilityDisclaimerNotification } from '../../../services/common'
import {
  getAffordabilityCalculationMockData,
  type AffordabilitySummaryValueTone,
} from '../../../services/buyer'

const INPUT_CLASS =
  '!border-relaive-primary/25 !bg-relaive-primary/[0.06] !text-relaive-navy [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

const DollarIcon = <span className="text-sm font-medium">$</span>

function summaryValueClass(tone?: AffordabilitySummaryValueTone): string {
  if (tone === 'orange') return 'text-orange-500'
  if (tone === 'green') return 'text-emerald-600'
  if (tone === 'red') return 'text-red-600'
  return 'text-relaive-navy'
}

const METRIC_VALUE_CLASS = 'text-[22px] sm:text-[28px] text-relaive-navy'

type SummaryRowProps = {
  label: string
  value: string
  valueClassName: string
  isLast?: boolean
}

function SummaryRow({ label, value, valueClassName, isLast = false }: SummaryRowProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 py-3 ${
        isLast ? '' : 'border-b border-black/5'
      }`}
    >
      <span className="text-sm text-relaive-gray">{label}</span>
      <span className={`shrink-0 text-sm tabular-nums font-medium ${valueClassName}`}>{value}</span>
    </div>
  )
}

export function AffordabilityCalculation() {
  const { data } = useAsyncData(getAffordabilityCalculationMockData, [])
  const { data: disclaimer } = useAsyncData(getAffordabilityDisclaimerNotification, [])

  if (!data || !disclaimer) {
    return <div className="p-6 text-sm text-relaive-gray sm:p-8">Loading affordability calculator…</div>
  }

  const [borrowingCapacity, ...loanMetrics] = data.metrics

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
            <h2 className="text-base font-semibold text-relaive-navy">Your Income</h2>
            <div className="mt-5 flex flex-col gap-4">
              <Input
                id="affordability-your-annual-income"
                label="Your Annual Income"
                type="number"
                min={0}
                step="any"
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="affordability-partner-annual-income"
                label="Partner's Annual Income"
                type="number"
                min={0}
                step="any"
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
            </div>
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-relaive-navy">Deposit &amp; Dept</h2>
            <div className="mt-5 flex flex-col gap-4">
              <Input
                id="affordability-available-deposit"
                label="Available Deposit"
                type="number"
                min={0}
                step="any"
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="affordability-existing-monthly-debt"
                label="Existing Monthly Debt"
                type="number"
                min={0}
                step="any"
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="affordability-monthly-living-expenses"
                label="Monthly Living Expenses"
                type="number"
                min={0}
                step="any"
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
            </div>
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-relaive-navy">Loan Details</h2>
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
            </div>
          </Card>

          <Button type="submit" variant="primary" className="w-fit">
            Calculate
          </Button>
        </div>

        <aside className="flex w-full min-w-0 flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <StatCard
            className="w-full"
            label={borrowingCapacity.label}
            value={borrowingCapacity.value}
            trend={borrowingCapacity.trend}
            tone={borrowingCapacity.tone}
            valueClassName={borrowingCapacity.valueClassName ?? METRIC_VALUE_CLASS}
          />
          <div className="grid grid-cols-2 gap-3">
            {loanMetrics.map((metric) => (
              <StatCard
                key={metric.label}
                className="min-w-0"
                label={metric.label}
                value={metric.value}
                trend={metric.trend}
                tone={metric.tone}
                valueClassName={metric.valueClassName ?? METRIC_VALUE_CLASS}
              />
            ))}
          </div>

          <Card className="w-full">
            <h2 className="text-base font-semibold text-relaive-navy">Summary</h2>
            <div className="mt-2">
              {data.summary.map((row, index) => (
                <SummaryRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  valueClassName={summaryValueClass(row.valueTone)}
                  isLast={index === data.summary.length - 1}
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
