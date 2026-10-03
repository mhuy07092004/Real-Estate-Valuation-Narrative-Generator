import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const sendMock = vi.fn()
const setApiKeyMock = vi.fn()

vi.mock('@sendgrid/mail', () => ({
    default: {
        setApiKey: setApiKeyMock,
        send: sendMock,
    },
}))

describe('email.service - not configured', () => {
    // SENDGRID_API_KEY / SENDGRID_FROM_EMAIL are unset in this test
    // environment, so the "not configured" guard is exercised by default.
    test('sendOtpEmail throws a clear config error and never calls SendGrid', async () => {
        const { sendOtpEmail } = await import('../src/services/email.service.js')
        await expect(sendOtpEmail({ to: 'a@example.com', code: '123456' })).rejects.toThrow(
            'Email sending is not configured (missing SENDGRID_API_KEY/SENDGRID_FROM_EMAIL).',
        )
        expect(sendMock).not.toHaveBeenCalled()
    })

    test('sendReportEmail throws the same config error and never calls SendGrid', async () => {
        const { sendReportEmail } = await import('../src/services/email.service.js')
        await expect(
            sendReportEmail({
                to: 'a@example.com',
                clientName: 'Jane',
                agentName: 'Bob',
                shareUrl: 'https://relaive.com.au/r/abc',
            }),
        ).rejects.toThrow('Email sending is not configured')
        expect(sendMock).not.toHaveBeenCalled()
    })
})
