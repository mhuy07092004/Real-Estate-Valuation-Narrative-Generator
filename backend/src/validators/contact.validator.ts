import { z } from 'zod'

// Option lists mirror the dropdowns on the frontend's /contact-us page.
export const CONTACT_ROLES = ['Real Estate Agent', 'Property Valuer', 'Investor', 'Buyer', 'Other'] as const
export const CONTACT_ENQUIRY_TYPES = ['Customer Support', 'Sales', 'Partnerships', 'General Enquiries'] as const

export const MAX_CONTACT_MESSAGE_LENGTH = 2000

// Empty string from an untouched <select> / blank input means "not provided".
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined))

export const contactSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(120),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  company: optionalText(120),
  role: z
    .string()
    .optional()
    .transform((value) => (value ? value : undefined))
    .pipe(z.enum(CONTACT_ROLES).optional()),
  enquiryType: z
    .string()
    .optional()
    .transform((value) => (value ? value : 'General Enquiries'))
    .pipe(z.enum(CONTACT_ENQUIRY_TYPES)),
  subject: z.string().trim().min(1, 'Subject is required').max(150),
  message: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .max(MAX_CONTACT_MESSAGE_LENGTH, `Message must be at most ${MAX_CONTACT_MESSAGE_LENGTH} characters`),
})

export type ContactInput = z.infer<typeof contactSchema>
