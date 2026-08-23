import { useState, type FormEvent } from 'react'
import { Button } from '../../../../../components/ui/button/button'
import { Input } from '../../../../../components/ui/input/input'
import { getClientStatusLabel } from '../../../../../components/ui/table/status-badge'
import type { ClientStatus } from '../../../../../services/agent'
import { createClient, ClientApiError, type CreateClientInput } from '../../../../services/agent'

const STATUS_OPTIONS: ClientStatus[] = ['prospecting', 'active', 'appraisal_sent', 'listing', 'sold']

const EMPTY_FORM: CreateClientInput = {
  fullName: '',
  email: '',
  phone: '',
  status: 'prospecting',
  notes: '',
  addressLine: '',
  suburb: '',
  state: '',
  postcode: '',
  propertyType: '',
  bedrooms: 0,
  bathrooms: 0,
  parking: 0,
  landSizeSqm: 0,
}

type AddClientModalProps = {
  onClose: () => void
  onCreated: () => void
}

export function AddClientModal({ onClose, onCreated }: AddClientModalProps) {
  const [form, setForm] = useState<CreateClientInput>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function setField<K extends keyof CreateClientInput>(key: K, value: CreateClientInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setFieldErrors({})

    try {
      await createClient(form)
      onCreated()
      onClose()
    } catch (err) {
      if (err instanceof ClientApiError) {
        setError(err.message)
        setFieldErrors(err.fieldErrors ?? {})
      } else {
        setError('Could not add client. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-black/5 px-6 py-4">
          <h2 className="text-lg font-semibold text-relaive-navy">Add Client</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-relaive-gray hover:bg-black/5"
          >
            Close
          </button>
        </header>

        <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

          <Input
            id="fullName"
            label="Full Name"
            placeholder="e.g. Sarah Mitchell"
            value={form.fullName}
            onChange={(event) => setField('fullName', event.target.value)}
            required
          />
          {fieldErrors.fullName ? <p className="text-xs text-red-600">{fieldErrors.fullName}</p> : null}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="name@email.com"
                value={form.email}
                onChange={(event) => setField('email', event.target.value)}
                required
              />
              {fieldErrors.email ? <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p> : null}
            </div>
            <div>
              <Input
                id="phone"
                type="tel"
                label="Phone"
                placeholder="04XX XXX XXX"
                value={form.phone}
                onChange={(event) => setField('phone', event.target.value)}
                required
              />
              {fieldErrors.phone ? <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p> : null}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className="text-sm font-medium text-relaive-navy">
              Client Stage
            </label>
            <select
              id="status"
              value={form.status}
              onChange={(event) => setField('status', event.target.value as ClientStatus)}
              className="rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm text-relaive-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {getClientStatusLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <Input
            id="addressLine"
            label="Property Address"
            placeholder="e.g. 45 Park Ave"
            value={form.addressLine}
            onChange={(event) => setField('addressLine', event.target.value)}
            required
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              id="suburb"
              label="Suburb"
              value={form.suburb}
              onChange={(event) => setField('suburb', event.target.value)}
              required
            />
            <Input
              id="state"
              label="State"
              placeholder="VIC"
              value={form.state}
              onChange={(event) => setField('state', event.target.value)}
              required
            />
            <Input
              id="postcode"
              label="Postcode"
              value={form.postcode}
              onChange={(event) => setField('postcode', event.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <Input
              id="propertyType"
              label="Type"
              placeholder="house"
              value={form.propertyType}
              onChange={(event) => setField('propertyType', event.target.value)}
              required
            />
            <Input
              id="bedrooms"
              type="number"
              min={0}
              label="Beds"
              value={form.bedrooms}
              onChange={(event) => setField('bedrooms', Number(event.target.value))}
            />
            <Input
              id="bathrooms"
              type="number"
              min={0}
              label="Baths"
              value={form.bathrooms}
              onChange={(event) => setField('bathrooms', Number(event.target.value))}
            />
            <Input
              id="parking"
              type="number"
              min={0}
              label="Parking"
              value={form.parking}
              onChange={(event) => setField('parking', Number(event.target.value))}
            />
          </div>

          <Input
            id="landSizeSqm"
            type="number"
            min={0}
            label="Land Size (sqm)"
            value={form.landSizeSqm}
            onChange={(event) => setField('landSizeSqm', Number(event.target.value))}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-sm font-medium text-relaive-navy">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={(event) => setField('notes', event.target.value)}
              placeholder="Key details about this client — motivation, preferences, timeline..."
              className="w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm leading-relaxed text-relaive-navy placeholder:text-relaive-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
            />
          </div>
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-black/5 px-6 py-4">
          <Button type="button" variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
            {isSubmitting ? 'Adding…' : 'Add Client'}
          </Button>
        </footer>
      </form>
    </div>
  )
}
