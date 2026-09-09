// Request-body validation for Inspection create (a few fields, server
// attaches the default checklist) and update (the whole BuyerInspection
// shape, since the frontend always PUTs the complete object at once).
import { z } from 'zod'

export const inspectionChecklistItemStatusValues = ['ok', 'concern', 'major_issue', 'not_checked'] as const

const checklistItemSchema = z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    description: z.string(),
    status: z.enum(inspectionChecklistItemStatusValues),
    estimatedCost: z.number().nonnegative().optional(),
})

export const createInspectionSchema = z.object({
    addressLine: z.string().trim().min(1, 'Address is required.'),
    suburb: z.string().trim().min(1, 'Suburb is required.'),
    inspectionDate: z.string().trim().min(1, 'Inspection date is required.'),
    agents: z.array(z.string().trim().min(1)).min(1, 'At least one agent is required.'),
})

export const updateInspectionSchema = z.object({
    address: z.string().trim().min(1, 'Address is required.'),
    suburb: z.string().trim().min(1, 'Suburb is required.'),
    inspectionDate: z.string().trim().min(1, 'Inspection date is required.'),
    agents: z.array(z.string().trim().min(1)).min(1, 'At least one agent is required.'),
    overallNotes: z.string(),
    checklist: z.array(checklistItemSchema),
})

export type InspectionChecklistItem = z.infer<typeof checklistItemSchema>
export type CreateInspectionInput = z.infer<typeof createInspectionSchema>
export type UpdateInspectionInput = z.infer<typeof updateInspectionSchema>
