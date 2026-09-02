import { Skeleton } from '../../../components/ui/skeleton/skeleton'

/**
 * Mirrors the 4x StatCard + price-trend Card layout shared by the
 * suburb-explorer / market-insights pages (buyer, investor, agent, valuer)
 * so the skeleton doesn't cause layout shift once data resolves.
 */
export function MarketInsightsSkeleton() {
  return (
    <div className="flex flex-col gap-6 sm:gap-7" aria-busy="true" aria-live="polite">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-3xl border border-black/5 bg-white p-5 shadow-[0_4px_24px_rgba(26,32,44,0.06)] sm:p-6"
          >
            <Skeleton className="mb-4 h-10 w-10 rounded-xl" />
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="mt-2 h-3 w-20 rounded-full opacity-70" />
            <Skeleton className="mt-2 h-7 w-28 rounded-full" />
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-[0_4px_24px_rgba(26,32,44,0.06)] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Skeleton className="h-5 w-56 rounded-full" />
            <Skeleton className="mt-2 h-3 w-32 rounded-full" />
          </div>
          <div className="text-right">
            <Skeleton className="ml-auto h-3 w-36 rounded-full" />
            <Skeleton className="mt-2 ml-auto h-3 w-28 rounded-full" />
          </div>
        </div>
        <Skeleton className="mt-4 h-64 w-full rounded-2xl" />
      </div>
    </div>
  )
}
