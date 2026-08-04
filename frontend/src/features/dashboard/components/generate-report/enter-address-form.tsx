import type { ChangeEvent } from 'react'
import { Input } from '../../../../components/ui/input/input'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getPropertyTypeOptions } from '../../../../services/common'

export type EnterAddressFormState = {
  address: string
  propertyType: string
  bedrooms: string
  bathrooms: string
  parking: string
  landSize: string
}

export const INITIAL_ENTER_ADDRESS_FORM_STATE: EnterAddressFormState = {
  address: '',
  propertyType: '',
  bedrooms: '',
  bathrooms: '',
  parking: '',
  landSize: '',
}

type EnterAddressFormProps = {
  value: EnterAddressFormState
  onChange: (next: EnterAddressFormState) => void
}

export function EnterAddressForm({ value, onChange }: EnterAddressFormProps) {
  const { data: propertyTypeOptions } = useAsyncData(getPropertyTypeOptions, [])

  const handleChange =
    (field: keyof EnterAddressFormState) => (event: ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, [field]: event.target.value })
    }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="property-address"
          label="Property Address"
          placeholder="e.g. 123 Smith St, Richmond VIC 3121"
          value={value.address}
          onChange={handleChange('address')}
        />
        <div>
          <Input
            id="property-type"
            label="Property Type"
            placeholder="e.g. House"
            list="property-type-options"
            value={value.propertyType}
            onChange={handleChange('propertyType')}
          />
          <datalist id="property-type-options">
            {(propertyTypeOptions ?? []).map((type) => (
              <option key={type} value={type} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Input
          id="bedrooms"
          label="Bedrooms"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="0"
          value={value.bedrooms}
          onChange={handleChange('bedrooms')}
        />
        <Input
          id="bathrooms"
          label="Bath"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="0"
          value={value.bathrooms}
          onChange={handleChange('bathrooms')}
        />
        <Input
          id="parking"
          label="Parking"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="0"
          value={value.parking}
          onChange={handleChange('parking')}
        />
        <Input
          id="land-size"
          label="Landsize (Sqm)"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="0"
          value={value.landSize}
          onChange={handleChange('landSize')}
        />
      </div>
    </div>
  )
}
