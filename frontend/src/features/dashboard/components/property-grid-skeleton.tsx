import { Skeleton } from '../../../components/ui/skeleton/skeleton'

function CompactCardSkeleton() {
  return (
    <div
      className="rounded-2xl border border-black/5 bg-white p-4 shadow-[0_4px_24px_rgba(26,32,44,0.06)]"
      aria-hidden="true"
    >
      <Skeleton className="h-4 w-3/4 rounded-full" />
      <Skeleton className="mt-2 h-3 w-1/3 rounded-full opacity-70" />
      <Skeleton className="mt-3 h-5 w-24 rounded-full" />
      <div className="mt-3 flex items-center gap-2.5">
        <Skeleton className="h-3 w-8 rounded-full" />
        <Skeleton className="h-3 w-8 rounded-full" />
        <Skeleton className="h-3 w-12 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-9 w-full rounded-full" />
    </div>
  )
}

function FullCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_4px_24px_rgba(26,32,44,0.06)]"
      aria-hidden="true"
    >
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div>
          <Skeleton className="h-4 w-2/3 rounded-full" />
          <Skeleton className="mt-2 h-3 w-1/2 rounded-full opacity-70" />
        </div>
        <div>
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="mt-2 h-3 w-40 rounded-full opacity-70" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-3 w-8 rounded-full" />
          <Skeleton className="h-3 w-8 rounded-full" />
          <Skeleton className="h-3 w-12 rounded-full" />
          <Skeleton className="h-3 w-8 rounded-full" />
        </div>
        <Skeleton className="mt-auto h-10 w-full rounded-full" />
      </div>
    </div>
  )
}

type PropertyGridSkeletonProps = {
  count?: number
  /** 'full' = image-led PropertyCard (search results). 'compact' = SavedPropertyCard. */
  variant?: 'full' | 'compact'
}

/**
 * Grid of card-shaped placeholders matching PropertyCard / SavedPropertyCard,
 * dropped straight into the same grid className the real cards render into.
 */
export function PropertyGridSkeleton({ count = 6, variant = 'full' }: PropertyGridSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) =>
        variant === 'compact' ? <CompactCardSkeleton key={index} /> : <FullCardSkeleton key={index} />,
      )}
    </>
  )
}
