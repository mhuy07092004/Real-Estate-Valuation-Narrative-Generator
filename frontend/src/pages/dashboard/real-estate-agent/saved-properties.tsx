import { useEffect, useState } from 'react'
import { BookmarkIcon } from '../../../components/ui/navbar/dashboard-navbar-icons'
import { SavedPropertyCard } from '../../../features/dashboard/components/saved-property-card'
import { useAsyncData } from '../../../hooks/use-async-data'
import { getAgentSavedProperties, type AgentSavedProperty } from '../../../services/agent'

export function SavedProperties() {
  const { data } = useAsyncData(getAgentSavedProperties, [])
  const [properties, setProperties] = useState<AgentSavedProperty[]>([])

  useEffect(() => {
    if (data) setProperties(data)
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
              Saved Properties
            </h1>
            <p className="mt-1 text-sm text-relaive-gray sm:text-base">
              Properties saved for comparable sales research
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.length === 0 ? (
            <p className="text-sm text-relaive-gray">No saved properties yet.</p>
          ) : (
            properties.map((property) => (
              <SavedPropertyCard
                key={property.id}
                property={property}
                onRemove={(id) =>
                  setProperties((current) => current.filter((item) => item.id !== id))
                }
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
