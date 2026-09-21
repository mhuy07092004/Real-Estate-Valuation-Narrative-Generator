// Request-body validation for creating a Report — matches
// persistGeneratedReport's payload shape (common.ts). clientName/clientEmail
// are optional since a report can be saved without a client attached.
// role is required — the backend has no concept of agent/valuer/buyer/
// investor (that's a frontend URL/navigation choice, not an auth role), so
// the frontend must tell us which dashboard role generated this report.
import { z } from 'zod'

export const reportRoleValues = ['agent', 'valuer', 'buyer', 'investor'] as const

const segmentSchema = z.object({
    text: z.string(),
    highlight: z.boolean().optional(),
})

const sectionSchema = z.object({
    id: z.string(),
    title: z.string(),
    paragraphs: z.array(z.array(segmentSchema)),
})

const comparableSchema = z.object({
    id: z.string(),
    address: z.string(),
    price: z.number(),
    soldAgo: z.string(),
    beds: z.number(),
    baths: z.number(),
    parking: z.number(),
    areaSqm: z.number(),
    matchPercent: z.number(),
    distanceKm: z.number(),
})

const strategyCardSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    iconKey: z.string(),
})

export const createReportSchema = z.object({
    role: z.enum(reportRoleValues),
    clientId: z.string().uuid().optional(),
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
    // Snapshot fields — optional so older callers (or tests) that don't send
    // them still work; a report saved without these just has no rich replay
    // content later (see schema.prisma's Report model comment).
    priceRangeLow: z.number().optional(),
    priceRangeHigh: z.number().optional(),
    sections: z.array(sectionSchema).optional(),
    comparables: z.array(comparableSchema).optional(),
    strategyCards: z.array(strategyCardSchema).optional(),
})

export type CreateReportInput = z.infer<typeof createReportSchema>

// Optional on both share-link and send-email: attaches the report to a client
// (and/or records who it went to) at send time.
export const recipientSchema = z.object({
    clientId: z.string().uuid().optional(),
    clientName: z.string().trim().min(1).optional(),
    clientEmail: z.string().trim().email().optional(),
})

export const sendReportEmailSchema = z.object({
    clientId: z.string().uuid().optional(),
    clientName: z.string().trim().min(1, 'Client name is required.'),
    clientEmail: z.string().trim().email('A valid client email is required.'),
    note: z.string().trim().max(2000).optional(),
})

export type SendReportEmailInput = z.infer<typeof sendReportEmailSchema>
