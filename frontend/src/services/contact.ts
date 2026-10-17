import { API_BASE_URL } from './api-client'

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024

export type ContactMessageInput = {
  fullName: string
  email: string
  company: string
  role: string
  enquiryType: string
  subject: string
  message: string
  attachment: File | null
}

export class ContactError extends Error {
  readonly errors?: Record<string, string>

  constructor(message: string, errors?: Record<string, string>) {
    super(message)
    this.name = 'ContactError'
    this.errors = errors
  }
}

// Plain fetch with FormData (not fetchJson): the browser must set the multipart
// Content-Type boundary itself, and the endpoint is public, so no auth header.
export async function sendContactMessage(input: ContactMessageInput): Promise<void> {
  const { attachment, ...fields } = input
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) form.append(key, value)
  if (attachment) form.append('attachment', attachment)

  const response = await fetch(`${API_BASE_URL}/api/contact`, { method: 'POST', body: form })
  const body = (await response.json().catch(() => null)) as
    | { success: true }
    | { success: false; message: string; errors?: Record<string, string> }
    | null

  if (!response.ok || !body?.success) {
    throw new ContactError(
      body && !body.success ? body.message : 'Could not send your message. Please try again.',
      body && !body.success ? body.errors : undefined,
    )
  }
}
