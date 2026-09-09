// Request-body validation for POST /api/investor/roi-calculation. All
// fields are required numbers — the frontend always sends the full form,
// defaulting untouched inputs to 0.
import { z } from 'zod'

export const roiCalculationSchema = z.object({
    purchasePrice: z.number().nonnegative(),
    deposit: z.number().nonnegative(),
    interestRate: z.number().nonnegative(),
    loanTermYears: z.number().nonnegative(),
    weeklyRent: z.number().nonnegative(),
    vacancyAllowance: z.number().min(0).max(100),
    managementFee: z.number().min(0).max(100),
    councilRates: z.number().nonnegative(),
    landlordInsurance: z.number().nonnegative(),
    maintenance: z.number().nonnegative(),
    landTax: z.number().nonnegative(),
})

export type RoiCalculationRequest = z.infer<typeof roiCalculationSchema>
