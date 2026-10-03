import { z } from 'zod'

export const autocompleteQuerySchema = z.object({
  input: z.string().trim().min(1, 'input is required'),
  sessionToken: z.string().trim().min(1).optional(),
})
