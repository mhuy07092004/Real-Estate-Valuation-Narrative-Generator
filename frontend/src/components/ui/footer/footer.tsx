const LEGAL_LINKS = [
  { label: 'Terms of Service', href: '#terms' },
  { label: 'Privacy Policy', href: '#privacy' },
  { label: 'Refund Policy', href: '#refund' },
] as const

const TEAM_MEMBERS = [
  {
    initials: 'HT',
    name: 'Hoang Thanh Truc Nguyen',
    role: 'Project Manager - UI/UX Designer',
    email: 'lisanguyen1135@gmail.com',
  },
  {
    initials: 'TT',
    name: 'Thi Tuong Vy Tran',
    role: 'UI/UX Designer',
    email: 'tuongvy.122004@gmail.com',
  },
  {
    initials: 'HM',
    name: 'Huy Minh Loi',
    role: 'Frontend Engineer',
    email: 'mhuy07092004@gmail.com',
  },
  {
    initials: 'TL',
    name: 'The Long Tran',
    role: 'Data & AI - Backend',
    email: 'tranthelong1405@gmail.com',
  },
  {
    initials: 'MP',
    name: 'Minh Phan',
    role: 'Backend Engineer',
    email: 'austurtles1708@gmail.com',
  },
] as const

const SOCIAL_LINKS = [
  {
    label: 'LinkedIn',
    href: '#linkedin',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.126 0 2.063 2.063 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: '#instagram',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    label: 'GitHub',
    href: '#github',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
  {
    label: 'Email',
    href: 'mailto:hello@relaive.com',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M22 7l-10 7L2 7" />
      </svg>
    ),
  },
] as const

function FooterLinkGroup({
  title,
  links,
}: {
  title: string
  links: readonly { label: string; href: string }[]
}) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
        {title}
      </h3>
      <ul className="mt-5 flex flex-col gap-3.5">
        {links.map(({ label, href }) => (
          <li key={label}>
            <a
              href={href}
              className="text-[15px] font-medium text-white/90 transition-colors hover:text-white"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer id="resources" className="bg-[#152a42] px-6 py-16 md:px-10 md:py-20">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.7fr_2fr] lg:gap-16">
        <div className="flex flex-col gap-5">
          <a href="/" className="inline-flex w-fit items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-relaive-secondary text-white">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 3.2 3.2 10.4V21a.8.8 0 0 0 .8.8h5.4v-6.2h5.2V21.8H20a.8.8 0 0 0 .8-.8V10.4L12 3.2Z" />
              </svg>
            </span>
            <div className="flex flex-col leading-tight">
              <span className="font-logo text-xl font-bold tracking-tight text-white">
                Relaive
              </span>
              <span className="text-xs text-white/50">Property Intelligence</span>
            </div>
          </a>
          <p className="max-w-xs text-[15px] leading-relaxed text-white/55">
            AI-powered property valuation intelligence for the Australian real
            estate market. Professional appraisals in seconds.
          </p>
          <div className="mt-1 flex items-center gap-2.5">
            {SOCIAL_LINKS.map(({ label, href, icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/8 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>

        <FooterLinkGroup title="Legal" links={LEGAL_LINKS} />

        <div>
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Our Team
            </h3>
            <a
              href="mailto:hello@relaive.com"
              className="inline-flex shrink-0 items-center rounded-full border border-relaive-secondary/80 px-4 py-1.5 text-[13px] font-medium text-white/90 transition-colors hover:border-relaive-secondary hover:bg-white/5"
            >
              Contact Us
            </a>
          </div>
          <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-white/55">
            Relaive was built by a passionate team of designers, engineers, and
            AI researchers — united by the goal of making property intelligence
            transparent and accessible.
          </p>
          <ul className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {TEAM_MEMBERS.map(({ initials, name, role, email }) => (
              <li key={email} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-relaive-secondary text-[12px] font-semibold tracking-wide text-white">
                  {initials}
                </span>
                <div className="min-w-0 leading-snug">
                  <p className="text-[15px] font-semibold text-white">{name}</p>
                  <p className="mt-0.5 text-[13px] text-white/50">{role}</p>
                  <a
                    href={`mailto:${email}`}
                    className="mt-1 inline-block text-[13px] text-relaive-secondary transition-colors hover:text-relaive-accent"
                  >
                    {email}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
