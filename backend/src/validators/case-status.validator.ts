// Request-body validation for updating a valuer case — a partial update,
// address or status or both. addressLine only ever updates the street
// line (propertyAddressLine), not suburb/state/postcode, avoiding the
// known address-parsing fragility flagged elsewhere.
import { z } from 'zod'

export const caseStatusValues = [
    'draft',
    'evidence_collection',
    'valuer_review',
    'reviewer_approval',
    'returned_for_revision',
    'approved',
    'exported',
] as const

export const updateCaseSchema = z.object({
    addressLine: z.string().trim().min(1).optional(),
    status: z.enum(caseStatusValues).optional(),
})

export type UpdateCaseInput = z.infer<typeof updateCaseSchema>
