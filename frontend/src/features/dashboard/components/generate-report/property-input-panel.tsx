import { useState } from 'react'
import { Card } from '../../../../components/ui/card/card'
import type { AppraisalInputContext } from '../../../../services/common'
import {
  EnterAddressForm,
  INITIAL_ENTER_ADDRESS_FORM_STATE,
  type EnterAddressFieldErrors,
  type EnterAddressFormState,
} from './enter-address-form'
import { StepActions } from './step-actions'

type PropertyInputPanelProps = {
  onContinue: (context?: AppraisalInputContext) => void
}

function toInteger(value: string): number | undefined {
  const digits = value.replace(/[^\d]/g, '')
  if (!digits) return undefined
  const parsed = Number(digits)
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : undefined
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function addressFieldErrors(form: EnterAddressFormState): EnterAddressFieldErrors {
  const errors: EnterAddressFieldErrors = {}
  if (!normalizeText(form.streetAddress)) errors.streetAddress = 'Street address is required.'
  if (!normalizeText(form.suburb)) errors.suburb = 'Suburb is required.'
  if (!form.state) errors.state = 'Select a state.'
  if (!/^\d{4}$/.test(form.postcode)) errors.postcode = 'Enter a 4-digit postcode.'
  return errors
}

function toAppraisalContext(form: EnterAddressFormState): AppraisalInputContext | null {
  if (Object.keys(addressFieldErrors(form)).length > 0) return null

  const streetLine = normalizeText(form.streetAddress)
  const suburb = normalizeText(form.suburb)
  const state = form.state.toUpperCase()

  return {
    address: `${streetLine}, ${suburb} ${state} ${form.postcode}`,
    propertyType: form.propertyType.trim() || undefined,
    bedrooms: toInteger(form.bedrooms),
    bathrooms: toInteger(form.bathrooms),
    parking: toInteger(form.parking),
    landSizeSqm: toInteger(form.landSize),
  }
}

export function PropertyInputPanel({ onContinue }: PropertyInputPanelProps) {
  const [enterAddressForm, setEnterAddressForm] = useState<EnterAddressFormState>(
    INITIAL_ENTER_ADDRESS_FORM_STATE,
  )
  const [showErrors, setShowErrors] = useState(false)

  const errors = addressFieldErrors(enterAddressForm)
  const enteredAddressContext = toAppraisalContext(enterAddressForm)

  return (
    <>
      <Card>
        <EnterAddressForm
          value={enterAddressForm}
          onChange={setEnterAddressForm}
          errors={showErrors ? errors : undefined}
        />
      </Card>

      <StepActions
        onContinue={() => {
          if (!enteredAddressContext) {
            setShowErrors(true)
            return
          }
          onContinue(enteredAddressContext)
        }}
        continueLabel="Next: Comparable Sales >"
      />
    </>
  )
}
