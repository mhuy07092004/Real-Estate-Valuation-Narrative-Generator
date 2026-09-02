import { useEffect, useMemo, useState, type ReactElement } from 'react'
import dayjs from 'dayjs'
import { Button } from '../../../components/ui/button/button'
import { Card } from '../../../components/ui/card/card'
import { HomeIcon, PlusIcon, UserIcon } from '../../../components/ui/navbar/dashboard-navbar-icons'
import { useAsyncData } from '../../../hooks/use-async-data'
import { ListSkeleton } from '../../../features/dashboard/components/list-row-skeleton'
import {
  getBuyerInspections,
  saveBuyerInspection,
  type BuyerInspection,
  type InspectionItemStatus,
} from '../../../services/buyer'

const INSPECTION_STATUSES: InspectionItemStatus[] = ['ok', 'concern', 'major_issue', 'not_checked']

const INSPECTION_STATUS_STYLES: Record<
  InspectionItemStatus,
  { bg: string; text: string; label: string }
> = {
  ok: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'OK' },
  concern: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Concern' },
  major_issue: { bg: 'bg-red-50', text: 'text-red-600', label: 'Major Issue' },
  not_checked: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Not Checked' },
}

function getInspectionStatusLabel(status: InspectionItemStatus): string {
  return INSPECTION_STATUS_STYLES[status].label
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 9.5h18" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3v3.5M16 3v3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function SaveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 4h11l3 3v13H5V4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8 4v5h8V4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 14h8v6H8v-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 12.5l2.5 2.5L16 9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function WarningTriangleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4.5L21 19.5H3L12 4.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 10v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="16.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

function DashCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

const INSPECTION_STATUS_ICONS: Record<InspectionItemStatus, () => ReactElement> = {
  ok: CheckCircleIcon,
  concern: WarningTriangleIcon,
  major_issue: WarningTriangleIcon,
  not_checked: DashCircleIcon,
}

function InspectionStatusBadge({ status }: { status: InspectionItemStatus }) {
  const styles = INSPECTION_STATUS_STYLES[status]
  const Icon = INSPECTION_STATUS_ICONS[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${styles.bg} ${styles.text}`}
    >
      <Icon />
      {styles.label}
    </span>
  )
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-AU')}`
}

function isIssue(status: InspectionItemStatus): boolean {
  return status === 'concern' || status === 'major_issue'
}

type InspectionPropertyRowProps = {
  inspection: BuyerInspection
  isSelected: boolean
  onSelect: () => void
}

function InspectionPropertyRow({ inspection, isSelected, onSelect }: InspectionPropertyRowProps) {
  const total = inspection.checklist.length
  const checkedCount = inspection.checklist.filter((item) => item.status !== 'not_checked').length
  const issueCount = inspection.checklist.filter((item) => isIssue(item.status)).length

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`flex w-full items-start gap-3 px-4 py-4 text-left transition-colors sm:px-5 ${
        isSelected ? 'bg-[#F1F6F7]' : 'hover:bg-black/[0.02]'
      }`}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E8F2F8] text-relaive-primary">
        <HomeIcon width={16} height={16} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold tracking-tight text-[#1C2A38]">
          {inspection.address}
        </p>
        <p className="mt-0.5 truncate text-xs text-relaive-gray">{inspection.suburb}</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-relaive-gray">
          <CalendarIcon />
          {dayjs(inspection.inspectionDate).format('ddd D MMM YYYY, h:mma')}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-relaive-gray">
          <span>
            {checkedCount}/{total} checked
          </span>
          {issueCount > 0 ? (
            <span className="rounded-full bg-orange-50 px-2 py-0.5 font-medium text-orange-600">
              {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  )
}

type ChecklistRowProps = {
  item: BuyerInspection['checklist'][number]
  onStatusChange: (status: InspectionItemStatus) => void
  onDescriptionChange: (description: string) => void
  onCostChange: (estimatedCost: number | undefined) => void
}

function ChecklistRow({ item, onStatusChange, onDescriptionChange, onCostChange }: ChecklistRowProps) {
  const isNotChecked = item.status === 'not_checked'
  const canHaveCost = isIssue(item.status)

  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [draftDescription, setDraftDescription] = useState(item.description)

  const [isEditingCost, setIsEditingCost] = useState(false)
  const [draftCost, setDraftCost] = useState(
    item.estimatedCost != null ? String(item.estimatedCost) : '',
  )

  useEffect(() => {
    setDraftDescription(item.description)
  }, [item.description])

  useEffect(() => {
    setDraftCost(item.estimatedCost != null ? String(item.estimatedCost) : '')
  }, [item.estimatedCost])

  function commitDescription() {
    const next = draftDescription.trim()
    if (next.length > 0 && next !== item.description) {
      onDescriptionChange(next)
    } else {
      setDraftDescription(item.description)
    }
    setIsEditingDescription(false)
  }

  function cancelDescriptionEdit() {
    setDraftDescription(item.description)
    setIsEditingDescription(false)
  }

  function commitCost() {
    const trimmed = draftCost.trim()
    const parsed = trimmed === '' ? undefined : Number(trimmed)
    const next = parsed != null && !Number.isNaN(parsed) && parsed >= 0 ? parsed : undefined
    if (next !== item.estimatedCost) {
      onCostChange(next)
    } else {
      setDraftCost(item.estimatedCost != null ? String(item.estimatedCost) : '')
    }
    setIsEditingCost(false)
  }

  function cancelCostEdit() {
    setDraftCost(item.estimatedCost != null ? String(item.estimatedCost) : '')
    setIsEditingCost(false)
  }

  return (
    <div className="flex items-start gap-3 py-3.5 first:pt-0">
      <label className="relative mt-0.5 shrink-0">
        <span className="sr-only">Status for {item.label}</span>
        <select
          value={item.status}
          aria-label={`Status for ${item.label}`}
          className="absolute inset-0 z-10 cursor-pointer opacity-0"
          onChange={(event) => onStatusChange(event.target.value as InspectionItemStatus)}
        >
          {INSPECTION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {getInspectionStatusLabel(status)}
            </option>
          ))}
        </select>
        <InspectionStatusBadge status={item.status} />
      </label>

      <div className={`min-w-0 flex-1 ${isNotChecked ? 'opacity-50' : ''}`}>
        <p className="text-sm font-semibold text-[#1C2A38]">{item.label}</p>
        {isEditingDescription ? (
          <input
            autoFocus
            value={draftDescription}
            aria-label={`Edit description for ${item.label}`}
            onChange={(event) => setDraftDescription(event.target.value)}
            onBlur={commitDescription}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitDescription()
              if (event.key === 'Escape') cancelDescriptionEdit()
            }}
            className="mt-0.5 w-full rounded-md border border-relaive-primary/40 bg-white px-2 py-1 text-sm text-relaive-navy focus:border-relaive-primary focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingDescription(true)}
            className="-mx-1 mt-0.5 block w-full rounded px-1 text-left text-sm text-relaive-gray transition-colors hover:bg-black/[0.03]"
          >
            {item.description}
          </button>
        )}
      </div>

      {canHaveCost ? (
        isEditingCost ? (
          <span className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-amber-600">
            $
            <input
              autoFocus
              type="number"
              min={0}
              step={10}
              value={draftCost}
              aria-label={`Edit estimated cost for ${item.label}`}
              onChange={(event) => setDraftCost(event.target.value)}
              onBlur={commitCost}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitCost()
                if (event.key === 'Escape') cancelCostEdit()
              }}
              className="w-20 rounded-md border border-amber-300 bg-white px-1.5 py-0.5 text-sm text-amber-600 focus:outline-none"
            />
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingCost(true)}
            className="shrink-0 rounded px-1.5 py-0.5 text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-50"
          >
            {item.estimatedCost != null ? formatCurrency(item.estimatedCost) : 'Add cost'}
          </button>
        )
      ) : null}
    </div>
  )
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function Inspections() {
  const { data, isLoading } = useAsyncData(getBuyerInspections, [])
  const [inspections, setInspections] = useState<BuyerInspection[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  useEffect(() => {
    if (data) {
      setInspections(data)
      setSelectedId((current) => current ?? data[0]?.id ?? null)
    }
  }, [data])

  const selectedInspection = inspections.find((item) => item.id === selectedId) ?? null

  const issues = useMemo(
    () => selectedInspection?.checklist.filter((item) => isIssue(item.status)) ?? [],
    [selectedInspection],
  )

  const repairCost = useMemo(
    () =>
      issues.reduce((sum, item) => sum + (item.estimatedCost ?? 0), 0),
    [issues],
  )

  function handleSelect(id: string) {
    setSelectedId(id)
    setSaveStatus('idle')
  }

  function handleStatusChange(inspectionId: string, itemId: string, status: InspectionItemStatus) {
    setInspections((current) =>
      current.map((inspection) => {
        if (inspection.id !== inspectionId) return inspection
        return {
          ...inspection,
          checklist: inspection.checklist.map((item) =>
            item.id === itemId ? { ...item, status } : item,
          ),
        }
      }),
    )
  }

  function handleNotesChange(inspectionId: string, notes: string) {
    setInspections((current) =>
      current.map((inspection) =>
        inspection.id === inspectionId ? { ...inspection, overallNotes: notes } : inspection,
      ),
    )
  }

  function handleDescriptionChange(inspectionId: string, itemId: string, description: string) {
    setInspections((current) =>
      current.map((inspection) => {
        if (inspection.id !== inspectionId) return inspection
        return {
          ...inspection,
          checklist: inspection.checklist.map((item) =>
            item.id === itemId ? { ...item, description } : item,
          ),
        }
      }),
    )
  }

  function handleCostChange(inspectionId: string, itemId: string, estimatedCost: number | undefined) {
    setInspections((current) =>
      current.map((inspection) => {
        if (inspection.id !== inspectionId) return inspection
        return {
          ...inspection,
          checklist: inspection.checklist.map((item) =>
            item.id === itemId ? { ...item, estimatedCost } : item,
          ),
        }
      }),
    )
  }

  // All edits above only touch local state — nothing is sent to the backend
  // until the user explicitly clicks "Save Checklist" here.
  async function handleSaveChecklist() {
    if (!selectedInspection) return
    setSaveStatus('saving')
    try {
      await saveBuyerInspection(selectedInspection)
      setSaveStatus('saved')
    } catch (error) {
      console.error('Failed to save inspection checklist (backend endpoint not ready yet):', error)
      setSaveStatus('error')
    } finally {
      window.setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1 flex-col gap-6 p-4 sm:gap-7 sm:p-6 lg:p-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
              Inspection Notes
            </h1>
            <p className="mt-1 text-sm text-relaive-gray sm:text-base">
              Track inspection checklists and property notes
            </p>
          </div>
          <Button size="sm" className="gap-1.5 rounded-full bg-[#5DA7AC] px-4 hover:bg-[#4E969B]">
            <PlusIcon width={14} height={14} />
            Add Inspection
          </Button>
        </header>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0 lg:flex-[3] lg:shrink-0">
            {isLoading && inspections.length === 0 ? (
              <ListSkeleton rows={3} avatarShape="circle" variant="divided" />
            ) : inspections.length === 0 ? (
              <p className="text-sm text-relaive-gray">No inspections scheduled yet.</p>
            ) : (
              <Card className="overflow-hidden p-0! sm:p-0!">
                <ul className="divide-y divide-black/5">
                  {inspections.map((inspection) => (
                    <li key={inspection.id}>
                      <InspectionPropertyRow
                        inspection={inspection}
                        isSelected={inspection.id === selectedId}
                        onSelect={() => handleSelect(inspection.id)}
                      />
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {selectedInspection ? (
            <div className="min-w-0 flex-1 lg:flex-[7]">
              <Card className="flex flex-col gap-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold tracking-tight text-[#1C2A38] sm:text-lg">
                      {selectedInspection.address}
                    </p>
                    <p className="mt-0.5 text-sm text-relaive-gray">{selectedInspection.suburb}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-relaive-gray sm:text-sm">
                      <span className="flex items-center gap-1.5">
                        <CalendarIcon />
                        {dayjs(selectedInspection.inspectionDate).format('ddd D MMM YYYY \u2022 h:mma')}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <UserIcon />
                        {selectedInspection.agents.join(' \u00b7 ')}
                      </span>
                    </div>
                  </div>

                  {repairCost > 0 ? (
                    <div className="text-right">
                      <p className="text-xs font-medium uppercase tracking-wide text-relaive-gray">
                        Est. Repair Cost
                      </p>
                      <p className="mt-0.5 text-lg font-semibold text-amber-600">
                        {formatCurrency(repairCost)}
                      </p>
                    </div>
                  ) : null}
                </div>

                {issues.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 border-t border-black/5 pt-4">
                    <span className="text-sm font-semibold text-[#1C2A38]">
                      {issues.length} {issues.length === 1 ? 'Issue' : 'Issues'} Found:
                    </span>
                    {issues.map((item) => {
                      const styles = INSPECTION_STATUS_STYLES[item.status]
                      return (
                        <span
                          key={item.id}
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${styles.bg} ${styles.text}`}
                        >
                          {item.label}
                        </span>
                      )
                    })}
                  </div>
                ) : null}

                <div className="border-t border-black/5 pt-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-sm font-semibold text-[#1C2A38]">Inspection Checklist</h2>
                    <span className="text-xs text-relaive-gray/80">Tap status to change</span>
                  </div>
                  <div className="mt-2 divide-y divide-black/5">
                    {selectedInspection.checklist.map((item) => (
                      <ChecklistRow
                        key={item.id}
                        item={item}
                        onStatusChange={(status) =>
                          handleStatusChange(selectedInspection.id, item.id, status)
                        }
                        onDescriptionChange={(description) =>
                          handleDescriptionChange(selectedInspection.id, item.id, description)
                        }
                        onCostChange={(estimatedCost) =>
                          handleCostChange(selectedInspection.id, item.id, estimatedCost)
                        }
                      />
                    ))}
                  </div>
                </div>

                <div className="border-t border-black/5 pt-5">
                  <label
                    htmlFor="overall-notes"
                    className="text-sm font-semibold text-[#1C2A38]"
                  >
                    Overall Notes
                  </label>
                  <textarea
                    id="overall-notes"
                    rows={3}
                    placeholder="Add your overall impression of this property..."
                    value={selectedInspection.overallNotes}
                    onChange={(event) => handleNotesChange(selectedInspection.id, event.target.value)}
                    className="mt-2 w-full resize-none rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm text-relaive-navy placeholder:text-relaive-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
                  />

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span
                      className={`text-xs ${saveStatus === 'error' ? 'text-red-500' : 'text-relaive-gray'}`}
                    >
                      {saveStatus === 'saving'
                        ? 'Saving\u2026'
                        : saveStatus === 'saved'
                          ? 'Checklist saved'
                          : saveStatus === 'error'
                            ? "Couldn't reach the server \u2014 changes kept locally"
                            : 'Edits stay on this device until you save'}
                    </span>
                    <Button
                      size="sm"
                      className="gap-1.5 rounded-full bg-[#5DA7AC] px-4 hover:bg-[#4E969B]"
                      disabled={saveStatus === 'saving'}
                      onClick={handleSaveChecklist}
                    >
                      <SaveIcon />
                      {saveStatus === 'saving' ? 'Saving...' : 'Save Checklist'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
