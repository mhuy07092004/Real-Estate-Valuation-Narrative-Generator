import { useState } from 'react'
import { Card, CardTitle } from '../../../../components/ui/card/card'
import { OptionCardGroup, type OptionCardItem } from '../../../../components/ui/option-card/option-card'
import { AddressSearch } from '../../../../components/ui/search-bar/address-search'
import { Button } from '../../../../components/ui/button/button'
import { PROPERTY_INPUT_METHODS } from '../../../../services/mock-common'
import { getPropertyInputMethodIcon } from './generate-report-icons'
import { EnterAddressForm } from './enter-address-form'
import { StepActions } from './step-actions'

const OPTION_ITEMS: OptionCardItem[] = PROPERTY_INPUT_METHODS.map((method) => ({
  id: method.id,
  title: method.title,
  description: method.description,
  icon: getPropertyInputMethodIcon(method.iconKey),
}))

function SearchPropertyPanel() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <AddressSearch className="max-w-none min-w-0 flex-1" />
      <Button variant="primary" size="md" type="button">
        Search
      </Button>
    </div>
  )
}

function UploadFilePanel() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-black/10 bg-slate-50/60 px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-relaive-primary/10 text-relaive-primary">
        {getPropertyInputMethodIcon('upload')}
      </span>
      <p className="text-sm font-medium text-relaive-navy">Drag &amp; drop your CSV or spreadsheet here</p>
      <p className="text-xs text-relaive-gray">Supported formats: CSV, XLSX</p>
      <Button type="button" variant="outline" size="sm">
        Browse Files
      </Button>
    </div>
  )
}

type PropertyInputPanelProps = {
  onContinue: () => void
}

export function PropertyInputPanel({ onContinue }: PropertyInputPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleSelect = (id: string) => {
    setSelectedId((current) => (current === id ? null : id))
  }

  return (
    <Card>
      <CardTitle>Choose Property Input Method</CardTitle>

      <div className="mt-6">
        <OptionCardGroup items={OPTION_ITEMS} selectedId={selectedId} onSelect={handleSelect} />
      </div>

      {selectedId ? (
        <div className="mt-6 rounded-2xl border border-slate-100/60 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] sm:p-6">
          {selectedId === 'enter-address' ? <EnterAddressForm /> : null}
          {selectedId === 'search-property' ? <SearchPropertyPanel /> : null}
          {selectedId === 'upload-file' ? <UploadFilePanel /> : null}
        </div>
      ) : null}

      {/* Step 1 — no Back button */}
      <StepActions onContinue={onContinue} continueDisabled={!selectedId} />
    </Card>
  )
}
