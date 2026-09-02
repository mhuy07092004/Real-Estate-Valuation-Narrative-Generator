/** Shared check so GSAP-driven UI (page transitions, etc.) can skip motion when requested. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
