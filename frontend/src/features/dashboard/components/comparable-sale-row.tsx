import type { ComparableSale } from '../../../services/common'

function BedIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7v11" />
      <path d="M21 14v4" />
      <path d="M3 14h18" />
      <path d="M3 11a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3H3v-3z" />
      <path d="M7 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function BathIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12h16a1 1 0 0 1 1 1v2a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-2a1 1 0 0 1 1-1z" />
      <path d="M6 12V5a2 2 0 0 1 2-2h1" />
      <path d="M8 20v1" />
      <path d="M16 20v1" />
    </svg>
  )
}

function ParkingIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
    </svg>
  )
}

function AreaIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 10h16" />
      <path d="M10 4v16" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17" />
      <path d="M8 3.5v3.5M16 3.5v3.5" />
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

function parseAddress(address: string): { street: string; suburb: string } {
  const commaIndex = address.indexOf(',')
  if (commaIndex === -1) {
    return { street: address, suburb: '' }
  }

  return {
    street: address.slice(0, commaIndex).trim(),
    suburb: address.slice(commaIndex + 1).trim(),
  }
}

type ComparableSaleRowProps = {
  sale: ComparableSale
}

export function ComparableSaleRow({ sale }: ComparableSaleRowProps) {
  const { street, suburb } = parseAddress(sale.address)

  return (
    <div className="w-full rounded-2xl border border-black/5 bg-white px-4 py-5 text-left sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h4 className="text-[15px] font-semibold text-relaive-navy">{street}</h4>
            {suburb ? (
              <span className="text-sm text-relaive-gray">{suburb}</span>
            ) : null}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-relaive-gray">
            <span className="inline-flex items-center gap-1.5">
              <BedIcon />
              {sale.beds} bed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BathIcon />
              {sale.baths} bath
            </span>
            <span className="inline-flex items-center gap-1.5">
              <AreaIcon />
              {sale.areaSqm}m²
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ParkingIcon />
              House
            </span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-lg font-bold tracking-tight text-relaive-primary">
            {formatPrice(sale.price)}
          </p>
          <p className="mt-0.5 inline-flex items-center justify-end gap-1.5 text-sm text-relaive-gray">
            <CalendarIcon />
            {sale.soldAgo}
          </p>
        </div>
      </div>
    </div>
  )
}
