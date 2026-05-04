import { useState } from 'react'
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
  const [menuOpen, setMenuOpen] = useState(false)

  const ctaElement = ctaHref ? (
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
  )

  return (
    <header className={`px-4 pt-4 md:px-12 md:pt-6 lg:px-16 ${className ?? ''}`}>
      <nav className="rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="text-2xl font-semibold tracking-tight">{logo}</div>

          {/* Desktop links */}
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

          {/* Desktop CTA */}
          <div className="hidden md:block">{ctaElement}</div>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-lg transition-colors hover:bg-white/10 md:hidden"
          >
            <span
              className={`block h-0.5 w-5 rounded-full bg-white transition-all duration-300 ${
                menuOpen ? 'translate-y-2 rotate-45' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-5 rounded-full bg-white transition-all duration-300 ${
                menuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-5 rounded-full bg-white transition-all duration-300 ${
                menuOpen ? '-translate-y-2 -rotate-45' : ''
              }`}
            />
          </button>
        </div>

        {/* Mobile dropdown */}
        <div
          className={`overflow-hidden transition-all duration-300 md:hidden ${
            menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex flex-col gap-1 border-t border-white/10 pb-2 pt-3">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/10 hover:text-gray-300"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 px-3">{ctaElement}</div>
          </div>
        </div>
      </nav>
    </header>
  )
}
