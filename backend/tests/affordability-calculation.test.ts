import { describe, it, expect } from 'vitest'
import {
  calculateAffordability,
  type AffordabilityCalculationInput,
} from '../src/services/affordability-calculation.service.js'

// Helper: a baseline "comfortable" buyer with plenty of income, low expenses,
// and a healthy deposit. All dollar amounts are AUD.
const BASELINE: AffordabilityCalculationInput = {
  yourAnnualIncome: 120_000,
  partnerAnnualIncome: 80_000,
  availableDeposit: 100_000,
  existingMonthlyDebt: 200,
  monthlyLivingExpenses: 2_000,
  councilRates: 2_400,
  landlordInsurance: 1_200,
}

describe('calculateAffordability — result shape', () => {
  it('returns summary with 3 entries, metrics with 3 entries, and raw numerics', () => {
    const result = calculateAffordability(BASELINE)
    expect(result.summary).toHaveLength(3)
    expect(result.metrics).toHaveLength(3)
    expect(typeof result.estimatedBorrowingCapacity).toBe('number')
    expect(typeof result.maxLoanAmount).toBe('number')
    expect(typeof result.repaymentToIncomePct).toBe('number')
  })

  it('summary labels are exactly [Repayment-to-income, Ideal Range, AFFORDABILITY]', () => {
    const { summary } = calculateAffordability(BASELINE)
    expect(summary[0].label).toBe('Repayment-to-income')
    expect(summary[1].label).toBe('Ideal Range')
    expect(summary[2].label).toBe('AFFORDABILITY')
  })

  it('metrics labels are exactly [Estimated Borrowing Capacity, Max Loan Amount, Monthly Repayment]', () => {
    const { metrics } = calculateAffordability(BASELINE)
    expect(metrics[0].label).toBe('Estimated Borrowing Capacity')
    expect(metrics[1].label).toBe('Max Loan Amount')
    expect(metrics[2].label).toBe('Monthly Repayment')
  })
})

describe('calculateAffordability — band classification', () => {
  it('classifies a buyer whose expenses leave > 30% ceiling available as Comfortable (green)', () => {
    // BASELINE gross monthly income = (120k+80k)/12 = 16,666
    // 30% ceiling = 5,000; obligations ~= 200+2000+300 = 2,500
    // available = ~14,166 >> ceiling => Comfortable
    const result = calculateAffordability(BASELINE)
    expect(result.summary[2].value).toBe('Comfortable')
    expect(result.summary[2].valueTone).toBe('green')
    expect(result.summary[0].valueTone).toBe('green')
  })

  it('classifies a buyer where expenses leave 50-100% of ceiling available as Moderate (orange)', () => {
    // gross = 4,000/month, ceiling = 1,200
    // obligations = 3,000 -> available = 1,000; 1000 >= 600 (50% ceiling) but < 1200 => Moderate
    const input: AffordabilityCalculationInput = {
      yourAnnualIncome: 48_000,
      partnerAnnualIncome: 0,
      availableDeposit: 50_000,
      existingMonthlyDebt: 1_500,
      monthlyLivingExpenses: 1_500,
      councilRates: 0,
      landlordInsurance: 0,
    }
    const result = calculateAffordability(input)
    expect(result.summary[2].value).toBe('Moderate')
    expect(result.summary[2].valueTone).toBe('orange')
  })

  it('classifies a buyer where expenses leave < 50% of ceiling available as Stretched (red)', () => {
    // gross = 4,000/month, ceiling = 1,200
    // obligations = 3,700 -> available = 300; 300 < 600 => Stretched
    const input: AffordabilityCalculationInput = {
      yourAnnualIncome: 48_000,
      partnerAnnualIncome: 0,
      availableDeposit: 50_000,
      existingMonthlyDebt: 2_000,
      monthlyLivingExpenses: 1_700,
      councilRates: 0,
      landlordInsurance: 0,
    }
    const result = calculateAffordability(input)
    expect(result.summary[2].value).toBe('Stretched')
    expect(result.summary[2].valueTone).toBe('red')
  })
})

describe('calculateAffordability — zero / edge income', () => {
  it('returns N/A and 0% when both incomes are zero (no division by zero)', () => {
    const input: AffordabilityCalculationInput = {
      yourAnnualIncome: 0,
      partnerAnnualIncome: 0,
      availableDeposit: 200_000,
      existingMonthlyDebt: 0,
      monthlyLivingExpenses: 0,
      councilRates: 0,
      landlordInsurance: 0,
    }
    const result = calculateAffordability(input)
    expect(result.summary[0].value).toBe('N/A')
    expect(result.repaymentToIncomePct).toBe(0)
    expect(result.maxLoanAmount).toBe(0)
    expect(result.estimatedBorrowingCapacity).toBe(200_000)
    expect(result.summary[2].value).toBe('N/A')
  })

  it('repaymentToIncomePct is never above 30 (30% hard ceiling)', () => {
    const result = calculateAffordability(BASELINE)
    expect(result.repaymentToIncomePct).toBeLessThanOrEqual(30)
  })
})

describe('calculateAffordability — deposit math', () => {
  it('estimatedBorrowingCapacity = maxLoanAmount + availableDeposit', () => {
    const result = calculateAffordability(BASELINE)
    expect(result.estimatedBorrowingCapacity).toBeCloseTo(
      result.maxLoanAmount + BASELINE.availableDeposit,
      0,
    )
  })

  it('zero deposit => estimatedBorrowingCapacity equals maxLoanAmount', () => {
    const result = calculateAffordability({ ...BASELINE, availableDeposit: 0 })
    expect(result.estimatedBorrowingCapacity).toBeCloseTo(result.maxLoanAmount, 0)
  })
})

describe('calculateAffordability — currency formatting', () => {
  it('all currency values in metrics are prefixed with $', () => {
    const { metrics } = calculateAffordability(BASELINE)
    for (const m of metrics) {
      expect(m.value).toMatch(/^\$/)
    }
  })

  it('repayment-to-income summary value is a percentage string', () => {
    const { summary } = calculateAffordability(BASELINE)
    expect(summary[0].value).toMatch(/^\d+%$/)
  })
})

describe('calculateAffordability — negative obligations guard', () => {
  it('maxLoanAmount is 0 when obligations exceed income (no negative loans)', () => {
    const input: AffordabilityCalculationInput = {
      yourAnnualIncome: 12_000,
      partnerAnnualIncome: 0,
      availableDeposit: 0,
      existingMonthlyDebt: 5_000,
      monthlyLivingExpenses: 5_000,
      councilRates: 0,
      landlordInsurance: 0,
    }
    const result = calculateAffordability(input)
    expect(result.maxLoanAmount).toBe(0)
    expect(result.estimatedBorrowingCapacity).toBe(0)
  })
})

describe('calculateAffordability — council rates and landlord insurance annualised', () => {
  it('council rates and landlord insurance are divided by 12 before adding to monthly obligations', () => {
    // Two identical inputs except one uses annual insurance/rates routed through the input.
    // The monthly obligations = existingMonthlyDebt + monthlyLivingExpenses + (councilRates+landlordInsurance)/12
    // If the service DID NOT divide by 12, a buyer with 12,000 annual rates would have
    // 12,000/month extra obligations and would show Stretched, not Comfortable.
    const withRates: AffordabilityCalculationInput = {
      yourAnnualIncome: 120_000,
      partnerAnnualIncome: 0,
      availableDeposit: 0,
      existingMonthlyDebt: 0,
      monthlyLivingExpenses: 0,
      councilRates: 12_000,    // $1,000/month when /12
      landlordInsurance: 0,
    }
    const withoutRates: AffordabilityCalculationInput = {
      ...withRates,
      councilRates: 0,
      existingMonthlyDebt: 1_000, // equivalent monthly burden
    }
    const r1 = calculateAffordability(withRates)
    const r2 = calculateAffordability(withoutRates)
    // Both should produce the same maxLoanAmount (obligations are equivalent monthly)
    expect(r1.maxLoanAmount).toBeCloseTo(r2.maxLoanAmount, 0)
  })
})
