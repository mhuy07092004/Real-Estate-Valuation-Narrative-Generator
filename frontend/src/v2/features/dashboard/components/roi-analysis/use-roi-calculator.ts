// Ported verbatim from figma's useCalculator (identical in GenerateAppraisalPage.tsx's
// StepROI and the standalone ROICalculatorPage.tsx — confirmed both figma files use the
// same formulas). 100% client-side math, no backend dependency. See
// figma-ui-migration-plan.md §10.2/§10.4.

export type RoiScenario = {
  purchasePrice: number
  deposit: number
  interestRate: number
  loanTerm: number
  weeklyRent: number
  vacancyRate: number
  managementFee: number
  councilRates: number
  insurance: number
  maintenance: number
  landTax: number
  otherCosts: number
}

export const DEFAULT_ROI_SCENARIO: RoiScenario = {
  purchasePrice: 850000,
  deposit: 170000,
  interestRate: 6.25,
  loanTerm: 30,
  weeklyRent: 650,
  vacancyRate: 4,
  managementFee: 8,
  councilRates: 1800,
  insurance: 1400,
  maintenance: 2500,
  landTax: 1200,
  otherCosts: 800,
}

export type RoiResult = {
  grossYield: number
  netYield: number
  annualCashFlow: number
  monthlyCashFlow: number
  cashOnCash: number
  breakEvenRent: number
  monthlyRepayment: number
  loanAmount: number
}

export function calculateRoi(s: RoiScenario): RoiResult {
  const loanAmount = s.purchasePrice - s.deposit
  const monthlyRate = s.interestRate / 100 / 12
  const numPayments = s.loanTerm * 12
  const monthlyRepayment =
    (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) / (Math.pow(1 + monthlyRate, numPayments) - 1)

  const annualRent = s.weeklyRent * 52 * (1 - s.vacancyRate / 100)
  const annualManagement = annualRent * (s.managementFee / 100)
  const annualExpenses =
    annualManagement + s.councilRates + s.insurance + s.maintenance + s.landTax + s.otherCosts + monthlyRepayment * 12

  const grossYield = ((s.weeklyRent * 52) / s.purchasePrice) * 100
  const netYield =
    ((annualRent - annualManagement - s.councilRates - s.insurance - s.maintenance - s.landTax - s.otherCosts) /
      s.purchasePrice) *
    100
  const annualCashFlow = annualRent - annualExpenses
  const monthlyCashFlow = annualCashFlow / 12
  const cashOnCash = (annualCashFlow / s.deposit) * 100
  const breakEvenRent = Math.ceil(annualExpenses / 52)

  return { grossYield, netYield, annualCashFlow, monthlyCashFlow, cashOnCash, breakEvenRent, monthlyRepayment, loanAmount }
}
