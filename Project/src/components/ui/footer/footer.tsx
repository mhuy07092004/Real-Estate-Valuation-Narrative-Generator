import type { ReactNode } from 'react'

export type FooterLinkItem = {
  label: string
  href: string
}

export type FooterColumnMock = {
  title: string
  links: FooterLinkItem[]
}

export type FooterMockData = {
  brand: ReactNode
  tagline: string
  columns: FooterColumnMock[]
  socialLinks: FooterLinkItem[]
  legalLinks: FooterLinkItem[]
  copyright: string
}

/** Thay đổi nội dung footer tại đây hoặc truyền `data` vào `<Footer />`. */
export const mockFooterData: FooterMockData = {
  brand: 'Relaive',
  tagline:
    'We back visionaries and help build what comes next. Investing, building, advisory — one partner.',
  columns: [
    {
      title: 'Company',
      links: [
        { label: 'Story', href: '#' },
        { label: 'Team', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Press', href: '#' },
      ],
    },
    {
      title: 'Focus',
      links: [
        { label: 'Investing', href: '#' },
        { label: 'Building', href: '#' },
        { label: 'Advisory', href: '#' },
        { label: 'Portfolio', href: '#' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Insights', href: '#' },
        { label: 'Newsletter', href: '#' },
        { label: 'FAQ', href: '#' },
        { label: 'Contact', href: '#' },
      ],
    },
  ],
  socialLinks: [
    { label: 'LinkedIn', href: '#' },
    { label: 'X', href: '#' },
  ],
  legalLinks: [
    { label: 'Privacy', href: '#' },
    { label: 'Terms', href: '#' },
    { label: 'Cookies', href: '#' },
  ],
  copyright: '© 2026 Relaive. All rights reserved.',
}

export type FooterProps = {
  data?: FooterMockData
  className?: string
}

export function Footer({ data = mockFooterData, className }: FooterProps) {
  return (
    <footer
      className={`border-t border-white/[0.08] bg-[#050505] px-6 pb-14 pt-14 md:px-12 lg:px-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <p className="text-2xl font-semibold tracking-tight text-white">{data.brand}</p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-gray-400">
              {data.tagline}
            </p>
          </div>

          {data.columns.map((column) => (
            <div key={column.title} className="lg:col-span-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-500">
                {column.title}
              </p>
              <ul className="mt-5 space-y-3.5 text-sm">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <a
                      href={link.href}
                      className="text-gray-300 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-8 border-t border-white/[0.08] pt-10 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-400">
            {data.socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500">
            {data.legalLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="transition-colors hover:text-gray-400"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <p className="mt-10 text-xs text-gray-600">{data.copyright}</p>
      </div>
    </footer>
  )
}
