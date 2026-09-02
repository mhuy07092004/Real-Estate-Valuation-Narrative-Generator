import { Card } from '../../../components/ui/card/card'
import { Skeleton } from '../../../components/ui/skeleton/skeleton'

type ListRowSkeletonContentProps = {
  avatarShape: 'circle' | 'square'
}

function ListRowSkeletonContent({ avatarShape }: ListRowSkeletonContentProps) {
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <Skeleton className={`size-11 shrink-0 ${avatarShape === 'circle' ? 'rounded-full' : 'rounded-xl'}`} />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-2/3 max-w-[220px] rounded-full" />
        <Skeleton className="mt-2 h-3 w-1/2 max-w-[180px] rounded-full opacity-70" />
      </div>
      <Skeleton className="hidden h-6 w-20 shrink-0 rounded-full sm:block" />
    </div>
  )
}

type ListSkeletonProps = {
  rows?: number
  avatarShape?: 'circle' | 'square'
  /** 'cards' = one bordered Card per row (valuation cases, client/agent reports). 'divided' = single Card with divider rows (client list). */
  variant?: 'cards' | 'divided'
}

/**
 * Row placeholder shared by list-shaped dashboard pages — matches the
 * icon/avatar + two-line + trailing-chip layout used by ValuationCaseCard,
 * ClientReportCard, and the client-agent row list.
 */
export function ListSkeleton({ rows = 4, avatarShape = 'square', variant = 'cards' }: ListSkeletonProps) {
  if (variant === 'divided') {
    return (
      <Card className="overflow-hidden p-0! sm:p-0!" aria-busy="true" aria-live="polite">
        <div className="divide-y divide-black/5">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="px-4 py-4 sm:px-6">
              <ListRowSkeletonContent avatarShape={avatarShape} />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <ul className="flex flex-col gap-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, index) => (
        <li key={index}>
          <Card className="rounded-2xl p-4! sm:px-5! sm:py-4!">
            <ListRowSkeletonContent avatarShape={avatarShape} />
          </Card>
        </li>
      ))}
    </ul>
  )
}
