import { useEffect, useState } from 'react'
import { BookmarkIcon } from '../../../components/ui/navbar/dashboard-navbar-icons'
import { SavedPropertyCard } from '../../../features/dashboard/components/saved-property-card'
import { useAsyncData } from '../../../hooks/use-async-data'
import { getValuerSavedEvidence, type ValuerSavedEvidence } from '../../../services/valuer'

export function SavedEvidence() {
  const { data } = useAsyncData(getValuerSavedEvidence, [])
  const [items, setItems] = useState<ValuerSavedEvidence[]>([])

  useEffect(() => {
    if (data) setItems(data)
  }, [data])

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1 flex-col gap-6 p-4 sm:gap-7 sm:p-6 lg:p-8">
        <header className="flex items-start gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-relaive-primary text-white">
            <BookmarkIcon className="fill-current" width={18} height={18} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
              Saved Evidence
            </h1>
            <p className="mt-1 text-sm text-relaive-gray sm:text-base">
              Sales evidence saved for valuation research
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 ? (
            <p className="text-sm text-relaive-gray">No saved evidence yet.</p>
          ) : (
            items.map((item) => (
              <SavedPropertyCard
                key={item.id}
                property={item}
                compareTo="/dashboard/valuer/evidence-centre"
                onRemove={(id) =>
                  setItems((current) => current.filter((entry) => entry.id !== id))
                }
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
