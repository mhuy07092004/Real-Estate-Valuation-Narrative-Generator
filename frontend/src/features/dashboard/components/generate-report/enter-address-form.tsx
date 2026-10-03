import type { ReactNode } from 'react'
import { Button } from '../../../../components/ui/button/button'
import { Input } from '../../../../components/ui/input/input'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getPropertyTypeOptions } from '../../../../services/common'
import { getPropertyInputMethodIcon } from './generate-report-icons'

export const AU_STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'] as const

export type EnterAddressFormState = {
  streetAddress: string
  suburb: string
  state: string
  postcode: string
  propertyType: string
  bedrooms: string
  bathrooms: string
  parking: string
  landSize: string
}

export const INITIAL_ENTER_ADDRESS_FORM_STATE: EnterAddressFormState = {
  streetAddress: '',
  suburb: '',
  state: '',
  postcode: '',
  propertyType: 'House',
  bedrooms: '3',
  bathrooms: '2',
  parking: '1',
  landSize: '',
}

export type EnterAddressFieldErrors = Partial<Record<keyof EnterAddressFormState, string>>

type EnterAddressFormProps = {
  value: EnterAddressFormState
  onChange: (next: EnterAddressFormState) => void
  errors?: EnterAddressFieldErrors
}

const FIELD_LABEL =
  'text-[11px] font-semibold tracking-[0.14em] text-relaive-gray uppercase'
const SURFACE_GREY = '!bg-[#E8EDF2]'
const INPUT_CLASS = `rounded-xl border-black/5 ${SURFACE_GREY}`
const COUNTER_BTN_CLASS =
  `size-8 rounded-full p-0 text-relaive-navy ${SURFACE_GREY} hover:!bg-[#DDE3EA]`
const SELECT_CLASS =
  `h-[42px] w-full appearance-none rounded-xl border border-black/5 py-2.5 pl-4 pr-9 text-sm text-relaive-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary ${SURFACE_GREY}`
const FIELD_ERROR = 'text-xs text-red-500'

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

function FeatureCounter({
  id,
  label,
  icon,
  value,
  onChange,
}: {
  id: string
  label: string
  icon: ReactNode
  value: string
  onChange: (next: string) => void
}) {
  const count = Math.max(0, Number.parseInt(value, 10) || 0)

  return (
    <div className="flex flex-col gap-2">
      <span className={`inline-flex items-center gap-1.5 ${FIELD_LABEL}`}>
        <span className="text-relaive-gray">{icon}</span>
        {label}
      </span>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`Decrease ${label}`}
          className={COUNTER_BTN_CLASS}
          onClick={() => onChange(String(Math.max(0, count - 1)))}
        >
          −
        </Button>
        <span id={id} className="min-w-6 text-center text-base font-semibold text-relaive-navy">
          {count}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`Increase ${label}`}
          className={COUNTER_BTN_CLASS}
          onClick={() => onChange(String(count + 1))}
        >
          +
        </Button>
      </div>
    </div>
  )
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className={FIELD_ERROR}>{message}</p>
}

export function EnterAddressForm({ value, onChange, errors }: EnterAddressFormProps) {
  const { data: propertyTypeOptions } = useAsyncData(getPropertyTypeOptions, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[6fr_3fr_1.5fr_1.5fr]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="street-address" className={FIELD_LABEL}>
            Street Address <span className="text-red-400">*</span>
          </label>
          <Input
            id="street-address"
            placeholder="e.g. 45 Smith Street"
            value={value.streetAddress}
            startIcon={getPropertyInputMethodIcon('address')}
            className={INPUT_CLASS}
            aria-invalid={Boolean(errors?.streetAddress)}
            onChange={(event) =>
              onChange({ ...value, streetAddress: event.target.value })
            }
          />
          <FieldError message={errors?.streetAddress} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="suburb" className={FIELD_LABEL}>
            Suburb <span className="text-red-400">*</span>
          </label>
          <Input
            id="suburb"
            placeholder="e.g. South Yarra"
            value={value.suburb}
            className={INPUT_CLASS}
            aria-invalid={Boolean(errors?.suburb)}
            onChange={(event) => onChange({ ...value, suburb: event.target.value })}
          />
          <FieldError message={errors?.suburb} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="state" className={FIELD_LABEL}>
            State <span className="text-red-400">*</span>
          </label>
          <span className="relative">
            <select
              id="state"
              value={value.state}
              aria-invalid={Boolean(errors?.state)}
              className={`${SELECT_CLASS} ${value.state ? '' : 'text-relaive-gray/70'}`}
              onChange={(event) => onChange({ ...value, state: event.target.value })}
            >
              <option value="">State</option>
              {AU_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-relaive-gray">
              <ChevronIcon />
            </span>
          </span>
          <FieldError message={errors?.state} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="postcode" className={FIELD_LABEL}>
            Postcode <span className="text-red-400">*</span>
          </label>
          <Input
            id="postcode"
            inputMode="numeric"
            maxLength={4}
            placeholder="3141"
            value={value.postcode}
            className={INPUT_CLASS}
            aria-invalid={Boolean(errors?.postcode)}
            onChange={(event) =>
              onChange({
                ...value,
                postcode: event.target.value.replace(/\D/g, '').slice(0, 4),
              })
            }
          />
          <FieldError message={errors?.postcode} />
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className={FIELD_LABEL}>Property Type</span>
        <div className="flex flex-wrap gap-2">
          {(propertyTypeOptions ?? []).map((type) => {
            const selected = value.propertyType === type
            return (
              <Button
                key={type}
                type="button"
                variant={selected ? 'primary' : 'ghost'}
                size="sm"
                className={
                  selected
                    ? 'rounded-full border-0 bg-gradient-to-r from-[#8FD4D8] to-relaive-secondary-hover px-5 text-white hover:from-[#8FD4D8] hover:to-relaive-secondary-hover'
                    : 'rounded-full bg-[#EEF2F6] px-5 text-relaive-navy hover:bg-[#E2E8F0]'
                }
                onClick={() => onChange({ ...value, propertyType: type })}
              >
                {type}
              </Button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <FeatureCounter
          id="bedrooms"
          label="Bedrooms"
          icon={<BedIcon />}
          value={value.bedrooms}
          onChange={(bedrooms) => onChange({ ...value, bedrooms })}
        />
        <FeatureCounter
          id="bathrooms"
          label="Bathrooms"
          icon={<BathIcon />}
          value={value.bathrooms}
          onChange={(bathrooms) => onChange({ ...value, bathrooms })}
        />
        <FeatureCounter
          id="parking"
          label="Car Spaces"
          icon={<ParkingIcon />}
          value={value.parking}
          onChange={(parking) => onChange({ ...value, parking })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="land-size" className={`inline-flex items-center gap-1.5 ${FIELD_LABEL}`}>
          <span className="text-relaive-gray">
            <AreaIcon />
          </span>
          Land Size
        </label>
        <Input
          id="land-size"
          placeholder="e.g. 430m²"
          value={value.landSize}
          className={INPUT_CLASS}
          onChange={(event) => onChange({ ...value, landSize: event.target.value })}
        />
      </div>
    </div>
  )
}
