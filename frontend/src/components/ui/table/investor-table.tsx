import type { ColumnDef } from '@tanstack/react-table'
import type { InvestorReportItem } from '../../../services/investor'
import { DataTable, type DataTableTab } from './data-table'
import { getInvestorReportStatusLabel } from './status-badge'

type InvestorTableProps = {
  reports: InvestorReportItem[]
  columns: ColumnDef<InvestorReportItem, unknown>[]
  className?: string
  tabs?: DataTableTab<InvestorReportItem>[]
  defaultTabId?: string
  searchPlaceholder?: string
  emptyMessage?: string
}

export function formatInvestorYield(value: number | null): string {
  if (value == null) return '—'
  return `${value.toFixed(1)}%`
}

export function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function InvestorTable({
  reports,
  columns,
  className = '',
  tabs,
  defaultTabId = 'recent',
  searchPlaceholder = 'Search properties, portfolios, report types...',
  emptyMessage = 'No investor reports match your search.',
}: InvestorTableProps) {
  return (
    <DataTable
      data={reports}
      columns={columns}
      tabs={tabs}
      defaultTabId={defaultTabId}
      getRowId={(item) => item.id}
      searchPlaceholder={searchPlaceholder}
      searchFilter={(item, query) =>
        item.id.toLowerCase().includes(query) ||
        item.propertyName.toLowerCase().includes(query) ||
        item.suburb.toLowerCase().includes(query) ||
        item.portfolio.toLowerCase().includes(query) ||
        item.reportType.toLowerCase().includes(query) ||
        getInvestorReportStatusLabel(item.status).toLowerCase().includes(query)
      }
      emptyMessage={emptyMessage}
      className={className}
    />
  )
}
