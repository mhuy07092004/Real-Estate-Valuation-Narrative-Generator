/** Suspense fallback for lazy-loaded role dashboards — mirrors RoleDashboardView's layout to avoid content jump. */
export function DashboardViewSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8" aria-busy="true" aria-live="polite">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[104px] animate-pulse rounded-2xl border border-black/5 bg-white/60" />
        ))}
      </div>

      <div className="h-[260px] animate-pulse rounded-2xl border border-black/5 bg-white/60" />
    </div>
  )
}
