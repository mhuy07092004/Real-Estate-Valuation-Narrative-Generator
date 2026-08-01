import { CaseTable } from '../../../components/ui/table/case-table'
import { useAsyncData } from '../../../hooks/use-async-data'
import {
  getValuationCasesMockData,
  getValuerCaseListMockData,
} from '../../../services/valuer'

export function ValuationCases() {
  const { data } = useAsyncData(getValuationCasesMockData, [])
  const { data: cases } = useAsyncData(getValuerCaseListMockData, [])

  if (!data || !cases) {
    return <div className="p-6 text-sm text-relaive-gray sm:p-8">Loading valuation cases…</div>
  }

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
        <CaseTable cases={cases} />
      </div>
    </div>
  )
}
