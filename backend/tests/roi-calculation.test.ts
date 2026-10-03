import { describe, expect, test } from 'vitest'
import { calculateRoi, type RoiCalculationInput } from '../src/services/roi-calculation.service.js'

// Baseline scenario, hand-calculated independently with the standard
// amortized-loan formula so the assertions check the implementation
// against the known-correct math, not against itself.
//   loanAmount = 500,000 - 100,000 = 400,000
//   monthly repayment @ 6% / 30yr  = 2,398.20  ->  annual = 28,778.43
//   gross annual rent = 500 * 52   = 26,000
//   effective rent (2% vacancy)    = 25,480.00
//   management fees (7%)          = 1,783.60
//   operating expenses            = 2,000 + 500 + 1,000 + 0 = 3,500
//   net annual cash-flow          = 25,480 - 1,783.60 - 3,500 - 28,778.43 = -8,582.03
const baseline: RoiCalculationInput = {
    purchasePrice: 500000,
    deposit: 100000,
    interestRate: 6,
    loanTermYears: 30,
    weeklyRent: 500,
    vacancyAllowance: 2,
    managementFee: 7,
    councilRates: 2000,
    landlordInsurance: 500,
    maintenance: 1000,
    landTax: 0,
}

describe('calculateRoi - core math', () => {
    test('computes loan amount, mortgage repayment and cash flow correctly', () => {
        const result = calculateRoi(baseline)

        expect(result.monthlyCashFlow).toBeCloseTo(-715.17, 1)
        expect(result.grossYieldPct).toBeCloseTo(5.2, 4)
        expect(result.netYieldPct).toBeCloseTo(4.0393, 3)
        expect(result.cashOnCashReturnPct).not.toBeNull()
        expect(result.cashOnCashReturnPct as number).toBeCloseTo(-8.582, 2)
    })

    test('annual summary rows sum to the reported net annual cash-flow', () => {
        const result = calculateRoi(baseline)
        const netRow = result.annualSummary.find((row) => row.label === 'Net Annual Cash-Flow')
        const componentSum = result.annualSummary
            .filter((row) => row.label !== 'Net Annual Cash-Flow')
            .reduce((sum, row) => sum + row.amount, 0)

        expect(netRow).toBeDefined()
        expect(netRow!.amount).toBeCloseTo(componentSum, 6)
        expect(netRow!.amount).toBeCloseTo(-8582.03, 1)
    })

    test('loses money -> negative cash-flow rows are tagged with the red tone', () => {
        const result = calculateRoi(baseline)
        const cashFlowMetric = result.investmentReturns.find((r) => r.label === 'Monthly Cash-Flow')

        expect(cashFlowMetric?.tone).toBe('red')
    })

    test('profitable property -> positive cash-flow rows are tagged with the green tone', () => {
        const profitable: RoiCalculationInput = {
            ...baseline,
            weeklyRent: 900,
            councilRates: 1000,
            landlordInsurance: 300,
            maintenance: 500,
        }
        const result = calculateRoi(profitable)
        const cashFlowMetric = result.investmentReturns.find((r) => r.label === 'Monthly Cash-Flow')
        const cashOnCash = result.investmentReturns.find((r) => r.label === 'Cash-on-Cash Returns')

        expect(result.monthlyCashFlow).toBeGreaterThan(0)
        expect(cashFlowMetric?.tone).toBe('green')
        expect(cashOnCash?.tone).toBe('green')
    })
})

describe('calculateRoi - edge cases', () => {
    test('zero deposit -> cash-on-cash return is null and shown as N/A, no divide-by-zero crash', () => {
        const result = calculateRoi({ ...baseline, deposit: 0 })

        expect(result.cashOnCashReturnPct).toBeNull()
        const row = result.investmentReturns.find((r) => r.label === 'Cash-on-Cash Returns')
        expect(row?.display).toBe('N/A')
        expect(row?.tone).toBe('navy')
    })

    test('deposit equal to purchase price -> zero loan, zero mortgage repayment', () => {
        const result = calculateRoi({ ...baseline, deposit: baseline.purchasePrice })
        const loanMetric = result.metrics.find((m) => m.label === 'Loan Amount')

        expect(loanMetric?.value).toBe('$0')
        expect(loanMetric?.trend).toContain('$0')
    })

    test('deposit larger than purchase price -> loan amount is clamped to zero, never negative', () => {
        const result = calculateRoi({ ...baseline, deposit: baseline.purchasePrice + 50000 })
        const loanMetric = result.metrics.find((m) => m.label === 'Loan Amount')

        expect(loanMetric?.value).toBe('$0')
    })

    test('0% interest rate -> repayment is simple principal / numPayments, no NaN from division', () => {
        // loanAmount = 120,000, 10 years -> 120 payments -> 1,000/month exactly
        const result = calculateRoi({
            ...baseline,
            purchasePrice: 220000,
            deposit: 100000,
            interestRate: 0,
            loanTermYears: 10,
        })
        const loanMetric = result.metrics.find((m) => m.label === 'Loan Amount')

        expect(loanMetric?.trend).toBe('monthly payment: $1,000')
    })

    test('zero purchase price -> yields are zero, not NaN or Infinity', () => {
        const result = calculateRoi({ ...baseline, purchasePrice: 0, deposit: 0 })

        expect(result.grossYieldPct).toBe(0)
        expect(result.netYieldPct).toBe(0)
        expect(Number.isFinite(result.grossYieldPct)).toBe(true)
        expect(Number.isFinite(result.netYieldPct)).toBe(true)
    })

    test('100% management fee with 100% vacancy -> break-even rent is unreachable and reported as N/A', () => {
        const result = calculateRoi({ ...baseline, managementFee: 100, vacancyAllowance: 100 })
        const breakEven = result.metrics.find((m) => m.label === 'Break-even Rent')

        expect(breakEven?.value).toBe('N/A')
    })

    test('zero loan term -> mortgage repayment is zero rather than throwing', () => {
        const result = calculateRoi({ ...baseline, loanTermYears: 0 })
        const loanMetric = result.metrics.find((m) => m.label === 'Loan Amount')

        expect(loanMetric?.trend).toBe('monthly payment: $0')
    })
})
