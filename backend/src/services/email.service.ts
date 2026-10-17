// Sends the report share link to a client's inbox via SendGrid. Reuses the
// same share token/URL that "Get Shareable Link" produces (see
// report.service.ts's getOrCreateShareToken) — email is just another
// delivery channel for the same public link, not a separate report format.
//
// Uses SendGrid (HTTP API over 443) rather than Gmail SMTP: Render blocks
// outbound SMTP ports, which made the SMTP version hang indefinitely in
// production instead of failing fast. SendGrid's "Single Sender
// Verification" lets us send from a plain Gmail address to any recipient
// without owning a domain — see SENDGRID_FROM_EMAIL below.
import sgMail from '@sendgrid/mail'

if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

export async function sendOtpEmail(params: { to: string; code: string }): Promise<void> {
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
        throw new Error('Email sending is not configured (missing SENDGRID_API_KEY/SENDGRID_FROM_EMAIL).')
    }

    await sgMail.send({
        to: params.to,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: 'Your Relaive verification code',
        html: `
            <p>Your verification code is:</p>
            <p style="font-size:24px;font-weight:bold;letter-spacing:4px">${params.code}</p>
            <p>It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
        `,
    })
}

export async function sendPasswordResetEmail(params: { to: string; resetUrl: string }): Promise<void> {
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
        throw new Error('Email sending is not configured (missing SENDGRID_API_KEY/SENDGRID_FROM_EMAIL).')
    }

    await sgMail.send({
        to: params.to,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: 'Reset your Relaive password',
        html: `
            <p>We received a request to reset your Relaive password.</p>
            <p><a href="${params.resetUrl}">Choose a new password</a></p>
            <p>This link expires in 30 minutes and can only be used once. If you didn't request it, you can ignore this email.</p>
        `,
    })
}

// Everything in a contact enquiry is typed by an anonymous visitor, so it must
// be escaped before going into the HTML body.
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

export async function sendContactEmail(params: {
    to: string
    fullName: string
    email: string
    company?: string
    role?: string
    enquiryType: string
    subject: string
    message: string
    attachment?: { filename: string; content: Buffer; mimeType: string }
}): Promise<void> {
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
        throw new Error('Email sending is not configured (missing SENDGRID_API_KEY/SENDGRID_FROM_EMAIL).')
    }

    const { to, fullName, email, company, role, enquiryType, subject, message, attachment } = params
    const row = (label: string, value?: string) =>
        value ? `<tr><td style="padding:2px 12px 2px 0"><b>${label}</b></td><td>${escapeHtml(value)}</td></tr>` : ''

    await sgMail.send({
        to,
        from: process.env.SENDGRID_FROM_EMAIL,
        // Lets the team reply straight to the visitor.
        replyTo: { email, name: fullName },
        // Single line only: a newline in a header value would be header injection.
        subject: `[Contact – ${enquiryType}] ${subject.replace(/\s+/g, ' ')}`,
        html: `
            <table>
                ${row('Name', fullName)}
                ${row('Email', email)}
                ${row('Company', company)}
                ${row('Role', role)}
                ${row('Enquiry type', enquiryType)}
            </table>
            <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
        `,
        attachments: attachment
            ? [
                  {
                      content: attachment.content.toString('base64'),
                      filename: attachment.filename,
                      type: attachment.mimeType,
                      disposition: 'attachment',
                  },
              ]
            : undefined,
    })
}

export async function sendReportEmail(params: {
    to: string
    clientName: string
    agentName: string
    shareUrl: string
    note?: string
}): Promise<void> {
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
        throw new Error('Email sending is not configured (missing SENDGRID_API_KEY/SENDGRID_FROM_EMAIL).')
    }

    const { to, clientName, agentName, shareUrl, note } = params

    await sgMail.send({
        to,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: `Your property appraisal report from ${agentName}`,
        html: `
            <p>Hi ${clientName || 'there'},</p>
            ${note ? `<p>${note.replace(/\n/g, '<br/>')}</p>` : ''}
            <p><a href="${shareUrl}">View your report</a></p>
            <p>&mdash; ${agentName}</p>
        `,
    })
}
