import { Card, CardTitle } from '../../../../components/ui/card/card'
import { Input } from '../../../../components/ui/input/input'
import { Notification } from '../../../../components/notification/notification'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getAffordabilityDisclaimerNotification } from '../../../../services/common'
import {
  getAffordabilityCalculationMockData,
  type AffordabilitySummaryValueTone,
} from '../../../../services/buyer'
import { HouseOutlineIcon } from './generate-report-icons'
import { StepActions } from './step-actions'

const INPUT_CLASS =
  '!border-relaive-primary/25 !bg-relaive-primary/[0.06] !text-relaive-navy [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

const DollarIcon = <span className="text-sm font-medium">$</span>
const PercentIcon = <span className="text-sm font-medium">%</span>
const YearsIcon = <span className="text-xs font-medium">Yrs</span>

function levelTextClass(tone?: AffordabilitySummaryValueTone): string {
  if (tone === 'orange') return 'text-orange-500'
  if (tone === 'green') return 'text-emerald-600'
  if (tone === 'red') return 'text-red-600'
  return 'text-relaive-navy'
}

function levelBarClass(tone?: AffordabilitySummaryValueTone): string {
  if (tone === 'orange') return 'bg-orange-400'
  if (tone === 'green') return 'bg-emerald-500'
  if (tone === 'red') return 'bg-red-500'
  return 'bg-relaive-primary'
}

function parsePercent(value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 100) : 0
}

type AffordabilityPanelProps = {
  onBack: () => void
  onContinue: () => void
}

export function AffordabilityPanel({ onBack, onContinue }: AffordabilityPanelProps) {
  const { data } = useAsyncData(getAffordabilityCalculationMockData, [])
  const { data: disclaimer } = useAsyncData(getAffordabilityDisclaimerNotification, [])

  if (!data || !disclaimer) {
    return (
      <Card>
        <p className="text-sm text-relaive-gray">Loading affordability…</p>
      </Card>
    )
  }

  const [borrowingCapacity, maxLoanAmount, monthlyRepayment] = data.metrics
  const levelRow = data.summary.find((row) => row.label === 'AFFORDABILITY')
  const repaymentRow = data.summary.find((row) => row.label === 'Repayment-to-income')
  const idealRangeRow = data.summary.find((row) => row.label === 'Ideal Range')
  const repaymentPercent = repaymentRow ? parsePercent(repaymentRow.value) : 0

  return (
    <Card>
      <div className="flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8FD4D8] to-relaive-secondary-hover text-white shadow-md shadow-relaive-secondary/30">
          <HouseOutlineIcon size={20} />
        </span>
        <div>
          <CardTitle>Affordability</CardTitle>
          <p className="mt-0.5 text-sm text-relaive-gray">
            Model your borrowing capacity — results will be included in your report
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[6fr_4fr]">
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-black/5 p-4 sm:p-5">
            <h4 className="text-sm font-semibold text-relaive-navy sm:text-base">Your Income</h4>
            <div className="mt-4 flex flex-col gap-4">
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
          </div>

          <div className="rounded-2xl border border-black/5 p-4 sm:p-5">
            <h4 className="text-sm font-semibold text-relaive-navy sm:text-base">Deposit &amp; Debts</h4>
            <div className="mt-4 flex flex-col gap-4">
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
          </div>

          <div className="rounded-2xl border border-black/5 p-4 sm:p-5">
            <h4 className="text-sm font-semibold text-relaive-navy sm:text-base">Loan Details</h4>
            <div className="mt-4 flex flex-col gap-4">
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
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl bg-relaive-navy px-5 py-5 text-white sm:px-6 sm:py-6">
            <p className="text-sm text-white/80">Estimated Borrowing Capacity</p>
            <p className="mt-1 text-3xl font-bold tracking-tight sm:text-[34px]">
              {borrowingCapacity?.value}
            </p>
            <p className="mt-1 text-xs text-white/70 sm:text-sm">
              Based on your income and a 30% debt service ratio
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {monthlyRepayment ? (
                <div className="rounded-xl bg-white/10 px-3 py-3">
                  <p className="text-xs text-white/70">{monthlyRepayment.label}</p>
                  <p className="mt-1 text-lg font-semibold text-relaive-secondary sm:text-xl">
                    {monthlyRepayment.value}
                  </p>
                </div>
              ) : null}
              {maxLoanAmount ? (
                <div className="rounded-xl bg-white/10 px-3 py-3">
                  <p className="text-xs text-white/70">{maxLoanAmount.label}</p>
                  <p className="mt-1 text-lg font-semibold sm:text-xl">{maxLoanAmount.value}</p>
                </div>
              ) : null}
            </div>
          </div>

          {levelRow || repaymentRow ? (
            <div className="rounded-2xl border border-black/5 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-relaive-gray">Affordability Level</span>
                <span className="text-xs font-medium text-relaive-gray">Repayment-to-Income</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <span className={`text-xl font-bold sm:text-2xl ${levelTextClass(levelRow?.valueTone)}`}>
                  {levelRow?.value ?? '—'}
                </span>
                <span className={`text-xl font-bold sm:text-2xl ${levelTextClass(repaymentRow?.valueTone)}`}>
                  {repaymentRow?.value ?? '—'}
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${levelBarClass(repaymentRow?.valueTone)}`}
                  style={{ width: `${repaymentPercent}%` }}
                />
              </div>
              {idealRangeRow ? (
                <p className="mt-3 text-xs text-relaive-gray">
                  Ideal range: {idealRangeRow.value} of gross monthly income
                </p>
              ) : null}
            </div>
          ) : null}

          <Notification>{disclaimer.message}</Notification>
        </aside>
      </div>

      <StepActions onBack={onBack} onContinue={onContinue} continueLabel="Next: Report Type >" />
    </Card>
  )
}
