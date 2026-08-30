import type { ReactNode } from 'react'
import type { ComparableSale } from '../../../../../services/common'

// Shared building blocks for every role's generated-report document (Vendor Appraisal,
// Full Valuation, Investment Analysis, Buyer Advisory). Extracted so the 4 role-specific
// report components (each modeled on figma's own per-role template function) don't
// hand-duplicate the header banner / comparables table / valuation bar / certification
// block markup. See figma-ui-migration-plan.md §10.2.

export function BuildingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="3" width="10" height="18" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 9h6v12h-6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

export function TrendingUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 19h16M6 16l4-5 3 3 5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 7h3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function BookmarkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 3.5h12v17l-6-4-6 4v-17Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

export function CheckDotIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function UserIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.5" stroke="white" strokeWidth="1.5" />
      <path d="M5 19.5c1.3-3.6 3.9-5.5 7-5.5s5.7 1.9 7 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(price)
}

export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="my-8 flex items-center gap-4">
      <div className="h-px flex-grow bg-black/5" />
      <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-relaive-gray/60">{label}</span>
      <div className="h-px flex-grow bg-black/5" />
    </div>
  )
}

export type ReportHeaderStat = { label: string; value: string; highlight?: boolean }

type ReportHeaderBannerProps = {
  icon: ReactNode
  eyebrow: string
  title: string
  subtitle: string
  preparedBy: string
  date: string
  stats: ReportHeaderStat[]
}

export function ReportHeaderBanner({ icon, eyebrow, title, subtitle, preparedBy, date, stats }: ReportHeaderBannerProps) {
  return (
    <div className="bg-gradient-to-r from-[#102132] to-[#1C2A38] px-6 py-7 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-relaive-primary to-relaive-secondary text-white">
              {icon}
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-white/60">{eyebrow}</span>
          </div>
          <h2 className="text-xl font-semibold text-white sm:text-2xl">{title}</h2>
          <p className="mt-1 text-sm text-white/50">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-white/40">Prepared by</p>
          <p className="text-sm font-semibold text-white">{preparedBy}</p>
          <p className="mt-0.5 text-xs text-white/50">{date}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-6 border-t border-white/10 pt-5">
        {stats.map((item) => (
          <div key={item.label}>
            <p className="mb-0.5 text-[10px] uppercase tracking-wide text-white/40">{item.label}</p>
            <p className={item.highlight ? 'text-base font-semibold text-relaive-secondary' : 'text-sm font-semibold text-white'}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ComparableSalesTable({
  comparables,
  averageLabel = 'Comparable Average',
}: {
  comparables: ComparableSale[]
  averageLabel?: string
}) {
  const avgPrice = comparables.length
    ? Math.round(comparables.reduce((sum, sale) => sum + sale.price, 0) / comparables.length)
    : 0

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/5">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-black/[0.02]">
            {['Address', 'Config', 'Land', 'Sold', 'Sale Price'].map((header, index) => (
              <th
                key={header}
                className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-relaive-gray/60 ${
                  index === 0 ? 'text-left' : index === 4 ? 'text-right' : 'text-center'
                }`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {comparables.map((sale, index) => (
            <tr key={sale.id} className={index % 2 === 0 ? 'bg-white' : 'bg-black/[0.01]'}>
              <td className="px-4 py-3 font-medium text-relaive-navy">{sale.address}</td>
              <td className="px-4 py-3 text-center text-xs text-relaive-gray">
                {sale.beds}b · {sale.baths}ba
              </td>
              <td className="px-4 py-3 text-center text-xs text-relaive-gray">{sale.areaSqm}m²</td>
              <td className="px-4 py-3 text-center text-xs text-relaive-gray">{sale.soldAgo}</td>
              <td className="px-4 py-3 text-right font-bold text-relaive-navy">{formatPrice(sale.price)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-relaive-primary/15 bg-relaive-primary/5">
            <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-relaive-primary">
              {averageLabel}
            </td>
            <td className="px-4 py-3 text-right font-bold text-relaive-primary">{formatPrice(avgPrice)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export function ValuationRangeBar({
  title,
  priceRange,
  midpoint,
  lowerLabel = 'Lower',
  upperLabel = 'Upper',
}: {
  title: string
  priceRange: string
  midpoint: string
  lowerLabel?: string
  upperLabel?: string
}) {
  return (
    <div className="rounded-2xl border border-relaive-primary/20 bg-gradient-to-br from-relaive-primary/[0.06] to-relaive-secondary/[0.04] p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-relaive-gray/60">{title}</p>
          <p className="text-2xl font-bold text-relaive-navy sm:text-3xl">{priceRange}</p>
        </div>
        <div className="text-right">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-relaive-gray/60">Midpoint</p>
          <p className="text-lg font-bold text-relaive-primary sm:text-xl">{midpoint}</p>
        </div>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-black/5">
        <div className="absolute inset-y-0 left-[15%] right-[15%] rounded-full bg-gradient-to-r from-relaive-primary to-relaive-secondary" />
        <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-px bg-white" />
      </div>
      <div className="mt-1.5 flex justify-between">
        <span className="text-[10px] text-relaive-gray/60">{lowerLabel}</span>
        <span className="text-[10px] text-relaive-gray/60">{upperLabel}</span>
      </div>
    </div>
  )
}

export function ReportCertificationBlock({
  name,
  roleLabel,
  statement,
}: {
  name: string
  roleLabel: string
  statement: string
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-relaive-primary to-relaive-secondary shadow-md">
        <UserIcon />
      </span>
      <div>
        <p className="text-sm font-bold text-relaive-navy">{name}</p>
        <p className="mb-2.5 text-xs text-relaive-gray">{roleLabel}</p>
        <p className="text-xs leading-relaxed text-relaive-navy/75">{statement}</p>
      </div>
    </div>
  )
}

export function PropertyDetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-black/[0.02] p-5">
      <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-relaive-gray/60">{title}</p>
      <div className="flex flex-col gap-2.5">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2.5 text-sm text-relaive-navy/80">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-relaive-primary/15 text-relaive-primary">
              <CheckDotIcon />
            </span>
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

export function MarketStatTiles({ stats }: { stats: { id: string; label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div key={stat.id} className="rounded-2xl bg-black/[0.02] p-4 text-center">
          <p className="text-lg font-bold text-relaive-navy">{stat.value}</p>
          <p className="mt-0.5 text-[10px] text-relaive-gray">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
