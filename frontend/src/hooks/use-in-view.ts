import { useEffect, useRef, useState } from 'react'

export type UseInViewOptions = {
  /** Grows the viewport box so content starts loading before it's visible. */
  rootMargin?: string
  threshold?: number | number[]
  /** Stop observing after the first intersection (default: true). */
  once?: boolean
}

export type UseInViewResult<T extends Element> = {
  ref: (node: T | null) => void
  inView: boolean
}

/**
 * Tracks whether an element has entered the viewport (or the expanded
 * `rootMargin` box around it) using IntersectionObserver.
 *
 * Falls back to "always in view" when IntersectionObserver is unavailable
 * (very old browsers, SSR) so content is never permanently hidden.
 */
export function useInView<T extends Element>({
  rootMargin = '200px 0px',
  threshold = 0,
  once = true,
}: UseInViewOptions = {}): UseInViewResult<T> {
  const [inView, setInView] = useState(false)
  const elementRef = useRef<T | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const setRef = (node: T | null) => {
    if (observerRef.current && elementRef.current) {
      observerRef.current.unobserve(elementRef.current)
    }

    elementRef.current = node

    if (node && observerRef.current) {
      observerRef.current.observe(node)
    }
  }

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return

        setInView(true)
        if (once) observer.disconnect()
      },
      { rootMargin, threshold },
    )

    observerRef.current = observer

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootMargin, once])

  return { ref: setRef, inView }
}
