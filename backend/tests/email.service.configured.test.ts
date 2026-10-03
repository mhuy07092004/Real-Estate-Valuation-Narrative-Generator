import { afterEach, describe, expect, test, vi } from 'vitest'

process.env.SENDGRID_API_KEY = 'test-sendgrid-key'
process.env.SENDGRID_FROM_EMAIL = 'noreply@relaive.com.au'

const sendMock = vi.fn().mockResolvedValue(undefined)
const setApiKeyMock = vi.fn()

vi.mock('@sendgrid/mail', () => ({
    default: {
        setApiKey: setApiKeyMock,
        send: sendMock,
    },
}))

afterEach(() => {
    sendMock.mockClear()
})

describe('sendOtpEmail - configured', () => {
    test('sends to the given address, from the configured sender, with the code embedded in the HTML', async () => {
        const { sendOtpEmail } = await import('../src/services/email.service.js')

        await sendOtpEmail({ to: 'jane@example.com', code: '482913' })

        expect(sendMock).toHaveBeenCalledTimes(1)
        const msg = sendMock.mock.calls[0][0]
        expect(msg.to).toBe('jane@example.com')
        expect(msg.from).toBe('noreply@relaive.com.au')
        expect(msg.subject).toBe('Your Relaive verification code')
        expect(msg.html).toContain('482913')
    })
})

describe('sendReportEmail - configured', () => {
    test('includes the share link and falls back to "there" when clientName is blank', async () => {
        const { sendReportEmail } = await import('../src/services/email.service.js')

        await sendReportEmail({
            to: 'client@example.com',
            clientName: '',
            agentName: 'Bob Agent',
            shareUrl: 'https://relaive.com.au/r/abc123',
        })

        const msg = sendMock.mock.calls[0][0]
        expect(msg.subject).toBe('Your property appraisal report from Bob Agent')
        expect(msg.html).toContain('Hi there,')
        expect(msg.html).toContain('https://relaive.com.au/r/abc123')
        expect(msg.html).toContain('Bob Agent')
    })

    test('converts newlines in an optional note into <br/> tags and includes it only when given', async () => {
        const { sendReportEmail } = await import('../src/services/email.service.js')

        await sendReportEmail({
            to: 'client@example.com',
            clientName: 'Jane',
            agentName: 'Bob Agent',
            shareUrl: 'https://relaive.com.au/r/abc123',
            note: 'Line one\nLine two',
        })

        const msg = sendMock.mock.calls[0][0]
        expect(msg.html).toContain('Line one<br/>Line two')
    })

    test('omits the note paragraph entirely when no note is given', async () => {
        const { sendReportEmail } = await import('../src/services/email.service.js')

        await sendReportEmail({
            to: 'client@example.com',
            clientName: 'Jane',
            agentName: 'Bob Agent',
            shareUrl: 'https://relaive.com.au/r/abc123',
        })

        const msg = sendMock.mock.calls[0][0]
        expect(msg.html).not.toContain('<br/>')
    })
})
