import { Button } from '../button/button'

export type PropertyRangeStatus = 'within_range' | 'below_range' | 'above_range'
export type PropertyType = 'House' | 'Unit' | 'Townhouse'

export type PropertyCardData = {
  id: string
  address: { street: string; suburb: string; state: string; postcode: string }
  price: number
  estimatedRange: { min: string; max: string }
  propertyType: PropertyType
  features: { beds: number; baths: number; areaSqm: number; parking?: number }
  listedDays: number
  status: PropertyRangeStatus
}

type PropertyCardProps = {
  property: PropertyCardData
  className?: string
}

const STATUS_STYLES: Record<
  PropertyRangeStatus,
  { label: string; className: string }
> = {
  within_range: {
    label: 'Within Range',
    className: 'bg-emerald-50 text-emerald-700',
  },
  below_range: {
    label: 'Below Range',
    className: 'bg-sky-50 text-sky-700',
  },
  above_range: {
    label: 'Above Range',
    className: 'bg-orange-50 text-orange-700',
  },
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(price)
}

export function BedIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7v11" />
      <path d="M21 14v4" />
      <path d="M3 14h18" />
      <path d="M3 11a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3H3v-3z" />
      <path d="M7 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

export function BathIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12h16a1 1 0 0 1 1 1v2a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-2a1 1 0 0 1 1-1z" />
      <path d="M6 12V5a2 2 0 0 1 2-2h1" />
      <path d="M8 20v1" />
      <path d="M16 20v1" />
    </svg>
  )
}

function AreaIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 10h16" />
      <path d="M10 4v16" />
    </svg>
  )
}

function ParkingIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
    </svg>
  )
}

function CompareIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 4v16" />
      <path d="M17 4v16" />
      <path d="M3 8h8" />
      <path d="M13 16h8" />
      <path d="M5 6l2 2 2-2" />
      <path d="M15 18l2-2 2 2" />
    </svg>
  )
}

function HeartIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19.5 12.572 12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.566z" />
    </svg>
  )
}

export function PropertyCard({ property, className = '' }: PropertyCardProps) {
  const { address, features, estimatedRange, status } = property
  const statusStyle = STATUS_STYLES[status]
  const parkingLabel =
    features.parking != null ? String(features.parking) : '—'

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_4px_24px_rgba(26,32,44,0.06)] ${className}`}
    >
      <div className="relative aspect-[4/3] bg-[#E8EEF2]">
        <span className="absolute top-3 left-3 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-relaive-navy shadow-[0_2px_8px_rgba(26,32,44,0.08)]">
          {property.listedDays}d listed
        </span>

        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-relaive-navy shadow-[0_2px_8px_rgba(26,32,44,0.08)] transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
            aria-label="Compare property"
          >
            <CompareIcon />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-relaive-navy shadow-[0_2px_8px_rgba(26,32,44,0.08)] transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
            aria-label="Save property"
          >
            <HeartIcon />
          </button>
        </div>

        <span
          className={`absolute right-3 bottom-3 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle.className}`}
        >
          {statusStyle.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-relaive-navy">
            {address.street}
          </h3>
          <p className="mt-0.5 text-sm text-relaive-primary/80">
            {address.suburb} {address.state} {address.postcode}
          </p>
        </div>

        <div>
          <div className="flex items-start justify-between gap-3">
            <p className="text-xl font-bold tracking-tight text-relaive-navy">
              {formatPrice(property.price)}
            </p>
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-relaive-navy">
              {property.propertyType}
            </span>
          </div>
          <p className="mt-1 text-sm text-relaive-gray">
            Est: {estimatedRange.min}–{estimatedRange.max}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-relaive-gray">
          <span className="inline-flex items-center gap-1.5">
            <BedIcon />
            {features.beds}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BathIcon />
            {features.baths}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <AreaIcon />
            {features.areaSqm}m²
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ParkingIcon />
            {parkingLabel}
          </span>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          className="mt-auto w-full bg-gradient-to-r from-relaive-primary to-relaive-secondary hover:opacity-90"
        >
          View Property Details
        </Button>
      </div>
    </article>
  )
}
