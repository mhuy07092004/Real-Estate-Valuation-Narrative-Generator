import type { ComparableSaleV2 } from '../../../../../v2/services/common'

// Shared core for Comparable Sales — used by both the generate-report wizard step
// (variant="compact") and the standalone Comparable Sales page (variant="full").
// See figma-ui-migration-plan.md §4.5 / §9.1. Real data only — no local mocks here,
// callers fetch via v2/services/common.ts's getComparableSalesV2() (same endpoint
// v1 uses, typed to include propertyType — see §9.7 B.1/B.4).
//
// Row layout matches figma's lean text-line pattern (ComparableSalesPage.tsx lines
// 227-269): address + suburb inline, "N bed · N bath · Nm² · Type" as one text line,
// price + calendar-icon date on the right — not the icon-badge stat groups this
// previously used, which were a v2-only invention with no figma source.

function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  )
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(price)
}

function ComparableSaleRow({ sale, showMeta }: { sale: ComparableSaleV2; showMeta: boolean }) {
  return (
    <div className="w-full rounded-2xl border border-black/5 bg-white px-5 py-4 text-left transition-colors hover:border-relaive-primary/25">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-medium text-relaive-navy">{sale.address}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-relaive-gray">
            <span>{sale.beds} bed</span>
            <span className="text-relaive-gray/40">·</span>
            <span>{sale.baths} bath</span>
            <span className="text-relaive-gray/40">·</span>
            <span>{sale.areaSqm}m²</span>
            <span className="text-relaive-gray/40">·</span>
            <span>{sale.propertyType}</span>
          </div>
          {showMeta ? (
            <p className="mt-1 text-xs text-relaive-gray/70">
              {sale.matchPercent}% match · {sale.distanceKm}km away
            </p>
          ) : null}
        </div>

        <div className="flex-shrink-0 text-right">
          <div className="text-base font-semibold text-relaive-primary">{formatPrice(sale.price)}</div>
          <div className="mt-1 flex items-center justify-end gap-1 text-xs text-relaive-gray/70">
            <CalendarIcon />
            {sale.soldAgo}
          </div>
        </div>
      </div>
    </div>
  )
}

type ComparableSalesViewProps = {
  sales: ComparableSaleV2[]
  variant?: 'compact' | 'full'
}

export function ComparableSalesView({ sales, variant = 'compact' }: ComparableSalesViewProps) {
  const isFull = variant === 'full'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {sales.map((sale) => (
          <ComparableSaleRow key={sale.id} sale={sale} showMeta={isFull} />
        ))}
      </div>

      {sales.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-white py-12 text-center">
          <p className="text-sm font-medium text-relaive-navy">No comparable sales found</p>
          <p className="mt-1 text-sm text-relaive-gray">Try a different address.</p>
        </div>
      ) : null}
    </div>
  )
}
