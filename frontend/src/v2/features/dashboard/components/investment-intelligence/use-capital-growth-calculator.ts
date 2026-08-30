// Investment Intelligence's Calculator + Cash Flow tabs — a genuinely different model from
// the existing ROI Calculator (`roi-analysis/use-roi-calculator.ts`). Where the ROI calculator
// answers "what does this property yield/cash-flow *today*?" (deposit, loan, weekly cash
// flow), this answers "what is this property worth *at exit*, and what does the whole hold
// look like?" — holding period, capital-growth rate, projected sale value, IRR, NPV. Ported
// from figma-protoype_v2's `InvestmentIntelligencePage.tsx` (Calculator + Cash Flow tabs),
// made fully reactive to inputs instead of the prototype's static hardcoded result numbers.
// See figma-ui-migration-plan.md §10.3 item 2 (this page was previously — incorrectly —
// written off as a duplicate of ROICalculatorPage; it is not).
//
// Assumption constants below (loan LVR/rate/term for the cash-flow tab's mortgage line,
// council rates/insurance rates, marginal tax rate, depreciation base) are not user inputs in
// the figma prototype either — they're the same fixed assumptions figma baked into its static
// numbers, just made explicit and applied to the live purchase price/rent instead of frozen at
// figma's default scenario. This mirrors how `use-roi-calculator.ts` treats things like
// `managementFee`/`vacancyRate` as modelling assumptions.

export type CapitalGrowthInputs = {
  purchasePrice: number
  weeklyRent: number
  holdingYears: number
  growthRate: number
}

export const DEFAULT_CAPITAL_GROWTH_INPUTS: CapitalGrowthInputs = {
  purchasePrice: 1250000,
  weeklyRent: 1800,
  holdingYears: 5,
  growthRate: 6.5,
}

// Fixed modelling assumptions (not user-adjustable in this tab — ported from the prototype's
// implied defaults; see file header).
const ASSUMED_LVR = 0.8
const ASSUMED_LOAN_RATE = 6.25 // % p.a.
const ASSUMED_LOAN_TERM_YEARS = 30
const ASSUMED_MANAGEMENT_FEE_RATE = 0.08 // 8% of gross rent
const ASSUMED_COUNCIL_RATE = 0.00192 // ~$2,400 on a $1.25M property
const ASSUMED_INSURANCE_RATE = 0.00144 // ~$1,800 on a $1.25M property
const ASSUMED_MAINTENANCE_RATE = 0.01 // 1% of purchase price p.a.
const ASSUMED_MARGINAL_TAX_RATE = 0.35
const ASSUMED_DEPRECIATION_RATE = 0.0036 // building + plant, approximate blended rate
const ASSUMED_DISCOUNT_RATE = 0.07 // NPV discount rate, matches prototype's "7% disc."

function monthlyLoanRepayment(loanAmount: number, annualRatePct: number, termYears: number): number {
  const monthlyRate = annualRatePct / 100 / 12
  const numPayments = termYears * 12
  if (monthlyRate === 0) return loanAmount / numPayments
  return (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) / (Math.pow(1 + monthlyRate, numPayments) - 1)
}

export type CapitalGrowthResult = {
  projectedValue: number
  capitalGrowth: number
  annualRent: number
  totalRentalIncome: number
  grossYield: number
  totalReturn: number
  irrEstimate: number
  npv: number
  cashOnCash: number
  holdingCostAnnual: number
}

export type AnnualCashFlow = {
  grossRentalIncome: number
  propertyManagement: number
  mortgageRepayment: number
  councilRates: number
  insurance: number
  maintenance: number
  netCashFlow: number
}

export type TaxEstimate = {
  rentalIncomeTax: number
  negativeGearingBenefit: number
  depreciationClaims: number
  netTaxEstimate: number
}

/** Simple bisection-based IRR solve over the modelled cash flow series. */
function estimateIrr(cashFlows: number[]): number {
  function npvAt(rate: number): number {
    return cashFlows.reduce((sum, cf, year) => sum + cf / Math.pow(1 + rate, year), 0)
  }

  let low = -0.5
  let high = 2
  // If the series never changes sign, there's no real IRR — fall back to 0.
  if (npvAt(low) * npvAt(high) > 0) return 0

  for (let i = 0; i < 60; i += 1) {
    const mid = (low + high) / 2
    const value = npvAt(mid)
    if (Math.abs(value) < 1) return mid
    if (npvAt(low) * value < 0) {
      high = mid
    } else {
      low = mid
    }
  }
  return (low + high) / 2
}

export function computeAnnualCashFlow(inputs: CapitalGrowthInputs): AnnualCashFlow {
  const grossRentalIncome = inputs.weeklyRent * 52
  const propertyManagement = -(grossRentalIncome * ASSUMED_MANAGEMENT_FEE_RATE)
  const loanAmount = inputs.purchasePrice * ASSUMED_LVR
  const mortgageRepayment = -(monthlyLoanRepayment(loanAmount, ASSUMED_LOAN_RATE, ASSUMED_LOAN_TERM_YEARS) * 12)
  const councilRates = -(inputs.purchasePrice * ASSUMED_COUNCIL_RATE)
  const insurance = -(inputs.purchasePrice * ASSUMED_INSURANCE_RATE)
  const maintenance = -(inputs.purchasePrice * ASSUMED_MAINTENANCE_RATE)
  const netCashFlow =
    grossRentalIncome + propertyManagement + mortgageRepayment + councilRates + insurance + maintenance

  return { grossRentalIncome, propertyManagement, mortgageRepayment, councilRates, insurance, maintenance, netCashFlow }
}

export function computeTaxEstimate(inputs: CapitalGrowthInputs, cashFlow: AnnualCashFlow): TaxEstimate {
  const rentalIncomeTax = cashFlow.grossRentalIncome * ASSUMED_MARGINAL_TAX_RATE
  const loanAmount = inputs.purchasePrice * ASSUMED_LVR
  const firstYearInterest = loanAmount * (ASSUMED_LOAN_RATE / 100)
  const cashDeductibleExpenses =
    Math.abs(cashFlow.propertyManagement) + Math.abs(cashFlow.councilRates) + Math.abs(cashFlow.insurance) + Math.abs(cashFlow.maintenance)
  const taxableLoss = cashFlow.grossRentalIncome - cashDeductibleExpenses - firstYearInterest
  const negativeGearingBenefit = taxableLoss < 0 ? Math.abs(taxableLoss) * ASSUMED_MARGINAL_TAX_RATE : 0
  const depreciationClaims = inputs.purchasePrice * ASSUMED_DEPRECIATION_RATE
  const netTaxEstimate = rentalIncomeTax - negativeGearingBenefit - depreciationClaims

  return { rentalIncomeTax, negativeGearingBenefit, depreciationClaims, netTaxEstimate }
}

export function computeCapitalGrowth(inputs: CapitalGrowthInputs): CapitalGrowthResult {
  const projectedValue = inputs.purchasePrice * Math.pow(1 + inputs.growthRate / 100, inputs.holdingYears)
  const capitalGrowth = projectedValue - inputs.purchasePrice
  const annualRent = inputs.weeklyRent * 52
  const totalRentalIncome = annualRent * inputs.holdingYears
  const grossYield = (annualRent / inputs.purchasePrice) * 100
  const totalReturn = ((projectedValue - inputs.purchasePrice + totalRentalIncome) / inputs.purchasePrice) * 100

  const cashFlow = computeAnnualCashFlow(inputs)
  const holdingCostAnnual = Math.abs(cashFlow.councilRates + cashFlow.insurance + cashFlow.maintenance + cashFlow.propertyManagement)

  const deposit = inputs.purchasePrice * (1 - ASSUMED_LVR)
  const cashOnCash = deposit > 0 ? (cashFlow.netCashFlow / deposit) * 100 : 0

  // Cash flow series for IRR/NPV: year 0 = -deposit (equity outlay), years 1..N = net rental
  // cash flow, final year adds the equity recovered on sale (sale price less remaining loan).
  const loanAmount = inputs.purchasePrice * ASSUMED_LVR
  const remainingLoanAtExit = Math.max(0, loanAmount - loanAmount * Math.min(1, inputs.holdingYears / ASSUMED_LOAN_TERM_YEARS) * 0.6)
  const saleEquity = projectedValue - remainingLoanAtExit
  const cashFlows: number[] = [-deposit]
  for (let year = 1; year <= inputs.holdingYears; year += 1) {
    cashFlows.push(cashFlow.netCashFlow + (year === inputs.holdingYears ? saleEquity : 0))
  }
  const irrEstimate = estimateIrr(cashFlows) * 100

  const npv = cashFlows.reduce((sum, cf, year) => sum + cf / Math.pow(1 + ASSUMED_DISCOUNT_RATE, year), 0)

  return {
    projectedValue,
    capitalGrowth,
    annualRent,
    totalRentalIncome,
    grossYield,
    totalReturn,
    irrEstimate,
    npv,
    cashOnCash,
    holdingCostAnnual,
  }
}
