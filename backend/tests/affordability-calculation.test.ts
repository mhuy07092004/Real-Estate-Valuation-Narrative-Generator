import { describe, expect, test } from 'vitest'
import {
    calculateAffordability,
    type AffordabilityCalculationInput,
} from '../src/services/affordability-calculation.service.js'

// Comfortable-buyer scenario, hand-calculated independently against the
// service's own documented formula (assumed 6.5% / 30yr loan, repayment
// capped at 30% of gross income):
//   grossMonthlyIncome      = (90,000 + 70,000) / 12 = 13,333.33
//   monthlyObligations      = 300 + 2,000 + (1,800+600)/12 = 2,500.00
//   availableMonthlyRepay.  = 13,333.33 - 2,500 = 10,833.33
//   idealCeiling (30%)      = 4,000.00
//   assessedMonthlyRepay.   = min(10,833.33, 4,000) = 4,000.00 (capped)
//   maxLoanAmount           = 632,843.28  (amortized @ 6.5%/30yr)
//   estimatedBorrowingCap.  = 632,843.28 + 50,000 = 682,843.28
//   repaymentToIncomePct    = 4,000 / 13,333.33 * 100 = 30%
const comfortable: AffordabilityCalculationInput = {
    yourAnnualIncome: 90000,
    partnerAnnualIncome: 70000,
    availableDeposit: 50000,
    existingMonthlyDebt: 300,
    monthlyLivingExpenses: 2000,
    councilRates: 1800,
    landlordInsurance: 600,
}

// Stretched-buyer scenario (single low income, high expenses):
//   grossMonthlyIncome      = 40,000 / 12 = 3,333.33
//   monthlyObligations      = 500 + 2,500 + (1,200+400)/12 = 3,133.33
//   availableMonthlyRepay.  = 200.00
//   idealCeiling (30%)      = 1,000.00 ; half-ceiling = 500.00
//   availableMonthlyRepay (200) < half-ceiling (500) -> "Stretched"
//   assessedMonthlyRepay.   = min(200, 1,000) = 200.00 (not capped)
//   maxLoanAmount           = 31,642.16
//   estimatedBorrowingCap.  = 41,642.16
//   repaymentToIncomePct    = 200 / 3,333.33 * 100 = 6%
const stretched: AffordabilityCalculationInput = {
    yourAnnualIncome: 40000,
    partnerAnnualIncome: 0,
    availableDeposit: 10000,
    existingMonthlyDebt: 500,
    monthlyLivingExpenses: 2500,
    councilRates: 1200,
    landlordInsurance: 400,
}

describe('calculateAffordability - core math', () => {
    test('comfortable buyer: capped repayment, borrowing capacity and ratio are computed correctly', () => {
        const result = calculateAffordability(comfortable)

        expect(result.repaymentToIncomePct).toBeCloseTo(30, 4)
        expect(result.maxLoanAmount).toBeCloseTo(632843.28, 1)
        expect(result.estimatedBorrowingCapacity).toBeCloseTo(682843.28, 1)
    })

    test('comfortable buyer: repayment ceiling is capped at 30% even though far more is technically left over', () => {
        const result = calculateAffordability(comfortable)
        const monthlyRepaymentMetric = result.metrics.find((m) => m.label === 'Monthly Repayment')

        // available (10,833.33) is well above the 30% ceiling (4,000), so the
        // assessed repayment must be capped at the ceiling, not the full leftover.
        expect(monthlyRepaymentMetric?.value).toBe('$4,000')
    })

    test('comfortable buyer is banded "Comfortable" with a green tone', () => {
        const result = calculateAffordability(comfortable)
        const band = result.summary.find((row) => row.label === 'AFFORDABILITY')

        expect(band?.value).toBe('Comfortable')
        expect(band?.valueTone).toBe('green')
    })

    test('stretched buyer: uncapped repayment (leftover income below the ceiling) matches hand calculation', () => {
        const result = calculateAffordability(stretched)

        expect(result.repaymentToIncomePct).toBeCloseTo(6, 4)
        expect(result.maxLoanAmount).toBeCloseTo(31642.16, 1)
        expect(result.estimatedBorrowingCapacity).toBeCloseTo(41642.16, 1)
    })

    test('stretched buyer is banded "Stretched" with a red tone, not "Comfortable"', () => {
        const result = calculateAffordability(stretched)
        const band = result.summary.find((row) => row.label === 'AFFORDABILITY')

        expect(band?.value).toBe('Stretched')
        expect(band?.valueTone).toBe('red')
    })

    test('band reflects true leftover income against the ceiling, not the display-capped ratio alone', () => {
        // Regression guard for the documented pitfall in the service: the
        // displayed ratio is always <=30% by construction, so the band must
        // be derived from availableMonthlyRepayment vs the ceiling, not from
        // repaymentToIncomePct (which would wrongly read "Comfortable" here).
        const result = calculateAffordability(stretched)
        expect(result.repaymentToIncomePct).toBeLessThan(30)
        const band = result.summary.find((row) => row.label === 'AFFORDABILITY')
        expect(band?.value).not.toBe('Comfortable')
    })
})

describe('calculateAffordability - edge cases', () => {
    test('zero household income -> band is "N/A", no divide-by-zero crash', () => {
        const result = calculateAffordability({ ...comfortable, yourAnnualIncome: 0, partnerAnnualIncome: 0 })
        const band = result.summary.find((row) => row.label === 'AFFORDABILITY')
        const ratio = result.summary.find((row) => row.label === 'Repayment-to-income')

        expect(band?.value).toBe('N/A')
        expect(band?.valueTone).toBe('navy')
        expect(ratio?.value).toBe('N/A')
        expect(result.repaymentToIncomePct).toBe(0)
    })

    test('expenses exceed income -> available repayment floors at zero, never negative', () => {
        const result = calculateAffordability({
            ...comfortable,
            yourAnnualIncome: 20000,
            partnerAnnualIncome: 0,
            existingMonthlyDebt: 3000,
            monthlyLivingExpenses: 3000,
        })

        expect(result.maxLoanAmount).toBe(0)
        const monthlyRepaymentMetric = result.metrics.find((m) => m.label === 'Monthly Repayment')
        expect(monthlyRepaymentMetric?.value).toBe('$0')
    })

    test('zero deposit -> borrowing capacity equals the max loan amount exactly', () => {
        const result = calculateAffordability({ ...comfortable, availableDeposit: 0 })

        expect(result.estimatedBorrowingCapacity).toBeCloseTo(result.maxLoanAmount, 6)
    })

    test('formatted currency values contain no NaN or Infinity across a swept range of incomes', () => {
        for (const income of [0, 1, 500, 1_000_000]) {
            const result = calculateAffordability({ ...comfortable, yourAnnualIncome: income, partnerAnnualIncome: 0 })
            for (const metric of result.metrics) {
                expect(metric.value).not.toMatch(/NaN|Infinity/)
            }
        }
    })
})
