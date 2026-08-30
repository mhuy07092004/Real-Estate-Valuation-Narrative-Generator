// Ported verbatim from figma's useAffordability (identical in GenerateAppraisalPage.tsx's
// StepAffordability and the standalone AffordabilityPage.tsx). 100% client-side math, no
// backend dependency. See figma-ui-migration-plan.md §10.2/§10.4.

export type AffordabilityInputs = {
  annualIncome: number
  partnerIncome: number
  deposit: number
  existingDebt: number
  interestRate: number
  loanTerm: number
  monthlyExpenses: number
}

export const DEFAULT_AFFORDABILITY_INPUTS: AffordabilityInputs = {
  annualIncome: 95000,
  partnerIncome: 75000,
  deposit: 180000,
  existingDebt: 500,
  interestRate: 6.25,
  loanTerm: 30,
  monthlyExpenses: 3200,
}

export type AffordabilityLevel = 'Comfortable' | 'Moderate' | 'Stretched'

export type AffordabilityResult = {
  borrowingCapacity: number
  maxLoan: number
  repaymentOnCapacity: number
  repaymentToIncome: number
  affordabilityLevel: AffordabilityLevel
}

export function calculateAffordability(inputs: AffordabilityInputs): AffordabilityResult {
  const totalIncome = inputs.annualIncome + inputs.partnerIncome
  const monthlyIncome = totalIncome / 12
  const dsr = 0.3
  const maxMonthlyRepayment = monthlyIncome * dsr - inputs.existingDebt
  const monthlyRate = inputs.interestRate / 100 / 12
  const n = inputs.loanTerm * 12
  const maxLoan =
    maxMonthlyRepayment > 0
      ? (maxMonthlyRepayment * (Math.pow(1 + monthlyRate, n) - 1)) / (monthlyRate * Math.pow(1 + monthlyRate, n))
      : 0
  const borrowingCapacity = Math.max(0, maxLoan + inputs.deposit)
  const repaymentOnCapacity = (maxLoan * (monthlyRate * Math.pow(1 + monthlyRate, n))) / (Math.pow(1 + monthlyRate, n) - 1)
  const repaymentToIncome = (repaymentOnCapacity / monthlyIncome) * 100
  const affordabilityLevel: AffordabilityLevel = repaymentToIncome <= 25 ? 'Comfortable' : repaymentToIncome <= 35 ? 'Moderate' : 'Stretched'

  return { borrowingCapacity, maxLoan, repaymentOnCapacity, repaymentToIncome, affordabilityLevel }
}
