// Request-body validation for saving a property — every field is required
// since the frontend always has all of them available (either from a
// comparable-sale search's subjectProperty, or a property-search result).
import { z } from 'zod'

export const createSavedPropertySchema = z.object({
    addressLine: z.string().trim().min(1, 'Address is required.'),
    propertyType: z.string().trim().min(1, 'Property type is required.'),
    bedrooms: z.number().int().nonnegative(),
    bathrooms: z.number().int().nonnegative(),
    areaSqm: z.number().nonnegative(),
})

export type CreateSavedPropertyInput = z.infer<typeof createSavedPropertySchema>
