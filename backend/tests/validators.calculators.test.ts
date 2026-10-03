import { describe, expect, test } from 'vitest'
import { roiCalculationSchema } from '../src/validators/roi-calculation.validator.js'
import { affordabilityCalculationSchema } from '../src/validators/affordability-calculation.validator.js'

const validRoi = {
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

describe('roiCalculationSchema', () => {
    test('accepts a fully valid payload', () => {
        expect(() => roiCalculationSchema.parse(validRoi)).not.toThrow()
    })

    test('rejects a negative purchasePrice/deposit (nonnegative fields)', () => {
        expect(() => roiCalculationSchema.parse({ ...validRoi, purchasePrice: -1 })).toThrow()
        expect(() => roiCalculationSchema.parse({ ...validRoi, deposit: -1 })).toThrow()
    })

    test('rejects vacancyAllowance/managementFee outside 0-100', () => {
        expect(() => roiCalculationSchema.parse({ ...validRoi, vacancyAllowance: -1 })).toThrow()
        expect(() => roiCalculationSchema.parse({ ...validRoi, vacancyAllowance: 101 })).toThrow()
        expect(() => roiCalculationSchema.parse({ ...validRoi, managementFee: 101 })).toThrow()
    })

    test('accepts the boundary values 0 and 100 for percentage fields', () => {
        expect(() => roiCalculationSchema.parse({ ...validRoi, vacancyAllowance: 0, managementFee: 100 })).not.toThrow()
    })

    test('rejects a missing required field', () => {
        const { landTax, ...missingLandTax } = validRoi
        expect(() => roiCalculationSchema.parse(missingLandTax)).toThrow()
    })

    test('rejects a non-numeric field even if it looks numeric as a string', () => {
        expect(() => roiCalculationSchema.parse({ ...validRoi, purchasePrice: '500000' })).toThrow()
    })
})

const validAffordability = {
    yourAnnualIncome: 90000,
    partnerAnnualIncome: 70000,
    availableDeposit: 50000,
    existingMonthlyDebt: 300,
    monthlyLivingExpenses: 2000,
    councilRates: 1800,
    landlordInsurance: 600,
}

describe('affordabilityCalculationSchema', () => {
    test('accepts a fully valid payload', () => {
        expect(() => affordabilityCalculationSchema.parse(validAffordability)).not.toThrow()
    })

    test('accepts zero for every field (a buyer with no income/expenses yet)', () => {
        const allZero = Object.fromEntries(Object.keys(validAffordability).map((k) => [k, 0]))
        expect(() => affordabilityCalculationSchema.parse(allZero)).not.toThrow()
    })

    test('rejects a negative value for any field', () => {
        for (const key of Object.keys(validAffordability)) {
            expect(() => affordabilityCalculationSchema.parse({ ...validAffordability, [key]: -1 })).toThrow()
        }
    })

    test('rejects a missing required field', () => {
        const { availableDeposit, ...missing } = validAffordability
        expect(() => affordabilityCalculationSchema.parse(missing)).toThrow()
    })
})
