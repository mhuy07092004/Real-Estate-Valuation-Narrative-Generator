import type { DataTableTab } from '../../../components/ui/table/data-table'
import { CaseTable } from '../../../components/ui/table/case-table'
import { useAsyncData } from '../../../hooks/use-async-data'
import type { CaseItem } from '../../../services/dashboard'
import { getValuerCaseListMockData } from '../../../services/valuer'

const REPORT_TABS: DataTableTab<CaseItem>[] = [
  { id: 'recent', label: 'Recent' },
  {
    id: 'draft',
    label: 'Draft',
    filter: (item) => item.status === 'draft',
  },
  {
    id: 'shared',
    label: 'Shared',
    filter: (item) => item.status === 'exported',
  },
  {
    id: 'archived',
    label: 'Archived',
    filter: (item) => item.status === 'approved',
  },
]

export function ValuerReport() {
  const { data: cases } = useAsyncData(getValuerCaseListMockData, [])

  if (!cases) {
    return <div className="p-6 text-sm text-relaive-gray sm:p-8">Loading reports…</div>
  }

  return (
    <div className="flex flex-col">
      <header className="font-sans px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
          Reports
        </h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">
          Manage, share and export your appraisal reports
        </p>
      </header>

      <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
        <CaseTable
          cases={cases}
          tabs={REPORT_TABS}
          defaultTabId="recent"
          searchPlaceholder="Search reports, properties, clients..."
          emptyMessage="No reports match your search."
        />
      </div>
    </div>
  )
}
