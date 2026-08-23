import { useState } from 'react'
import { useAsyncData } from '../../../../../hooks/use-async-data'
import { getPropertyTypeOptions, type AppraisalInputContext } from '../../../../../services/common'

// v2 reskin of wizard Step 1 (figma: GenerateAppraisalPage.tsx Step1) — filled inputs,
// +/- spinner counters, pill property-type selector, replacing the "choose input method"
// card layer (which only had one working option — Enter Address — the other two were
// non-functional "coming soon" stubs) with the address form directly, matching figma.
// Property type options are still real (services/common.ts's getPropertyTypeOptions()),
// just rendered as pills instead of a datalist.

type PropertyInputPanelProps = {
  onContinue: (context?: AppraisalInputContext) => void
}

function MapPinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s-6-5.2-6-10a6 6 0 1112 0c0 4.8-6 10-6 10z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <circle cx="12" cy="11" r="2.25" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Spinner({ value, min, onChange }: { value: number; min: number; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 font-bold text-relaive-navy transition-colors hover:bg-relaive-primary/10"
      >
        −
      </button>
      <span className="w-6 text-center text-sm font-semibold text-relaive-navy">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 font-bold text-relaive-navy transition-colors hover:bg-relaive-primary/10"
      >
        +
      </button>
    </div>
  )
}

const FIELD_CLASS =
  'w-full rounded-xl bg-black/5 px-4 py-2.5 text-sm text-relaive-navy placeholder:text-relaive-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary'
const LABEL_CLASS = 'mb-2 block text-xs font-semibold uppercase tracking-wide text-relaive-gray'

export function PropertyInputPanel({ onContinue }: PropertyInputPanelProps) {
  const [street, setStreet] = useState('')
  const [suburbState, setSuburbState] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [bedrooms, setBedrooms] = useState(3)
  const [bathrooms, setBathrooms] = useState(2)
  const [parking, setParking] = useState(1)
  const [landSize, setLandSize] = useState('')

  const { data: propertyTypeOptions } = useAsyncData(getPropertyTypeOptions, [])

  const canProceed = street.trim().length > 0 && suburbState.trim().length > 0

  const handleContinue = () => {
    const address = `${street.trim()}, ${suburbState.trim()}`
    onContinue({
      address,
      propertyType: propertyType || undefined,
      bedrooms,
      bathrooms,
      parking,
      landSizeSqm: landSize ? Number(landSize) : undefined,
    })
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-[0_4px_24px_rgba(26,32,44,0.06)] sm:p-7">
      <h2 className="text-xl font-semibold text-relaive-navy sm:text-2xl">Property Details</h2>
      <p className="mt-1 text-sm text-relaive-gray">Enter the subject property information</p>

      <div className="mt-6 flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL_CLASS}>Street Address *</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-relaive-primary">
                <MapPinIcon />
              </span>
              <input
                value={street}
                onChange={(event) => setStreet(event.target.value)}
                placeholder="e.g. 45 Smith Street"
                className={`${FIELD_CLASS} pl-10`}
              />
            </div>
          </div>
          <div>
            <label className={LABEL_CLASS}>Suburb, State & Postcode *</label>
            <input
              value={suburbState}
              onChange={(event) => setSuburbState(event.target.value)}
              placeholder="e.g. Richmond VIC 3121"
              className={FIELD_CLASS}
            />
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>Property Type</label>
          <div className="flex flex-wrap gap-2">
            {(propertyTypeOptions ?? []).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPropertyType(type)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  propertyType === type
                    ? 'bg-gradient-to-r from-relaive-primary to-relaive-secondary text-white shadow-md'
                    : 'bg-black/5 text-relaive-gray hover:bg-relaive-primary/10'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <label className={LABEL_CLASS}>Bedrooms</label>
            <Spinner value={bedrooms} min={0} onChange={setBedrooms} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Bathrooms</label>
            <Spinner value={bathrooms} min={0} onChange={setBathrooms} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Car Spaces</label>
            <Spinner value={parking} min={0} onChange={setParking} />
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>Land Size (sqm)</label>
          <input
            value={landSize}
            onChange={(event) => setLandSize(event.target.value)}
            placeholder="e.g. 430"
            inputMode="numeric"
            className={FIELD_CLASS}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end border-t border-black/5 pt-5">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canProceed}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-relaive-primary to-relaive-secondary px-6 py-3 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next: Comparable Sales
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  )
}
