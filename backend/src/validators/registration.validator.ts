import { z } from 'zod'

// Password rule of thumb for an appraisal/finance-adjacent product:
// 8+ chars, at least one letter and one number. Tighten later if the
// team wants a stricter policy (symbols, breach-list check, etc.).
export const registrationSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(120),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export type RegistrationInput = z.infer<typeof registrationSchema>
