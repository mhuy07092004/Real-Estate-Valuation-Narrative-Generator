import { StatCard } from '../../../../components/ui/stat-card/stat-card'
import { getValuationCasesMockData } from '../../../../services/mock-dashboardservice'

export function ValuationCases() {
  const data = getValuationCasesMockData()

  return (
    <div className="flex flex-col">
      <header className="font-sans px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
          Valuation Cases
        </h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">
          {data.totalCases} total cases, {data.returnedForRevision} returned for revision
        </p>
      </header>

      <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.stats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} tone={stat.tone} />
          ))}
        </div>
      </div>
    </div>
  )
}
