// Request-body validation for POST /api/buyer/affordability-calculation.
import { z } from 'zod'

export const affordabilityCalculationSchema = z.object({
    yourAnnualIncome: z.number().nonnegative(),
    partnerAnnualIncome: z.number().nonnegative(),
    availableDeposit: z.number().nonnegative(),
    existingMonthlyDebt: z.number().nonnegative(),
    monthlyLivingExpenses: z.number().nonnegative(),
    councilRates: z.number().nonnegative(),
    landlordInsurance: z.number().nonnegative(),
})

export type AffordabilityCalculationRequest = z.infer<typeof affordabilityCalculationSchema>
