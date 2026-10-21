// Author: The Long Tran
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../src/services/email.service.js', () => ({ sendContactEmail: vi.fn() }))

import { sendContactEmail } from '../src/services/email.service.js'
import {
    ContactRateLimitError,
    resetContactRateLimit,
    submitContactMessage,
} from '../src/services/contact.service.js'
import { contactSchema } from '../src/validators/contact.validator.js'

const valid = { fullName: 'Jane', email: 'Jane@Example.com', subject: 'Hi', message: 'Hello there' }

describe('contactSchema', () => {
    test('normalises email and defaults blank enquiry type / role', () => {
        const parsed = contactSchema.parse({ ...valid, enquiryType: '', role: '', company: '' })
        expect(parsed.email).toBe('jane@example.com')
        expect(parsed.enquiryType).toBe('General Enquiries')
        expect(parsed.role).toBeUndefined()
        expect(parsed.company).toBeUndefined()
    })

    test('requires name, valid email, subject and message', () => {
        expect(() => contactSchema.parse({ ...valid, fullName: ' ' })).toThrow()
        expect(() => contactSchema.parse({ ...valid, email: 'bad' })).toThrow()
        expect(() => contactSchema.parse({ ...valid, subject: '' })).toThrow()
        expect(() => contactSchema.parse({ ...valid, message: '' })).toThrow()
    })

    test('rejects a message over 2000 characters and unknown enquiry types', () => {
        expect(() => contactSchema.parse({ ...valid, message: 'a'.repeat(2001) })).toThrow()
        expect(() => contactSchema.parse({ ...valid, enquiryType: 'Hacking' })).toThrow()
    })
})

describe('submitContactMessage', () => {
    beforeEach(() => {
        process.env.SENDGRID_FROM_EMAIL = 'team@example.com'
        delete process.env.CONTACT_EMAIL_TO
    })
    afterEach(() => {
        vi.clearAllMocks()
        resetContactRateLimit()
    })

    const input = contactSchema.parse(valid)

    test('emails the team inbox, falling back to the sender address', async () => {
        await submitContactMessage(input, undefined, '1.1.1.1')
        expect(vi.mocked(sendContactEmail).mock.calls[0][0].to).toBe('team@example.com')

        process.env.CONTACT_EMAIL_TO = 'inbox@example.com'
        await submitContactMessage(input, undefined, '2.2.2.2')
        expect(vi.mocked(sendContactEmail).mock.calls[1][0].to).toBe('inbox@example.com')
    })

    test('passes the attachment through', async () => {
        const attachment = { filename: 'a.pdf', content: Buffer.from('x'), mimeType: 'application/pdf' }
        await submitContactMessage(input, attachment, '1.1.1.1')
        expect(vi.mocked(sendContactEmail).mock.calls[0][0].attachment).toBe(attachment)
    })

    test('limits one IP to 5 messages an hour, other IPs unaffected', async () => {
        for (let i = 0; i < 5; i++) await submitContactMessage(input, undefined, '3.3.3.3')
        await expect(submitContactMessage(input, undefined, '3.3.3.3')).rejects.toBeInstanceOf(ContactRateLimitError)
        await expect(submitContactMessage(input, undefined, '4.4.4.4')).resolves.toBeUndefined()
        expect(sendContactEmail).toHaveBeenCalledTimes(6)
    })
})
