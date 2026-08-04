import { useLocation, useNavigate } from 'react-router-dom'
import logoIcon from '../../../assets/icon.svg'
import { Button } from '../button/button'

const NAV_ORDER = [
  { type: 'scroll', label: 'Platform', sectionId: 'platform' },
  { type: 'route', label: 'Features', href: '/features' },
  { type: 'route', label: 'About', href: '/about' },
  { type: 'scroll', label: 'Resources', sectionId: 'resources' },
  { type: 'route', label: 'Plans', href: '/plans' },
] as const

function NavChevron({ pointUp = false }: { pointUp?: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={`ml-1 shrink-0 transition-transform ${pointUp ? 'rotate-180' : ''}`}
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
  const navigate = useNavigate()
  const location = useLocation()

  function scrollToSection(sectionId: string) {
    if (location.pathname === '/') {
      // Try to find the element directly first
      const el = document.getElementById(sectionId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }

      // Element not in DOM yet — LazyMount hasn't rendered it.
      // Scroll to the very bottom to force all lazy sections to mount,
      // then scroll to the target after they appear.
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })

      let attempts = 0
      const maxAttempts = 10
      const poll = setInterval(() => {
        attempts++
        const target = document.getElementById(sectionId)
        if (target) {
          clearInterval(poll)
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else if (attempts >= maxAttempts) {
          clearInterval(poll)
        }
      }, 150)
    } else {
      // Navigate to landing then scroll after render
      navigate(`/#${sectionId}`)
    }
  }

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
          {NAV_ORDER.map((item) => {
            if (item.type === 'scroll') {
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(item.sectionId)}
                    className="flex items-center text-sm font-medium text-relaive-navy/80 hover:text-relaive-primary transition-colors cursor-pointer bg-transparent border-none p-0"
                  >
                    {item.label}
                    <NavChevron />
                  </button>
                </li>
              )
            }

            const isActive = location.pathname === item.href
            return (
              <li key={item.label}>
                <a
                  href={item.href}
                  className={`font-button flex items-center text-sm font-medium transition-colors hover:text-relaive-primary ${
                    isActive ? 'text-relaive-primary' : 'text-relaive-navy/80'
                  }`}
                >
                  {item.label}
                  <NavChevron pointUp={isActive} />
                </a>
              </li>
            )
          })}
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
