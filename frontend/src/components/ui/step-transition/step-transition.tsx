import { useRef } from 'react'
import { gsap, useGSAP } from '../../../lib/gsap'

export type StepTransitionProps = {
  /** Unique key identifying the current step; changing it retriggers the animation. */
  stepKey: number | string
  /** 1 = advancing forward, -1 = going back. Controls slide direction. */
  direction: 1 | -1
  children: React.ReactNode
  className?: string
}

export function StepTransition({
  stepKey,
  direction,
  children,
  className,
}: StepTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!containerRef.current) return

      gsap.fromTo(
        containerRef.current,
        { opacity: 0, x: direction * 28, filter: 'blur(4px)' },
        {
          opacity: 1,
          x: 0,
          filter: 'blur(0px)',
          duration: 0.5,
          ease: 'power3.out',
        },
      )
    },
    { scope: containerRef, dependencies: [stepKey] },
  )

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}
