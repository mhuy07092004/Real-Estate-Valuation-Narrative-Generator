import { z } from 'zod'

export const geocodeQuerySchema = z.object({
  address: z.string().trim().min(1, 'address is required'),
})
