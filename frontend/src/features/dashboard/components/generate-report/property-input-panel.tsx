import { useEffect, useState } from 'react'
import { Card } from '../../../../components/ui/card/card'
import { searchComparableSales, type AppraisalInputContext } from '../../../../services/common'
import { MARKET_INSIGHTS_KNOWN_SUBURBS } from '../../../../services/agent'
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

type CoverageState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found'; countLabel: string; label: string }
  | { status: 'empty'; label: string }

const COVERAGE_DEBOUNCE_MS = 400
const COVERAGE_RESULT_CAP = 20

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

function applyKnownSuburb(current: EnterAddressFormState, suggestion: string): EnterAddressFormState {
  const parts = suggestion.trim().split(/\s+/)
  const state = parts.at(-1) ?? ''
  const suburb = parts.slice(0, -1).join(' ')
  return { ...current, suburb, state }
}

export function PropertyInputPanel({ onContinue }: PropertyInputPanelProps) {
  const [enterAddressForm, setEnterAddressForm] = useState<EnterAddressFormState>(
    INITIAL_ENTER_ADDRESS_FORM_STATE,
  )
  const [showErrors, setShowErrors] = useState(false)
  const [coverage, setCoverage] = useState<CoverageState>({ status: 'idle' })

  const errors = addressFieldErrors(enterAddressForm)
  const enteredAddressContext = toAppraisalContext(enterAddressForm)
  const suburb = normalizeText(enterAddressForm.suburb)
  const state = enterAddressForm.state.toUpperCase()

  useEffect(() => {
    if (!suburb || !state) {
      setCoverage({ status: 'idle' })
      return
    }

    let cancelled = false
    setCoverage({ status: 'loading' })

    const timer = window.setTimeout(() => {
      const label = `${suburb} ${state}`
      searchComparableSales({
        address: `1 Check Street, ${label}`,
        dateRange: '',
        propertyType: 'all',
      })
        .then((result) => {
          if (cancelled) return
          const count = result.sales.length
          if (result.isMatch && count > 0) {
            setCoverage({
              status: 'found',
              countLabel: count >= COVERAGE_RESULT_CAP ? `${COVERAGE_RESULT_CAP}+` : String(count),
              label,
            })
            return
          }
          setCoverage({ status: 'empty', label })
        })
        .catch(() => {
          if (!cancelled) setCoverage({ status: 'idle' })
        })
    }, COVERAGE_DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [suburb, state])

  return (
    <>
      <Card>
        <EnterAddressForm
          value={enterAddressForm}
          onChange={setEnterAddressForm}
          errors={showErrors ? errors : undefined}
        />
      </Card>

      {coverage.status === 'loading' ? (
        <p className="text-sm text-relaive-gray">Checking coverage...</p>
      ) : null}

      {coverage.status === 'found' ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {coverage.countLabel} comparable sales found in {coverage.label}
        </p>
      ) : null}

      {coverage.status === 'empty' ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">
            No comparable sales found for “{coverage.label}”. Try one of these suburbs:
          </p>
          <div className="flex flex-wrap gap-2">
            {MARKET_INSIGHTS_KNOWN_SUBURBS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setEnterAddressForm((current) => applyKnownSuburb(current, suggestion))}
                className="rounded-full bg-relaive-primary/10 px-3.5 py-1.5 text-sm font-medium text-relaive-primary transition-colors hover:bg-relaive-primary/20"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}

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
