import { useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap, useGSAP } from '../../../lib/gsap'
import { prefersReducedMotion } from '../../../lib/reduced-motion'

type PageTransitionProps = {
  children: ReactNode
}

/**
 * Fades/slides in whenever the route pathname changes — used to smooth out
 * dashboard tab and role switches, which otherwise swap content instantly.
 * Query-string-only changes (e.g. in-page search) don't retrigger it.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const { pathname } = useLocation()
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!containerRef.current || prefersReducedMotion()) return
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out' },
      )
    },
    { scope: containerRef, dependencies: [pathname] },
  )

  return <div ref={containerRef}>{children}</div>
}
