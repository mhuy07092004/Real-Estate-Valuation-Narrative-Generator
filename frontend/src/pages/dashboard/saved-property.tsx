import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BookmarkIcon } from '../../components/ui/navbar/dashboard-navbar-icons'
import {
  SavedPropertyCard,
  type SavedPropertyCardData,
} from '../../features/dashboard/components/saved-property-card'
import { PropertyGridSkeleton } from '../../features/dashboard/components/property-grid-skeleton'
import { useAsyncData } from '../../hooks/use-async-data'
import { getAgentSavedProperties } from '../../services/agent'
import { getSavedProperties } from '../../services/buyer'
import { getInvestorSavedProperties } from '../../services/investor'
import { getValuerSavedEvidence } from '../../services/valuer'

type SavedRole = 'agent' | 'investor' | 'buyer' | 'valuer'

type SavedRoleConfig = {
  title: string
  description: string
  emptyLabel: string
  fetcher: () => Promise<SavedPropertyCardData[]>
  compareTo?: string
}

const SAVED_ROLE_CONFIG: Record<SavedRole, SavedRoleConfig> = {
  agent: {
    title: 'Saved Properties',
    description: 'Properties saved for comparable sales research',
    emptyLabel: 'No saved properties yet.',
    fetcher: getAgentSavedProperties,
  },
  investor: {
    title: 'Saved Properties',
    description: 'Properties saved for investment research',
    emptyLabel: 'No saved properties yet.',
    fetcher: getInvestorSavedProperties,
  },
  buyer: {
    title: 'Saved Properties',
    description: 'Properties saved while searching the market',
    emptyLabel: 'No saved properties yet.',
    fetcher: getSavedProperties,
  },
  valuer: {
    title: 'Saved Evidence',
    description: 'Sales evidence saved for valuation research',
    emptyLabel: 'No saved evidence yet.',
    fetcher: getValuerSavedEvidence,
    compareTo: '/dashboard/valuer/evidence-centre',
  },
}

function resolveSavedRole(role: string | undefined): SavedRole {
  if (role === 'investor' || role === 'buyer' || role === 'valuer') return role
  return 'agent'
}

export function SavedProperty() {
  const { role } = useParams<{ role: string }>()
  const config = SAVED_ROLE_CONFIG[resolveSavedRole(role)]
  const { data, isLoading } = useAsyncData(config.fetcher, [role])
  const [items, setItems] = useState<SavedPropertyCardData[]>([])

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
              {config.title}
            </h1>
            <p className="mt-1 text-sm text-relaive-gray sm:text-base">{config.description}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading && items.length === 0 ? (
            <PropertyGridSkeleton count={3} variant="compact" />
          ) : items.length === 0 ? (
            <p className="text-sm text-relaive-gray">{config.emptyLabel}</p>
          ) : (
            items.map((item) => (
              <SavedPropertyCard
                key={item.id}
                property={item}
                compareTo={config.compareTo}
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
