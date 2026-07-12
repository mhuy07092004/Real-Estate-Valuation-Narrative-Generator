import { useEffect, useState, type ReactNode } from 'react'
import { useInView } from '../../../hooks/use-in-view'

type LazyMountProps = {
  children: ReactNode
  /**
   * Reserved space for the placeholder so the page height doesn't jump
   * (and Lenis's scroll-height cache doesn't desync) once content mounts.
   */
  minHeight?: number | string
  /** How far ahead of the viewport to start mounting content. */
  rootMargin?: string
  className?: string
  placeholder?: ReactNode
}

/**
 * Defers mounting expensive below-the-fold sections until the user scrolls
 * near them, so the initial page load and the smooth-scroll loop stay light.
 * A fixed-height skeleton keeps layout stable, and content fades in once
 * mounted to avoid a jarring pop-in.
 */
export function LazyMount({
  children,
  minHeight = 420,
  rootMargin = '200px 0px',
  className,
  placeholder,
}: LazyMountProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin })
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    if (!inView) return
    const frame = requestAnimationFrame(() => setIsRevealed(true))
    return () => cancelAnimationFrame(frame)
  }, [inView])

  return (
    <div
      ref={ref}
      className={className}
      style={!inView ? { minHeight } : undefined}
    >
      {inView ? (
        <div
          className={`transition-opacity duration-500 ease-out ${
            isRevealed ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {children}
        </div>
      ) : (
        placeholder ?? null
      )}
    </div>
  )
}
