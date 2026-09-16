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
