import { useState, type ChangeEvent } from 'react'
import { Input } from '../../../../components/ui/input/input'
import { PROPERTY_TYPE_OPTIONS } from '../../../../services/mock-common'

type EnterAddressFormState = {
  address: string
  propertyType: string
  bedrooms: string
  bathrooms: string
  parking: string
  landSize: string
}

const INITIAL_STATE: EnterAddressFormState = {
  address: '',
  propertyType: '',
  bedrooms: '',
  bathrooms: '',
  parking: '',
  landSize: '',
}

export function EnterAddressForm() {
  const [form, setForm] = useState<EnterAddressFormState>(INITIAL_STATE)

  const handleChange =
    (field: keyof EnterAddressFormState) => (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }))
    }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="property-address"
          label="Property Address"
          placeholder="e.g. 123 Smith St, Richmond VIC 3121"
          value={form.address}
          onChange={handleChange('address')}
        />
        <div>
          <Input
            id="property-type"
            label="Property Type"
            placeholder="e.g. House"
            list="property-type-options"
            value={form.propertyType}
            onChange={handleChange('propertyType')}
          />
          <datalist id="property-type-options">
            {PROPERTY_TYPE_OPTIONS.map((type) => (
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
          value={form.bedrooms}
          onChange={handleChange('bedrooms')}
        />
        <Input
          id="bathrooms"
          label="Bath"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="0"
          value={form.bathrooms}
          onChange={handleChange('bathrooms')}
        />
        <Input
          id="parking"
          label="Parking"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="0"
          value={form.parking}
          onChange={handleChange('parking')}
        />
        <Input
          id="land-size"
          label="Landsize (Sqm)"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="0"
          value={form.landSize}
          onChange={handleChange('landSize')}
        />
      </div>
    </div>
  )
}
