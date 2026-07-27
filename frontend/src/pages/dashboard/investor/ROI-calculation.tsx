import { Button } from '../../../components/ui/button/button'
import { Card } from '../../../components/ui/card/card'
import { Input } from '../../../components/ui/input/input'

const INPUT_CLASS = '!border-relaive-primary/25 !bg-relaive-primary/[0.06] !text-relaive-navy'

const DollarIcon = <span className="text-sm font-medium">$</span>
const PercentIcon = <span className="text-sm font-medium">%</span>
const YearsIcon = <span className="text-xs font-medium">Yrs</span>

export function RoiCalculation() {
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
          <Card>
            <h2 className="text-base font-semibold text-relaive-navy">Purchase Detail</h2>
            <div className="mt-5 flex flex-col gap-4">
              <Input
                id="roi-purchase-price"
                label="Purchase Price"
                type="number"
                min={0}
                step="any"
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="roi-deposit"
                label="Deposit"
                type="number"
                min={0}
                step="any"
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="roi-interest-rate"
                label="Interest Rate"
                type="number"
                min={0}
                step="any"
                endIcon={PercentIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="roi-loan-term"
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
                id="roi-weekly-rent"
                label="Weekly Rent"
                type="number"
                min={0}
                step="any"
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="roi-vacancy-allowance"
                label="Vacancy Allowance"
                type="number"
                min={0}
                step="any"
                endIcon={PercentIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="roi-management-fee"
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
                id="roi-council-rates"
                label="Council Rates"
                type="number"
                min={0}
                step="any"
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="roi-landlord-insurance"
                label="Landlord Insurance"
                type="number"
                min={0}
                step="any"
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="roi-maintenance"
                label="Maintenance"
                type="number"
                min={0}
                step="any"
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
              <Input
                id="roi-land-tax"
                label="Land Tax"
                type="number"
                min={0}
                step="any"
                startIcon={DollarIcon}
                className={INPUT_CLASS}
              />
            </div>
          </Card>
        </div>

        <Button type="submit" variant="primary" className="w-fit">
          Calculate
        </Button>
      </form>
    </div>
  )
}
