import type { ZodError } from 'zod'

export function formatZodError(err: ZodError): Record<string, string> {
  const fieldErrors = err.flatten().fieldErrors
  const errors: Record<string, string> = {}
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages?.[0]) errors[field] = messages[0]
  }
  return errors
}
