import { Button } from '../../../components/ui/button/button'
import { BedIcon, BathIcon } from '../../../components/ui/property-card/property-card'
import type { SubjectProperty } from '../../../services/common'

function HouseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 11.5L12 4.5l8 7" />
      <path d="M6.5 10.5V19.5h11V10.5" />
    </svg>
  )
}

type SubjectPropertyCardProps = {
  property: SubjectProperty
  saved: boolean
  onSave: () => void
}

export function SubjectPropertyCard({ property, saved, onSave }: SubjectPropertyCardProps) {
  return (
    <article className="rounded-2xl border border-relaive-primary/25 border-t-4 border-t-relaive-primary bg-[#F0F7FA] px-4 py-5 sm:px-6">
      <p className="text-xs font-bold tracking-wider text-relaive-primary uppercase">
        Subject Property
      </p>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-relaive-primary text-white">
            <HouseIcon />
          </span>

          <div>
            <h3 className="text-lg font-semibold tracking-tight text-relaive-navy capitalize">
              {property.address}
            </h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-relaive-gray">
              <span className="inline-flex items-center gap-1.5">
                <BedIcon />
                {property.beds} bed
              </span>
              <span className="text-relaive-gray/50">·</span>
              <span className="inline-flex items-center gap-1.5">
                <BathIcon />
                {property.baths} bath
              </span>
              <span className="text-relaive-gray/50">·</span>
              <span>{property.areaSqm}m²</span>
              <span className="text-relaive-gray/50">·</span>
              <span>{property.propertyType}</span>
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="md"
          className="shrink-0 border-relaive-primary/30 text-relaive-primary hover:bg-relaive-primary/5"
          onClick={onSave}
          disabled={saved}
        >
          {saved ? 'Saved' : 'Save Property'}
        </Button>
      </div>
    </article>
  )
}
