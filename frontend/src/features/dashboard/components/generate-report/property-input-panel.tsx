import { useState } from 'react'
import { Card } from '../../../../components/ui/card/card'
import { type AppraisalInputContext } from '../../../../services/common'
import {
  EnterAddressForm,
  INITIAL_ENTER_ADDRESS_FORM_STATE,
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

function toAppraisalContext(form: EnterAddressFormState): AppraisalInputContext | null {
  const streetAddress = form.streetAddress.trim()
  const suburbState = form.suburbState.trim()
  if (!streetAddress || !suburbState) return null

  return {
    address: `${streetAddress}, ${suburbState}`,
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

  const enteredAddressContext = toAppraisalContext(enterAddressForm)

  return (
    <>
      <Card>
        <EnterAddressForm
          value={enterAddressForm}
          onChange={setEnterAddressForm}
        />
      </Card>

      <StepActions
        onContinue={() => onContinue(enteredAddressContext ?? undefined)}
        continueDisabled={!enteredAddressContext}
        continueLabel="Next: Comparable Sales >"
      />
    </>
  )
}
