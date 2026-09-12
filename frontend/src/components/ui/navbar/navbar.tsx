import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import logoIcon from '../../../assets/icon.svg'
import { usePlansMenuListener } from '../../../hooks/use-open-plans-menu'
import { Button } from '../button/button'
import { FeaturesDropdown } from './features-dropdown'
import { PlatformDropdown } from './platform-dropdown'
import { AboutDropdown } from './about-dropdown'
import { PlansDropdown } from './plans-dropdown'

const NAV_ORDER = [
  { type: 'dropdown', label: 'Platform', key: 'platform' },
  { type: 'dropdown', label: 'Features', key: 'features' },
  { type: 'dropdown', label: 'About', key: 'about' },
  { type: 'dropdown', label: 'Plans', key: 'plans' },
] as const

type OpenMenu = 'platform' | 'features' | 'about' | 'plans' | null

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

// Time (ms) the closing panel needs to fade + collapse before the next one
// starts opening. Keeps the two panels from overlapping mid-transition and
// removes the "khựng" hitch when switching straight between menu items.
const MENU_SWITCH_DELAY = 200

export function Navbar() {
  const location = useLocation()
  const headerRef = useRef<HTMLElement>(null)
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)
  const switchTimeoutRef = useRef<number | null>(null)
  const openPlansMenu = useCallback(() => setOpenMenu('plans'), [])

  usePlansMenuListener(openPlansMenu)

  const clearSwitchTimeout = useCallback(() => {
    if (switchTimeoutRef.current !== null) {
      window.clearTimeout(switchTimeoutRef.current)
      switchTimeoutRef.current = null
    }
  }, [])

  const handleNavClick = useCallback(
    (key: Exclude<OpenMenu, null>) => {
      clearSwitchTimeout()
      setOpenMenu((current) => {
        if (current === key) return null
        if (current === null) return key
        // Another menu is already open: close it first, then open the newly
        // selected one once the close animation has mostly finished instead
        // of animating both panels on top of each other at once.
        switchTimeoutRef.current = window.setTimeout(() => {
          setOpenMenu(key)
          switchTimeoutRef.current = null
        }, MENU_SWITCH_DELAY)
        return null
      })
    },
    [clearSwitchTimeout],
  )

  useEffect(() => {
    clearSwitchTimeout()
    setOpenMenu(null)
  }, [location.pathname, clearSwitchTimeout])

  useEffect(() => () => clearSwitchTimeout(), [clearSwitchTimeout])

  useEffect(() => {
    if (!openMenu) return

    function handlePointerDown(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        clearSwitchTimeout()
        setOpenMenu(null)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        clearSwitchTimeout()
        setOpenMenu(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openMenu, clearSwitchTimeout])

  return (
    <header ref={headerRef} className="relative sticky top-0 z-50 w-full border-b border-black/5 bg-white">
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
            const isOpen = openMenu === item.key
            return (
              <li key={item.label}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  onClick={() => handleNavClick(item.key)}
                  className={`flex items-center text-sm font-medium transition-colors cursor-pointer bg-transparent border-none p-0 ${
                    isOpen
                      ? 'text-relaive-primary'
                      : 'text-relaive-navy/80 hover:text-relaive-primary'
                  }`}
                >
                  {item.label}
                  <NavChevron pointUp={isOpen} />
                </button>
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

      <PlatformDropdown open={openMenu === 'platform'} />
      <FeaturesDropdown open={openMenu === 'features'} />
      <AboutDropdown open={openMenu === 'about'} />
      <PlansDropdown open={openMenu === 'plans'} />
    </header>
  )
}
