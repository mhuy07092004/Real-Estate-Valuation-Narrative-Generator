import type { ReactNode } from 'react'

export type NavbarLink = {
  label: string
  href: string
}

export type NavbarProps = {
  logo?: ReactNode
  links?: NavbarLink[]
  ctaLabel?: string
  onCtaClick?: () => void
  /** Use when navigating with react-router etc. */
  ctaHref?: string
  className?: string
}

const DEFAULT_LINKS: NavbarLink[] = [
  { label: 'Home', href: '#' },
  { label: 'Investing', href: '#' },
  { label: 'Building', href: '#' },
  { label: 'Advisory', href: '#' },
]

export function Navbar({
  logo = 'Relaive',
  links = DEFAULT_LINKS,
  ctaLabel = 'Start a Chat',
  onCtaClick,
  ctaHref,
  className,
}: NavbarProps) {
  return (
    <header className={`px-6 pt-6 md:px-12 lg:px-16 ${className ?? ''}`}>
      <nav className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <div className="text-2xl font-semibold tracking-tight">{logo}</div>
        <div className="hidden items-center gap-8 text-sm md:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="transition-colors hover:text-gray-300"
            >
              {link.label}
            </a>
          ))}
        </div>
        {ctaHref ? (
          <a
            href={ctaHref}
            onClick={onCtaClick}
            className="rounded-lg bg-white px-6 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-100"
          >
            {ctaLabel}
          </a>
        ) : (
          <button
            type="button"
            onClick={onCtaClick}
            className="rounded-lg bg-white px-6 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-100"
          >
            {ctaLabel}
          </button>
        )}
      </nav>
    </header>
  )
}
