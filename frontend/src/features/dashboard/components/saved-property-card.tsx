import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../../components/ui/button/button'
import { Card } from '../../../components/ui/card/card'
import { ComparableSalesIcon } from '../../../components/ui/navbar/dashboard-navbar-icons'
import {
  BathIcon,
  BedIcon,
} from '../../../components/ui/property-card/property-card'

export type SavedPropertyCardData = {
  id: string
  address: string
  savedAgo: string
  propertyType: string
  beds: number
  baths: number
  areaSqm: number
}

function HouseBadgeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function AreaExpandIcon() {
  return (
    <svg
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
      <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
      <path d="M3 3l7 7M21 3l-7 7M3 21l7-7M21 21l-7-7" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 7h14" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M7 7l1 13h8l1-13" />
    </svg>
  )
}

type SavedPropertyCardProps = {
  property: SavedPropertyCardData
  onRemove: (id: string) => void
  compareTo?: string
}

export function SavedPropertyCard({ property, onRemove, compareTo }: SavedPropertyCardProps) {
  const navigate = useNavigate()
  const { role } = useParams<{ role: string }>()

  function handleSearchComparables() {
    const params = new URLSearchParams({ address: property.address })
    const path =
      compareTo ?? `/dashboard/${role ?? 'agent'}/comparable-sales`
    navigate(`${path}?${params.toString()}`)
  }

  return (
    <Card className="rounded-2xl p-4! sm:p-4!">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug tracking-tight text-relaive-navy">
          {property.address}
        </h3>
        <button
          type="button"
          className="mt-0.5 shrink-0 text-[#C5CDD6] transition-colors hover:text-relaive-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
          aria-label={`Remove ${property.address}`}
          onClick={() => onRemove(property.id)}
        >
          <TrashIcon />
        </button>
      </div>

      <p className="mt-1 text-xs text-relaive-gray">Saved {property.savedAgo}</p>

      <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-[#E8F2F8] px-2 py-0.5 text-[11px] font-medium text-relaive-primary">
        <HouseBadgeIcon />
        {property.propertyType}
      </span>

      <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-relaive-gray">
        <span className="inline-flex items-center gap-1">
          <BedIcon />
          {property.beds}
        </span>
        <span className="text-[#D0D5DD]" aria-hidden="true">
          ·
        </span>
        <span className="inline-flex items-center gap-1">
          <BathIcon />
          {property.baths}
        </span>
        <span className="text-[#D0D5DD]" aria-hidden="true">
          ·
        </span>
        <span className="inline-flex items-center gap-1">
          <AreaExpandIcon />
          {property.areaSqm}m²
        </span>
      </div>

      <Button
        type="button"
        variant="primary"
        size="sm"
        className="mt-4 w-full gap-1.5"
        onClick={handleSearchComparables}
      >
        <ComparableSalesIcon width={14} height={14} />
        Search Comparables
      </Button>
    </Card>
  )
}
