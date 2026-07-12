import { useEffect } from 'react'
import { ReactLenis, useLenis } from 'lenis/react'
import type { ReactNode } from 'react'
import { gsap } from './gsap'

const LENIS_OPTIONS = {
  lerp: 0.1,
  duration: 1.2,
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 2,
  syncTouch: false,
  anchors: { offset: -80 },
} as const

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Drives the Lenis raf loop off the GSAP ticker so smooth scroll and any
 * future GSAP/ScrollTrigger animations stay perfectly in sync on one clock.
 */
function GsapTickerSync() {
  const lenis = useLenis()

  useEffect(() => {
    if (!lenis) return

    const update = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)

    return () => gsap.ticker.remove(update)
  }, [lenis])

  return null
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  if (prefersReducedMotion()) {
    return <>{children}</>
  }

  return (
    <ReactLenis root options={{ ...LENIS_OPTIONS, autoRaf: false }}>
      <GsapTickerSync />
      {children}
    </ReactLenis>
  )
}

export { useLenis }
