import { Card, CardTitle } from '../../../../components/ui/card/card'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getComparableSales, type ComparableSale } from '../../../../services/common'
import { BuildingIcon } from './generate-report-icons'
import { StepActions } from './step-actions'

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

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21.5s7-6.14 7-11.5A7 7 0 0 0 5 10c0 5.36 7 11.5 7 11.5z" />
      <circle cx="12" cy="10" r="2.5" />
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

type ComparableSaleRowProps = {
  sale: ComparableSale
}

function ComparableSaleRow({ sale }: ComparableSaleRowProps) {
  return (
    <div
      className="w-full rounded-2xl border border-black/5 bg-white px-4 py-5 text-left sm:px-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-[15px] font-semibold text-relaive-navy">{sale.address}</h4>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-relaive-gray">
            <span className="inline-flex items-center gap-1.5">
              <BedIcon />
              {sale.beds}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BathIcon />
              {sale.baths}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ParkingIcon />
              {sale.parking}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <AreaIcon />
              {sale.areaSqm} sqm
            </span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-lg font-bold tracking-tight text-relaive-primary">
            {formatPrice(sale.price)}
          </p>
          <p className="mt-0.5 text-sm text-relaive-gray">{sale.soldAgo}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            {sale.matchPercent}% match
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm text-relaive-gray">
            <PinIcon />
            {sale.distanceKm} km away
          </span>
        </div>

        <span className="text-sm font-medium text-relaive-primary">View Details</span>
      </div>
    </div>
  )
}

type ComparablesPanelProps = {
  onBack: () => void
  onContinue: () => void
}

export function ComparablesPanel({ onBack, onContinue }: ComparablesPanelProps) {
  const { data: sales } = useAsyncData(getComparableSales, [])

  return (
    <Card>
      <div className="flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8FD4D8] to-relaive-secondary-hover text-white shadow-md shadow-relaive-secondary/30">
          <BuildingIcon />
        </span>
        <div>
          <CardTitle>Comparable Sales</CardTitle>
          <p className="mt-0.5 text-sm text-relaive-gray">AI-selected similar properties</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {(sales ?? []).map((sale) => (
          <ComparableSaleRow key={sale.id} sale={sale} />
        ))}
      </div>

      <StepActions onBack={onBack} onContinue={onContinue} />
    </Card>
  )
}
