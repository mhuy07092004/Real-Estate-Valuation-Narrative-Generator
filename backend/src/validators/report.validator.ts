// Request-body validation for creating a Report — matches
// persistGeneratedReport's payload shape (common.ts). clientName/clientEmail
// are optional since a report can be saved without a client attached.
// role is required — the backend has no concept of agent/valuer/buyer/
// investor (that's a frontend URL/navigation choice, not an auth role), so
// the frontend must tell us which dashboard role generated this report.
import { z } from 'zod'

export const reportRoleValues = ['agent', 'valuer', 'buyer', 'investor'] as const

export const createReportSchema = z.object({
    role: z.enum(reportRoleValues),
    clientName: z.string().trim().min(1).optional(),
    clientEmail: z.string().trim().email().optional(),
    propertyAddressLine: z.string().trim().min(1, 'Address is required.'),
    propertySuburb: z.string().trim().min(1, 'Suburb is required.'),
    propertyState: z.string().trim().min(1, 'State is required.'),
    propertyPostcode: z.string().trim().min(1, 'Postcode is required.'),
    propertyType: z.string().trim().min(1, 'Property type is required.'),
    bedrooms: z.number().int().nonnegative(),
    bathrooms: z.number().int().nonnegative(),
    parking: z.number().int().nonnegative(),
    landSizeSqm: z.number().nonnegative(),
    reportTemplateId: z.string().trim().min(1, 'Report template is required.'),
    estimatedValue: z.number().nonnegative(),
    narrativeText: z.string().trim().min(1, 'Narrative text is required.'),
    pdfStoragePath: z.string().trim().min(1).optional(),
    roiGrossYieldPct: z.number().optional(),
    roiNetYieldPct: z.number().optional(),
    roiMonthlyCashFlow: z.number().optional(),
    roiCashOnCashReturnPct: z.number().nullable().optional(),
    affordabilityEstimatedBorrowingCapacity: z.number().optional(),
    affordabilityMaxLoanAmount: z.number().optional(),
    affordabilityRepaymentToIncomePct: z.number().optional(),
})

export type CreateReportInput = z.infer<typeof createReportSchema>
