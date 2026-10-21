// Author: Minh Huy Loi
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import logoIcon from '../../../assets/icon.svg'
import { useAuth } from '../../../features/auth/hooks/use-auth'
import { usePlansMenuListener } from '../../../hooks/use-open-plans-menu'
import { Button } from '../button/button'
import { FeaturesDropdown } from './features-dropdown'
import { PlatformDropdown } from './platform-dropdown'
import { AboutDropdown } from './about-dropdown'
import { PlansDropdown } from './plans-dropdown'
import { MobileNavMenu } from './mobile-nav-menu'

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
  const { isAuthenticated, isLoading } = useAuth()
  const headerRef = useRef<HTMLElement>(null)
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
    setMobileMenuOpen(false)
  }, [location.pathname, clearSwitchTimeout])

  useEffect(() => () => clearSwitchTimeout(), [clearSwitchTimeout])

  const handleMobileSelect = useCallback(
    (key: string) => {
      setMobileMenuOpen(false)
      handleNavClick(key as Exclude<OpenMenu, null>)
    },
    [handleNavClick],
  )

  const toggleMobileMenu = useCallback(() => {
    clearSwitchTimeout()
    setOpenMenu(null)
    setMobileMenuOpen((open) => !open)
  }, [clearSwitchTimeout])

  useEffect(() => {
    if (!openMenu && !mobileMenuOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        clearSwitchTimeout()
        setOpenMenu(null)
        setMobileMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        clearSwitchTimeout()
        setOpenMenu(null)
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openMenu, mobileMenuOpen, clearSwitchTimeout])

  return (
    <header ref={headerRef} className="relative sticky top-0 z-50 w-full border-b border-black/5 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
        {/* Logo */}
        <a href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <img src={logoIcon} alt="Relaive icon" className="h-10 w-10 shrink-0 sm:h-12 sm:w-12" />
          <div className="flex flex-col leading-tight">
            <span className="font-logo text-2xl font-bold text-relaive-navy tracking-tight">
              Relaive
            </span>
            <span className="hidden text-xs text-relaive-gray sm:block">
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
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {isLoading ? null : isAuthenticated ? (
            <Button variant="primary" size="sm" href="/dashboard" className="max-md:hidden">
              Go to Dashboard
            </Button>
          ) : (
            <div className="flex items-center gap-2 sm:gap-4 max-md:hidden">
              <Button
                variant={location.pathname === '/signup' ? 'link' : 'primary'}
                size="sm"
                href="/signin"
                className={location.pathname === '/signup' ? 'text-sm font-semibold' : undefined}
              >
                Sign in
              </Button>
              <Button
                variant={location.pathname === '/signup' ? 'primary' : 'link'}
                size="sm"
                href="/signup"
                className={location.pathname === '/signup' ? undefined : 'text-sm font-semibold'}
              >
                Sign up
              </Button>
            </div>
          )}
          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            onClick={toggleMobileMenu}
            className="flex size-10 items-center justify-center rounded-lg text-relaive-navy transition-colors hover:bg-relaive-navy/5 md:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d={mobileMenuOpen ? 'M6 6l12 12M18 6L6 18' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </nav>

      <MobileNavMenu
        open={mobileMenuOpen}
        items={NAV_ORDER}
        onSelect={handleMobileSelect}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
      />

      <PlatformDropdown open={openMenu === 'platform'} />
      <FeaturesDropdown open={openMenu === 'features'} />
      <AboutDropdown open={openMenu === 'about'} />
      <PlansDropdown open={openMenu === 'plans'} />
    </header>
  )
}
