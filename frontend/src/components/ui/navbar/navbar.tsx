import logoIcon from '../../../assets/icon.svg'
import { Button } from '../button/button'

const NAV_ITEMS = [
  { label: 'Platform', href: '#platform' },
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
  { label: 'Resources', href: '#resources' },
  { label: 'Plans', href: '/plans' },
] as const

function ChevronDown() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className="ml-1 shrink-0"
    >
      <path
        d="M2 4L6 8L10 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 shrink-0">
          <img src={logoIcon} alt="Relaive icon" className="h-12 w-12" />
          <div className="flex flex-col leading-tight">
            <span className="font-logo text-2xl font-bold text-relaive-navy tracking-tight">
              Relaive
            </span>
            <span className="text-xs text-relaive-gray">
              Real-estate AI Evaluation
            </span>
          </div>
        </a>

        {/* Nav links — hidden on small screens */}
        <ul className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                className="flex items-center text-sm font-medium text-relaive-navy/80 hover:text-relaive-primary transition-colors"
              >
                {label}
                <ChevronDown />
              </a>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button variant="primary" size="sm" href="/signin">
            Sign in
          </Button>
          <Button variant="link" href="/signup" className="text-sm font-semibold">
            Sign up
          </Button>
        </div>
      </nav>
    </header>
  )
}
