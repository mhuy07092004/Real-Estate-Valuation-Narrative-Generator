type SkeletonProps = {
  className?: string
}

/**
 * Single pulsing placeholder block. No default border-radius — always pass
 * one explicit rounded-* class via className (e.g. rounded-full for a text
 * line/avatar, rounded-2xl for a card) so conflicting radius utilities never
 * both end up on the same element.
 */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div aria-hidden="true" className={`animate-pulse bg-relaive-gray/15 ${className}`} />
}
