import type { DataTableTab } from '../../../components/ui/table/data-table'
import { CaseTable } from '../../../components/ui/table/case-table'
import { Skeleton } from '../../../components/ui/skeleton/skeleton'
import { useAsyncData } from '../../../hooks/use-async-data'
import type { CaseItem } from '../../../services/dashboard'
import { getValuerCaseListMockData } from '../../../services/valuer'

const REPORT_TABS: DataTableTab<CaseItem>[] = [
  { id: 'recent', label: 'Recent' },
  {
    id: 'draft',
    label: 'Draft',
    filter: (item) => item.status === 'draft',
  },
  {
    id: 'shared',
    label: 'Shared',
    filter: (item) => item.status === 'exported',
  },
  {
    id: 'archived',
    label: 'Archived',
    filter: (item) => item.status === 'approved',
  },
]

/** Approximates CaseTable's tab pills + search bar + data rows while cases load. */
function ReportsTableSkeleton() {
  return (
    <div
      className="rounded-3xl border border-black/5 bg-white shadow-[0_4px_24px_rgba(26,32,44,0.06)]"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-20 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-9 w-56 rounded-full" />
      </div>
      <div className="divide-y divide-black/5">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 p-4 sm:p-5">
            <div className="flex-1">
              <Skeleton className="h-3 w-16 rounded-full" />
              <Skeleton className="mt-2 h-4 w-40 rounded-full" />
              <Skeleton className="mt-2 h-3 w-32 rounded-full opacity-70" />
            </div>
            <Skeleton className="hidden h-6 w-24 rounded-full sm:block" />
            <Skeleton className="hidden h-4 w-20 rounded-full sm:block" />
            <Skeleton className="hidden h-2 w-24 rounded-full md:block" />
            <Skeleton className="hidden h-4 w-16 rounded-full lg:block" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ValuerReport() {
  const { data: cases, isLoading } = useAsyncData(getValuerCaseListMockData, [])

  return (
    <div className="flex flex-col">
      <header className="font-sans px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
          Reports
        </h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">
          Manage, share and export your appraisal reports
        </p>
      </header>

      <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
        {isLoading && !cases ? (
          <ReportsTableSkeleton />
        ) : (
          <CaseTable
            cases={cases ?? []}
            tabs={REPORT_TABS}
            defaultTabId="recent"
            searchPlaceholder="Search reports, properties, clients..."
            emptyMessage="No reports match your search."
          />
        )}
      </div>
    </div>
  )
}
