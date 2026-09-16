// Sends the report share link to a client's inbox via Gmail SMTP. Reuses the
// same share token/URL that "Get Shareable Link" produces (see
// report.service.ts's getOrCreateShareToken) — email is just another
// delivery channel for the same public link, not a separate report format.
import nodemailer from 'nodemailer'

const transporter =
    process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
        ? nodemailer.createTransport({
              service: 'gmail',
              auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
          })
        : null

export async function sendReportEmail(params: {
    to: string
    clientName: string
    agentName: string
    shareUrl: string
    note?: string
}): Promise<void> {
    if (!transporter) {
        throw new Error('Email sending is not configured (missing GMAIL_USER/GMAIL_APP_PASSWORD).')
    }

    const { to, clientName, agentName, shareUrl, note } = params

    await transporter.sendMail({
        from: `Relaive Reports <${process.env.GMAIL_USER}>`,
        to,
        subject: `Your property appraisal report from ${agentName}`,
        html: `
            <p>Hi ${clientName || 'there'},</p>
            ${note ? `<p>${note.replace(/\n/g, '<br/>')}</p>` : ''}
            <p><a href="${shareUrl}">View your report</a></p>
            <p>&mdash; ${agentName}</p>
        `,
    })
}
