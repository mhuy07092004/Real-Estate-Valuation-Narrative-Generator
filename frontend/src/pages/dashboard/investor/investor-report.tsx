import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import type { DataTableTab } from '../../../components/ui/table/data-table'
import { ClockIcon } from '../../../components/ui/table/data-table'
import {
  ChevronIcon,
  formatInvestorYield,
  InvestorTable,
} from '../../../components/ui/table/investor-table'
import {
  getInvestorReportStatusLabel,
  InvestorReportStatusBadge,
} from '../../../components/ui/table/status-badge'
import {
  getInvestorReportListMockData,
  getInvestorReportSummary,
  type InvestorReportItem,
} from '../../../services/mock-investor'

dayjs.extend(relativeTime)

const currencyFormatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
})

const REPORT_TABS: DataTableTab<InvestorReportItem>[] = [
  { id: 'recent', label: 'Recent' },
  {
    id: 'draft',
    label: 'Draft',
    filter: (item) => item.status === 'draft',
  },
  {
    id: 'shared',
    label: 'Shared',
    filter: (item) => item.status === 'shared',
  },
  {
    id: 'archived',
    label: 'Archived',
    filter: (item) => item.status === 'archived',
  },
]

export function InvestorReport() {
  const reports = getInvestorReportListMockData()
  const { totalReports, draftCount, sharedCount } = getInvestorReportSummary()

  const columns = useMemo<ColumnDef<InvestorReportItem, unknown>[]>(
    () => [
      {
        id: 'property',
        header: 'Property',
        accessorFn: (row) => row.propertyName,
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex flex-col gap-1 py-1">
              <span className="text-xs font-semibold text-relaive-primary">{item.id}</span>
              <span className="text-sm font-bold text-relaive-navy">{item.propertyName}</span>
              <span className="text-xs text-relaive-gray">
                {item.suburb} · {item.portfolio}
              </span>
            </div>
          )
        },
      },
      {
        id: 'reportType',
        header: 'Report Type',
        accessorFn: (row) => row.reportType,
        cell: ({ row }) => (
          <span className="text-sm text-relaive-navy">{row.original.reportType}</span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => getInvestorReportStatusLabel(row.status),
        cell: ({ row }) => <InvestorReportStatusBadge status={row.original.status} />,
        sortingFn: (rowA, rowB) =>
          getInvestorReportStatusLabel(rowA.original.status).localeCompare(
            getInvestorReportStatusLabel(rowB.original.status),
          ),
      },
      {
        id: 'value',
        header: 'Purchase Value',
        accessorFn: (row) => row.purchaseValue,
        cell: ({ row }) => (
          <span className="text-sm font-medium text-relaive-navy">
            {currencyFormatter.format(row.original.purchaseValue)}
          </span>
        ),
      },
      {
        id: 'yield',
        header: 'Gross Yield',
        accessorFn: (row) => row.grossYield,
        cell: ({ row }) => (
          <span className="text-sm text-relaive-navy">
            {formatInvestorYield(row.original.grossYield)}
          </span>
        ),
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.grossYield
          const b = rowB.original.grossYield
          if (a == null && b == null) return 0
          if (a == null) return -1
          if (b == null) return 1
          return a - b
        },
      },
      {
        id: 'updated',
        header: 'Updated',
        accessorFn: (row) => row.updatedAt,
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 text-sm text-relaive-gray">
            <ClockIcon />
            {dayjs(row.original.updatedAt).fromNow()}
          </span>
        ),
        sortingFn: (rowA, rowB) =>
          new Date(rowA.original.updatedAt).getTime() -
          new Date(rowB.original.updatedAt).getTime(),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: () => (
          <span className="flex justify-end text-relaive-gray/50" aria-hidden="true">
            <ChevronIcon />
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <div className="flex flex-col">
      <header className="font-sans px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
          Investor Report
        </h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">
          {totalReports} reports · {draftCount} drafts · {sharedCount} shared
        </p>
      </header>

      <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
        <InvestorTable
          reports={reports}
          columns={columns}
          tabs={REPORT_TABS}
          defaultTabId="recent"
          searchPlaceholder="Search properties, portfolios, report types..."
          emptyMessage="No investor reports match your search."
        />
      </div>
    </div>
  )
}
