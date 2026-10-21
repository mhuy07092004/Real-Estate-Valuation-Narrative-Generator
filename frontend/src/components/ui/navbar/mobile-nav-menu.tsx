// Author: Minh Huy Loi
import { Button } from '../button/button'

type MobileNavItem = { label: string; key: string }

type MobileNavMenuProps = {
  open: boolean
  items: readonly MobileNavItem[]
  onSelect: (key: string) => void
  isAuthenticated: boolean
  isLoading: boolean
}

/** Mobile-only (below md) sheet listing the mega-menu entries and auth actions. */
export function MobileNavMenu({ open, items, onSelect, isAuthenticated, isLoading }: MobileNavMenuProps) {
  if (!open) return null

  return (
    <div
      id="mobile-nav-menu"
      data-lenis-prevent
      className="absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-100%)] overflow-y-auto overscroll-contain border-b border-black/5 bg-white px-4 pb-5 pt-2 shadow-[0_16px_40px_rgba(26,32,44,0.08)] md:hidden"
    >
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item.key} className="border-b border-black/5 last:border-b-0">
            <button
              type="button"
              onClick={() => onSelect(item.key)}
              className="flex min-h-12 w-full items-center justify-between text-left text-base font-medium text-relaive-navy"
            >
              {item.label}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-relaive-gray">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      {isLoading ? null : (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {isAuthenticated ? (
            <Button variant="primary" size="md" href="/dashboard" className="w-full">
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button variant="primary" size="md" href="/signin" className="w-full">
                Sign in
              </Button>
              <Button variant="outline" size="md" href="/signup" className="w-full">
                Sign up
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
