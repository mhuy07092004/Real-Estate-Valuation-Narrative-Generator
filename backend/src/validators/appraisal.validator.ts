import { z } from 'zod'

export const propertyInputSchema = z.object({
  address: z.string().trim().min(1, 'Address is required'),
  propertyType: z.string().trim().min(1, 'Property type is required'),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  parking: z.number().int().min(0),
  landSizeSqm: z.number().min(0),
})

export const finalizeReportSchema = z.object({
  reportTemplateId: z.string().trim().min(1, 'reportTemplateId is required'),
})
