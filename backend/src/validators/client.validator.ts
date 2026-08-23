import { z } from 'zod'

const numberField = z.coerce.number().int().nonnegative()
const decimalField = z.coerce.number().nonnegative()

export const createClientSchema = z.object({
  fullName: z.string().trim().min(1),
  email: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  status: z.enum(['prospecting', 'active', 'appraisal_sent', 'listing', 'sold']).default('prospecting'),
  notes: z.string().trim().optional(),
  addressLine: z.string().trim().min(1),
  suburb: z.string().trim().min(1),
  state: z.string().trim().min(1),
  postcode: z.string().trim().min(1),
  propertyType: z.string().trim().min(1),
  bedrooms: numberField,
  bathrooms: numberField,
  parking: numberField,
  landSizeSqm: decimalField,
})

export const updateClientSchema = createClientSchema.partial()
