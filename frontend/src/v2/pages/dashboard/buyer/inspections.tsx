import { useState } from 'react'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { listSavedProperties, type SavedPropertyRow } from '../../../services/saved-properties'

// Net-new v2 page — figma: InspectionsPage.tsx (per-property inspection checklist with a
// status-cycling badge per item, cost estimates, overall notes, and an Add Inspection modal).
//
// No backend inspections-scheduling model or routes exist (confirmed: grepped
// backend/src/routes/ — only "inspection" hit is an unrelated occurrence in mock.routes.ts's
// buyer dashboard copy, no real endpoint). backend/V2_BACKEND_TODO.md already flagged this gap
// from an earlier pass ("Inspections | Full net-new: no Prisma model, no routes... | Medium").
//
// Built as a real, working LOCAL feature instead of fabricating server-backed data: inspections
// are added/edited/removed by the user and persisted via the same lightweight
// module-var + localStorage pattern used by roi-scenario-store.ts and notification-store.ts
// elsewhere in this app (real per-viewer working state, not pretend server data). The property
// picker offers the user's REAL saved properties (listSavedProperties()) alongside free-text
// entry for a property not yet saved.

type ChecklistStatus = 'unchecked' | 'ok' | 'concern' | 'major'

type ChecklistItem = {
  id: string
  label: string
  status: ChecklistStatus
  note: string
  estimatedCost: number | null
}

type Inspection = {
  id: string
  address: string
  suburb: string
  date: string
  time: string
  notes: string
  overallNotes: string
  checklist: ChecklistItem[]
}

const DEFAULT_CHECKLIST_LABELS = [
  'Exterior & Facade',
  'Roof Condition',
  'Moisture & Damp',
  'Kitchen',
  'Bathrooms',
  'Electrical',
  'Noise & Soundproofing',
  'Natural Light',
  'Storage',
  'Renovation / Repair Needs',
]

function buildChecklist(prefix: string): ChecklistItem[] {
  return DEFAULT_CHECKLIST_LABELS.map((label, i) => ({
    id: `${prefix}-${i}`,
    label,
    status: 'unchecked',
    note: '',
    estimatedCost: null,
  }))
}

const STATUS_CONFIG: Record<ChecklistStatus, { label: string; text: string; bg: string }> = {
  unchecked: { label: 'Not checked', text: 'text-relaive-navy/40', bg: 'bg-[#EEF3F7]' },
  ok: { label: 'OK', text: 'text-emerald-600', bg: 'bg-emerald-50' },
  concern: { label: 'Concern', text: 'text-amber-600', bg: 'bg-amber-50' },
  major: { label: 'Major Issue', text: 'text-red-600', bg: 'bg-red-50' },
}

const CYCLE: ChecklistStatus[] = ['unchecked', 'ok', 'concern', 'major']
function nextStatus(status: ChecklistStatus): ChecklistStatus {
  return CYCLE[(CYCLE.indexOf(status) + 1) % CYCLE.length]
}

// ─── localStorage-backed store (same pattern as roi-scenario-store.ts) ─────────────────────

const INSPECTIONS_STORAGE_KEY = 'relaive_buyer_inspections'

let inspectionsCache: Inspection[] | null = null

function readStored(): Inspection[] | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(INSPECTIONS_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Inspection[]
  } catch {
    return null
  }
}

function getInspections(): Inspection[] {
  if (inspectionsCache) return inspectionsCache
  inspectionsCache = readStored() ?? []
  return inspectionsCache
}

function setInspections(next: Inspection[]): void {
  inspectionsCache = next
  if (typeof window === 'undefined') return
  window.localStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify(next))
}

// ─── Icons ──────────────────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7h12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Add Inspection modal ───────────────────────────────────────────────────────────────────

function AddInspectionModal({
  savedProperties,
  onClose,
  onAdd,
}: {
  savedProperties: SavedPropertyRow[]
  onClose: () => void
  onAdd: (inspection: Inspection) => void
}) {
  const [pickedSavedId, setPickedSavedId] = useState<string>('')
  const [address, setAddress] = useState('')
  const [suburb, setSuburb] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')

  const canSubmit = address.trim() && suburb.trim() && date

  function pickSaved(id: string) {
    setPickedSavedId(id)
    const property = savedProperties.find((p) => p.savedPropertyId === id)
    if (!property) return
    setAddress(property.addressLine)
    setSuburb(`${property.suburb} ${property.state} ${property.postcode}`)
  }

  function handleSubmit() {
    if (!canSubmit) return
    const id = `INS-${Date.now()}`
    onAdd({
      id,
      address: address.trim(),
      suburb: suburb.trim(),
      date,
      time,
      notes: notes.trim(),
      overallNotes: '',
      checklist: buildChecklist(id),
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#102132]/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#EEF3F7] px-6 py-5">
          <h2 className="text-base font-semibold text-relaive-navy">Add Inspection</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[#EEF3F7]">
            <span className="text-relaive-navy/50">
              <XIcon />
            </span>
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {savedProperties.length > 0 ? (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-relaive-gray">
                Pick a saved property (optional)
              </label>
              <select
                value={pickedSavedId}
                onChange={(e) => pickSaved(e.target.value)}
                className="w-full rounded-xl bg-[#EEF3F7] px-4 py-2.5 text-sm text-relaive-navy focus:outline-none focus:ring-2 focus:ring-relaive-primary/25"
              >
                <option value="">— Enter manually —</option>
                {savedProperties.map((p) => (
                  <option key={p.savedPropertyId} value={p.savedPropertyId}>
                    {p.addressLine}, {p.suburb} {p.state}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-relaive-gray">Street Address *</label>
            <input
              autoFocus
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 45 Clarendon St"
              className="w-full rounded-xl bg-[#EEF3F7] px-4 py-2.5 text-sm text-relaive-navy placeholder:text-relaive-navy/35 focus:outline-none focus:ring-2 focus:ring-relaive-primary/25"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-relaive-gray">Suburb & State *</label>
            <input
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
              placeholder="e.g. South Melbourne VIC 3205"
              className="w-full rounded-xl bg-[#EEF3F7] px-4 py-2.5 text-sm text-relaive-navy placeholder:text-relaive-navy/35 focus:outline-none focus:ring-2 focus:ring-relaive-primary/25"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-relaive-gray">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl bg-[#EEF3F7] px-3 py-2.5 text-sm text-relaive-navy focus:outline-none focus:ring-2 focus:ring-relaive-primary/25"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-relaive-gray">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl bg-[#EEF3F7] px-3 py-2.5 text-sm text-relaive-navy focus:outline-none focus:ring-2 focus:ring-relaive-primary/25"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-relaive-gray">Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Agent contact, access details…"
              className="w-full rounded-xl bg-[#EEF3F7] px-4 py-2.5 text-sm text-relaive-navy placeholder:text-relaive-navy/35 focus:outline-none focus:ring-2 focus:ring-relaive-primary/25"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#EEF3F7] bg-[#EEF3F7]/40 px-6 py-4">
          <p className="text-xs text-relaive-gray/70">A 10-point checklist is added automatically</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-relaive-primary/20 px-4 py-2 text-sm text-relaive-gray transition-colors hover:border-relaive-primary/40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="rounded-xl bg-gradient-to-r from-relaive-primary to-relaive-secondary px-5 py-2 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add Inspection
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────────────────────

export function InspectionsPageV2() {
  const { data: savedProperties } = useAsyncData(listSavedProperties, [])
  const [inspections, setInspectionsState] = useState<Inspection[]>(getInspections)
  const [selectedId, setSelectedId] = useState<string | null>(inspections[0]?.id ?? null)
  const [showAddModal, setShowAddModal] = useState(false)

  function persist(next: Inspection[]) {
    setInspections(next)
    setInspectionsState(next)
  }

  function handleAdd(inspection: Inspection) {
    const next = [...inspections, inspection]
    persist(next)
    setSelectedId(inspection.id)
  }

  function handleRemove(id: string) {
    const next = inspections.filter((i) => i.id !== id)
    persist(next)
    if (selectedId === id) setSelectedId(next[0]?.id ?? null)
  }

  function updateItem(inspectionId: string, itemId: string, patch: Partial<ChecklistItem>) {
    const next = inspections.map((insp) =>
      insp.id !== inspectionId
        ? insp
        : { ...insp, checklist: insp.checklist.map((item) => (item.id !== itemId ? item : { ...item, ...patch })) },
    )
    persist(next)
  }

  function updateOverallNotes(inspectionId: string, overallNotes: string) {
    const next = inspections.map((insp) => (insp.id !== inspectionId ? insp : { ...insp, overallNotes }))
    persist(next)
  }

  const selected = inspections.find((i) => i.id === selectedId) ?? null
  const totalCost = selected?.checklist.reduce((sum, item) => sum + (item.estimatedCost ?? 0), 0) ?? 0
  const issues = selected?.checklist.filter((i) => i.status === 'concern' || i.status === 'major') ?? []

  return (
    <>
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4 font-sans">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">Inspections</h1>
            <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">Track inspection checklists and property notes</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-relaive-primary to-relaive-secondary px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg"
          >
            <PlusIcon />
            Add Inspection
          </button>
        </header>

        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <div className="space-y-3">
            {inspections.map((insp) => {
              const isActive = insp.id === selectedId
              const majors = insp.checklist.filter((c) => c.status === 'major').length
              const checked = insp.checklist.filter((c) => c.status !== 'unchecked').length
              return (
                <div
                  key={insp.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(insp.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setSelectedId(insp.id)
                  }}
                  className={`w-full cursor-pointer rounded-2xl border p-4 text-left transition-all ${
                    isActive ? 'border-relaive-primary bg-relaive-primary text-white shadow-md' : 'border-black/5 bg-white hover:border-relaive-primary/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-white/20' : 'bg-relaive-primary/10'}`}>
                      <span className={isActive ? 'text-white' : 'text-relaive-primary'}>
                        <HomeIcon />
                      </span>
                    </div>
                    <div className="min-w-0 flex-grow">
                      <p className={`truncate text-sm font-semibold ${isActive ? 'text-white' : 'text-relaive-navy'}`}>{insp.address}</p>
                      <p className={`truncate text-xs ${isActive ? 'text-white/70' : 'text-relaive-primary'}`}>{insp.suburb}</p>
                      <p className={`mt-1 text-xs ${isActive ? 'text-white/60' : 'text-relaive-gray'}`}>
                        {insp.date || 'No date set'} {insp.time ? `· ${insp.time}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove(insp.id)
                      }}
                      title="Remove inspection"
                      className={`flex-shrink-0 rounded-lg p-1.5 transition-colors ${isActive ? 'text-white/60 hover:bg-white/10' : 'text-relaive-navy/30 hover:bg-red-50 hover:text-red-500'}`}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                  {checked > 0 ? (
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`text-[10px] font-medium ${isActive ? 'text-white/70' : 'text-relaive-gray'}`}>
                        {checked}/{insp.checklist.length} checked
                      </span>
                      {majors > 0 ? (
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${isActive ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600'}`}>
                          {majors} major
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )
            })}

            {inspections.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/10 bg-white py-10 text-center">
                <p className="text-sm text-relaive-gray">No inspections yet</p>
                <button type="button" onClick={() => setShowAddModal(true)} className="mt-1 text-xs text-relaive-primary hover:underline">
                  Add your first
                </button>
              </div>
            ) : null}
          </div>

          {selected ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-black/5 bg-white p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-relaive-navy">{selected.address}</h2>
                    <p className="text-sm text-relaive-primary">{selected.suburb}</p>
                    <p className="mt-0.5 text-xs text-relaive-gray">
                      {selected.date || 'No date set'} {selected.time ? `at ${selected.time}` : ''} {selected.notes ? `· ${selected.notes}` : ''}
                    </p>
                  </div>
                  {totalCost > 0 ? (
                    <div className="flex-shrink-0 text-right">
                      <p className="mb-0.5 text-xs text-relaive-gray">Est. Repair Cost</p>
                      <p className="text-lg font-bold text-amber-600">${totalCost.toLocaleString()}</p>
                    </div>
                  ) : null}
                </div>
                {issues.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-relaive-gray">
                      {issues.length} issue{issues.length > 1 ? 's' : ''} found:
                    </span>
                    {issues.slice(0, 3).map((i) => (
                      <span key={i.id} className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${i.status === 'major' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                        {i.label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
                <div className="flex items-center justify-between border-b border-[#EEF3F7] px-5 py-4">
                  <h3 className="text-sm font-semibold text-relaive-navy">Inspection Checklist</h3>
                  <span className="text-xs text-relaive-gray/70">Tap status badge to cycle</span>
                </div>
                <div className="divide-y divide-[#EEF3F7]">
                  {selected.checklist.map((item) => {
                    const status = STATUS_CONFIG[item.status]
                    return (
                      <div key={item.id} className="px-5 py-3.5">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => updateItem(selected.id, item.id, { status: nextStatus(item.status) })}
                            className={`mt-0.5 flex-shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${status.bg} ${status.text}`}
                          >
                            {status.label}
                          </button>
                          <div className="min-w-0 flex-grow">
                            <p className="mb-0.5 text-sm font-medium text-relaive-navy">{item.label}</p>
                            <input
                              type="text"
                              value={item.note}
                              onChange={(e) => updateItem(selected.id, item.id, { note: e.target.value })}
                              placeholder="Add a note…"
                              className="w-full rounded-lg bg-transparent px-0 py-0.5 text-xs text-relaive-gray placeholder:text-relaive-navy/25 transition-all focus:bg-[#EEF3F7] focus:px-2 focus:py-1 focus:outline-none"
                            />
                          </div>
                          <input
                            type="number"
                            min={0}
                            value={item.estimatedCost ?? ''}
                            onChange={(e) =>
                              updateItem(selected.id, item.id, {
                                estimatedCost: e.target.value === '' ? null : Number(e.target.value),
                              })
                            }
                            placeholder="$"
                            className="w-20 flex-shrink-0 rounded-lg bg-[#EEF3F7] px-2 py-1 text-right text-xs text-amber-700 focus:outline-none"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white p-5">
                <h3 className="mb-3 text-sm font-semibold text-relaive-navy">Overall Notes</h3>
                <textarea
                  value={selected.overallNotes}
                  onChange={(e) => updateOverallNotes(selected.id, e.target.value)}
                  placeholder="Add your overall impression of this property…"
                  className="h-24 w-full resize-none rounded-xl bg-[#EEF3F7] px-4 py-3 text-sm text-relaive-navy placeholder:text-relaive-navy/30 focus:outline-none focus:ring-1 focus:ring-relaive-primary/30"
                />
                <p className="mt-3 text-xs text-relaive-gray/70">Changes are saved automatically to this device</p>
              </div>
            </div>
          ) : (
            <div className="hidden rounded-2xl border border-black/5 bg-white py-16 text-center lg:block">
              <p className="text-sm text-relaive-gray">Select or add an inspection to get started</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal ? (
        <AddInspectionModal savedProperties={savedProperties ?? []} onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
      ) : null}
    </>
  )
}
