import type { ZodError } from 'zod'

// Shared by geocode.controller.ts and places.controller.ts. Flattens a
// ZodError into a flat field -> first-message record, matching the
// { success, message, errors } / { error, details } envelopes used across
// the backend — same logic as the `zodErrors()` helper duplicated inline in
// client.controller.ts and report.controller.ts, just centralized here.
export function formatZodError(err: ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  const flattened = err.flatten().fieldErrors
  for (const [field, messages] of Object.entries(flattened)) {
    if (messages?.[0]) errors[field] = messages[0]
  }
  return errors
}
