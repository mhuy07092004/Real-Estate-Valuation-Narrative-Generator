import { z } from 'zod'

const numberField = z.coerce.number().int().nonnegative()
const decimalField = z.coerce.number().nonnegative()

const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()

export const createSavedPropertySchema = z.object({
  label: z.string().trim().optional(),
  addressLine: z.string().trim().min(1),
  suburb: z.string().trim().min(1),
  state: z.string().trim().min(1),
  postcode: z.string().trim().min(1),
  propertyType: z.string().trim().min(1),
  bedrooms: numberField,
  bathrooms: numberField,
  parking: numberField,
  landSizeSqm: decimalField,
  soldDateFrom: dateField,
  soldDateTo: dateField,
  filterPropertyType: z.string().trim().optional(),
})

export const updateSavedPropertySchema = createSavedPropertySchema.partial()
