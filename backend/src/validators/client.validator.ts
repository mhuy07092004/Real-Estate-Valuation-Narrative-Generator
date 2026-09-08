// Request-body validation for Client create/update — required fields for a
// new client, all fields optional for a partial update.
import { z } from 'zod'

export const clientStatusValues = ['prospecting', 'active', 'appraisal_sent', 'listing', 'sold'] as const

export const createClientSchema = z.object({
    fullName: z.string().trim().min(1, 'Full name is required.'),
    email: z.string().trim().email('A valid email is required.'),
    phone: z.string().trim().min(1, 'Phone is required.'),
    status: z.enum(clientStatusValues).default('prospecting'),
    notes: z.string().trim().optional(),
    addressLine: z.string().trim().min(1, 'Address is required.'),
    suburb: z.string().trim().min(1, 'Suburb is required.'),
    state: z.string().trim().min(1, 'State is required.'),
    postcode: z.string().trim().min(1, 'Postcode is required.'),
})

export const updateClientSchema = createClientSchema.partial()

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
