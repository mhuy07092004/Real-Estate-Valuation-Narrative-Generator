import { describe, it, expect } from 'vitest'
import { calculateRoi, type RoiCalculationInput } from '../src/services/roi-calculation.service.js'

// ---------------------------------------------------------------------------
// Baseline: a typical positively-geared investment property.
// ---------------------------------------------------------------------------
const BASELINE: RoiCalculationInput = {
  purchasePrice: 600_000,
  deposit: 120_000,         // 20% LVR
  interestRate: 6.5,
  loanTermYears: 30,
  weeklyRent: 600,
  vacancyAllowance: 3,      // 3% vacancy
  managementFee: 8,         // 8% of effective rent
  councilRates: 2_000,
  landlordInsurance: 1_500,
  maintenance: 2_500,
  landTax: 1_000,
}

describe('calculateRoi — result shape', () => {
  it('returns annualSummary (5), metrics (2), investmentReturns (4), and raw numbers', () => {
    const result = calculateRoi(BASELINE)
    expect(result.annualSummary).toHaveLength(5)
    expect(result.metrics).toHaveLength(2)
    expect(result.investmentReturns).toHaveLength(4)
    expect(typeof result.grossYieldPct).toBe('number')
    expect(typeof result.netYieldPct).toBe('number')
    expect(typeof result.monthlyCashFlow).toBe('number')
  })

  it('annualSummary labels are correct in order', () => {
    const labels = calculateRoi(BASELINE).annualSummary.map((s) => s.label)
    expect(labels).toEqual([
      'Annual Rental Income',
      'Annual Mortgage Repayments',
      'Annual Operating Expenses',
      'Management Fees',
      'Net Annual Cash-Flow',
    ])
  })

  it('investmentReturns labels are correct in order', () => {
    const labels = calculateRoi(BASELINE).investmentReturns.map((r) => r.label)
    expect(labels).toEqual([
      'Gross Yield',
      'Net Yield',
      'Monthly Cash-Flow',
      'Cash-on-Cash Returns',
    ])
  })
})

describe('calculateRoi — gross yield', () => {
  it('grossYieldPct = (weeklyRent * 52 / purchasePrice) * 100', () => {
    const result = calculateRoi(BASELINE)
    const expected = (BASELINE.weeklyRent * 52 / BASELINE.purchasePrice) * 100
    expect(result.grossYieldPct).toBeCloseTo(expected, 4)
  })

  it('grossYieldPct is 0 when purchasePrice is 0', () => {
    const result = calculateRoi({ ...BASELINE, purchasePrice: 0, deposit: 0 })
    expect(result.grossYieldPct).toBe(0)
  })
})

describe('calculateRoi — net yield', () => {
  it('netYieldPct is lower than grossYieldPct (expenses reduce net)', () => {
    const result = calculateRoi(BASELINE)
    expect(result.netYieldPct).toBeLessThan(result.grossYieldPct)
  })

  it('netYieldPct is 0 when purchasePrice is 0', () => {
    const result = calculateRoi({ ...BASELINE, purchasePrice: 0, deposit: 0 })
    expect(result.netYieldPct).toBe(0)
  })
})

describe('calculateRoi — loan amount', () => {
  it('loanAmount = purchasePrice - deposit (positive)', () => {
    const result = calculateRoi(BASELINE)
    const expectedLoanDisplay = `$${(600_000 - 120_000).toLocaleString('en-AU')}`
    expect(result.metrics[0].value).toBe(expectedLoanDisplay)
  })

  it('loanAmount is 0 when deposit >= purchasePrice (no negative loan)', () => {
    const result = calculateRoi({ ...BASELINE, deposit: 700_000 })
    // The loan metric value should be $0
    expect(result.metrics[0].value).toBe('$0')
  })
})

describe('calculateRoi — vacancy allowance', () => {
  it('100% vacancy => effective rent is 0 => negative cash flow', () => {
    const result = calculateRoi({ ...BASELINE, vacancyAllowance: 100 })
    expect(result.monthlyCashFlow).toBeLessThan(0)
    // All summary income should be 0
    expect(result.annualSummary[0].amount).toBeCloseTo(0, 0)
  })

  it('0% vacancy => effective rent equals gross annual rent', () => {
    const result = calculateRoi({ ...BASELINE, vacancyAllowance: 0, managementFee: 0 })
    const expectedEffectiveRent = BASELINE.weeklyRent * 52
    expect(result.annualSummary[0].amount).toBeCloseTo(expectedEffectiveRent, 0)
  })
})

describe('calculateRoi — cash-on-cash return', () => {
  it('cashOnCashReturnPct is null when deposit is 0', () => {
    const result = calculateRoi({ ...BASELINE, deposit: 0 })
    expect(result.cashOnCashReturnPct).toBeNull()
    const cocReturn = result.investmentReturns.find((r) => r.label === 'Cash-on-Cash Returns')!
    expect(cocReturn.display).toBe('N/A')
    expect(cocReturn.tone).toBe('navy')
  })

  it('cashOnCashReturnPct is present when deposit > 0', () => {
    const result = calculateRoi(BASELINE)
    expect(result.cashOnCashReturnPct).not.toBeNull()
    expect(typeof result.cashOnCashReturnPct).toBe('number')
  })
})

describe('calculateRoi — monthly cash-flow tone', () => {
  it('monthly cash-flow tone is green when cash flow >= 0', () => {
    // Set very high rent to ensure positive
    const result = calculateRoi({ ...BASELINE, weeklyRent: 2_000 })
    const cashFlowReturn = result.investmentReturns.find((r) => r.label === 'Monthly Cash-Flow')!
    expect(cashFlowReturn.tone).toBe('green')
  })

  it('monthly cash-flow tone is red when cash flow < 0', () => {
    // Set very low rent to ensure negative
    const result = calculateRoi({ ...BASELINE, weeklyRent: 10 })
    const cashFlowReturn = result.investmentReturns.find((r) => r.label === 'Monthly Cash-Flow')!
    expect(cashFlowReturn.tone).toBe('red')
  })
})

describe('calculateRoi — zero interest rate (no division by zero)', () => {
  it('computes repayment as loanAmount / numPayments when rate is 0', () => {
    const result = calculateRoi({ ...BASELINE, interestRate: 0 })
    const loanAmount = BASELINE.purchasePrice - BASELINE.deposit // 480_000
    const expectedMonthlyRepayment = loanAmount / (BASELINE.loanTermYears * 12)
    const expectedAnnual = expectedMonthlyRepayment * 12
    expect(result.annualSummary[1].amount).toBeCloseTo(-expectedAnnual, 0)
  })
})

describe('calculateRoi — break-even rent', () => {
  it('break-even weekly rent is higher than current rent in a negatively-geared scenario', () => {
    const result = calculateRoi({ ...BASELINE, weeklyRent: 100 })
    const breakEvenMetric = result.metrics.find((m) => m.label === 'Break-even Rent')!
    // Break-even should be greater than $100/wk
    const breakEvenNumber = Number(breakEvenMetric.value.replace(/[$,]/g, ''))
    expect(breakEvenNumber).toBeGreaterThan(100)
  })

  it('current rent listed in break-even trend matches input weeklyRent', () => {
    const result = calculateRoi(BASELINE)
    const breakEvenMetric = result.metrics.find((m) => m.label === 'Break-even Rent')!
    expect(breakEvenMetric.trend).toContain(`$${BASELINE.weeklyRent.toLocaleString('en-AU')}/wk`)
  })
})

describe('calculateRoi — annualSummary amounts sign convention', () => {
  it('Annual Rental Income is positive', () => {
    expect(calculateRoi(BASELINE).annualSummary[0].amount).toBeGreaterThan(0)
  })

  it('Annual Mortgage Repayments is negative', () => {
    expect(calculateRoi(BASELINE).annualSummary[1].amount).toBeLessThan(0)
  })

  it('Annual Operating Expenses is negative (when > 0)', () => {
    expect(calculateRoi(BASELINE).annualSummary[2].amount).toBeLessThan(0)
  })
})

describe('calculateRoi — display formatting', () => {
  it('grossYield display is formatted as X.X%', () => {
    const grossYield = calculateRoi(BASELINE).investmentReturns.find((r) => r.label === 'Gross Yield')!
    expect(grossYield.display).toMatch(/^\d+\.\d%$/)
  })

  it('monthly cash-flow display contains /mth suffix', () => {
    const cashFlow = calculateRoi(BASELINE).investmentReturns.find((r) => r.label === 'Monthly Cash-Flow')!
    expect(cashFlow.display).toMatch(/\/mth$/)
  })
})
