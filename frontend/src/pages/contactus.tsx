import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Navbar } from '../components/ui/navbar/navbar'
import { Footer } from '../components/ui/footer/footer'
import { Button } from '../components/ui/button/button'
import { Input } from '../components/ui/input/input'
import { Card } from '../components/ui/card/card'

const MAX_MESSAGE_LENGTH = 2000

const ROLE_OPTIONS = [
  'Real Estate Agent',
  'Property Valuer',
  'Investor',
  'Buyer',
  'Other',
]

const ENQUIRY_OPTIONS = [
  'Customer Support',
  'Sales',
  'Partnerships',
  'General Enquiries',
]

const FIELD_CLASS =
  'w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm text-relaive-navy placeholder:text-relaive-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary'

type SupportCategory = {
  title: string
  description: string
  cta: string
  enquiry: string
  icon: ReactNode
}

function IconWrap({ children }: { children: ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const SUPPORT_CATEGORIES: SupportCategory[] = [
  {
    title: 'Customer Support',
    description: 'For technical problems and account issues.',
    cta: 'Get Support',
    enquiry: 'Customer Support',
    icon: (
      <IconWrap>
        <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
        <path d="M4 14h3v5H5a1 1 0 0 1-1-1v-4Z" />
        <path d="M20 14h-3v5h2a1 1 0 0 0 1-1v-4Z" />
      </IconWrap>
    ),
  },
  {
    title: 'Sales',
    description: 'For pricing, subscriptions, and enterprise enquiries.',
    cta: 'Talk to Sales',
    enquiry: 'Sales',
    icon: (
      <IconWrap>
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M15 7h6v6" />
      </IconWrap>
    ),
  },
  {
    title: 'Partnerships',
    description: 'For integrations and business partnerships.',
    cta: 'Partner with Us',
    enquiry: 'Partnerships',
    icon: (
      <IconWrap>
        <path d="M8 12l3 3a2 2 0 0 0 3 0l5-5a2 2 0 0 0-3-3l-1 1" />
        <path d="M16 12l-3-3a2 2 0 0 0-3 0l-5 5a2 2 0 0 0 3 3l1-1" />
      </IconWrap>
    ),
  },
  {
    title: 'General Enquiries',
    description: 'For general questions about Relaive.',
    cta: 'Send a Message',
    enquiry: 'General Enquiries',
    icon: (
      <IconWrap>
        <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12Z" />
      </IconWrap>
    ),
  },
]

const SOCIAL_LINKS: { label: string; href: string; icon: ReactNode }[] = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com',
    icon: (
      <IconWrap>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M8 11v5M8 8v.01M12 16v-5M12 13a2.5 2.5 0 0 1 5 0v3" />
      </IconWrap>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com',
    icon: (
      <IconWrap>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <path d="M17.5 6.5v.01" />
      </IconWrap>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com',
    icon: (
      <IconWrap>
        <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8a1 1 0 0 1 1-1Z" />
      </IconWrap>
    ),
  },
  {
    label: 'Email',
    href: 'mailto:hello@relaive.com',
    icon: (
      <IconWrap>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </IconWrap>
    ),
  },
]

function SelectField({
  id,
  label,
  placeholder,
  options,
  value,
  onChange,
}: {
  id: string
  label: string
  placeholder: string
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-relaive-navy">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${FIELD_CLASS} ${value ? '' : 'text-relaive-gray/70'}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function ContactUsPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [enquiry, setEnquiry] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [fileName, setFileName] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  function selectEnquiry(value: string) {
    setEnquiry(value)
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="relative min-h-screen bg-relaive-surface">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-6 py-14 sm:py-16">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-relaive-navy sm:text-4xl">How can we help?</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-relaive-gray sm:text-base">
            Get in touch with the Relaive team for support, sales, partnerships, or general
            enquiries.
          </p>
        </header>

        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SUPPORT_CATEGORIES.map(({ title, description, cta, enquiry: value, icon }) => (
            <Card key={title} className="items-start">
              <span className="mb-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-relaive-primary/10 text-relaive-primary">
                {icon}
              </span>
              <h3 className="text-base font-semibold text-relaive-navy">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-relaive-gray">{description}</p>
              <Button
                type="button"
                size="sm"
                className="mt-auto w-full !rounded-full bg-gradient-to-r from-relaive-secondary to-relaive-primary hover:from-relaive-secondary-hover hover:to-relaive-primary-hover"
                onClick={() => selectEnquiry(value)}
              >
                {cta}
              </Button>
            </Card>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <div id="contact-form" className="scroll-mt-24 lg:col-span-2">
            <Card className="!h-auto">
              <h2 className="text-xl font-semibold text-relaive-navy">Send us a message</h2>

              {submitted ? (
                <div className="mt-6 rounded-xl bg-relaive-secondary/10 p-6 text-sm text-relaive-navy">
                  Thanks for reaching out, {fullName || 'there'}! Our team will get back to you
                  within 2 business days.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      id="contact-name"
                      label="Full Name *"
                      placeholder="Jane Smith"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                    <Input
                      id="contact-email"
                      type="email"
                      label="Email Address *"
                      placeholder="jane@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      id="contact-company"
                      label="Company (optional)"
                      placeholder="Your company name"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                    <SelectField
                      id="contact-role"
                      label="User Type / Role"
                      placeholder="Select your role..."
                      options={ROLE_OPTIONS}
                      value={role}
                      onChange={setRole}
                    />
                  </div>

                  <SelectField
                    id="contact-enquiry"
                    label="Enquiry Type"
                    placeholder="Select enquiry type..."
                    options={ENQUIRY_OPTIONS}
                    value={enquiry}
                    onChange={setEnquiry}
                  />

                  <Input
                    id="contact-subject"
                    label="Subject *"
                    placeholder="Brief description of your enquiry"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="contact-message" className="text-sm font-medium text-relaive-navy">
                      Message *
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={6}
                      maxLength={MAX_MESSAGE_LENGTH}
                      placeholder="Tell us how we can help you..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className={`${FIELD_CLASS} resize-none`}
                    />
                    <p className="text-right text-xs text-relaive-gray">
                      {MAX_MESSAGE_LENGTH - message.length} characters remaining
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-relaive-navy">
                      Attach a file (optional)
                    </span>
                    <label
                      htmlFor="contact-file"
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-black/15 bg-relaive-surface/60 px-4 py-3 text-sm text-relaive-gray transition-colors hover:bg-relaive-surface"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7" />
                      </svg>
                      {fileName || 'Click to attach a file'}
                    </label>
                    <input
                      id="contact-file"
                      type="file"
                      className="sr-only"
                      onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    Send Message
                  </Button>
                </form>
              )}
            </Card>
          </div>

          <aside className="flex flex-col gap-6">
            <Card className="!h-auto">
              <h2 className="flex items-center gap-2 text-base font-semibold text-relaive-navy">
                <span className="text-relaive-primary">
                  <IconWrap>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </IconWrap>
                </span>
                Business Hours
              </h2>
              <dl className="mt-4 flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-relaive-navy">Monday – Friday</dt>
                  <dd className="font-medium text-relaive-primary">9:00am – 6:00pm AEST</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-relaive-navy">Saturday</dt>
                  <dd className="text-relaive-gray">Closed</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-relaive-navy">Sunday</dt>
                  <dd className="text-relaive-gray">Closed</dd>
                </div>
              </dl>
              <p className="mt-4 flex items-center gap-2 border-t border-black/5 pt-3 text-xs text-relaive-gray">
                <span className="h-2 w-2 rounded-full bg-relaive-secondary" aria-hidden="true" />
                Response within 2 business days
              </p>
            </Card>

            <Card className="!h-auto">
              <h2 className="text-base font-semibold text-relaive-navy">Follow Us</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {SOCIAL_LINKS.map(({ label, href, icon }) => (
                  <Button
                    key={label}
                    variant="outline"
                    size="sm"
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel="noreferrer"
                    className="gap-2 !bg-relaive-surface/60"
                  >
                    {icon}
                    {label}
                  </Button>
                ))}
              </div>
            </Card>
          </aside>
        </section>
      </main>

      <Footer />
    </div>
  )
}
