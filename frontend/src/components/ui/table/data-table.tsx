import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type FilterFn,
  type SortingState,
} from '@tanstack/react-table'
import { FilterButton } from '../button/filter-button'

export type DataTableTab<T> = {
  id: string
  label: string
  filter?: (item: T) => boolean
}

type DataTableProps<T> = {
  data: T[]
  columns: ColumnDef<T, unknown>[]
  tabs?: DataTableTab<T>[]
  defaultTabId?: string
  getRowId: (item: T) => string
  searchPlaceholder?: string
  searchFilter?: (item: T, query: string) => boolean
  onFilterClick?: () => void
  onExportClick?: () => void
  emptyMessage?: string
  className?: string
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5v11m0 0l-4-4m4 4l4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4.5 17v2.5a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function SortIcon({ direction }: { direction: 'asc' | 'desc' | false }) {
  if (!direction) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-relaive-gray/40">
        <path d="M7 9l5-5 5 5M7 15l5 5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={direction === 'desc' ? 'rotate-180' : ''}
    >
      <path d="M7 14l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8v4.5l3 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function WarningIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5L2.5 20h19L12 3.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 9.5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="17.2" r="0.9" fill="currentColor" />
    </svg>
  )
}

export function DataTable<T>({
  data,
  columns,
  tabs,
  defaultTabId,
  getRowId,
  searchPlaceholder = 'Search...',
  searchFilter,
  onFilterClick,
  onExportClick,
  emptyMessage = 'No results match your search.',
  className = '',
}: DataTableProps<T>) {
  const initialTabId = defaultTabId ?? tabs?.[0]?.id ?? ''
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [activeTab, setActiveTab] = useState(initialTabId)

  const tabFilteredData = useMemo(() => {
    if (!tabs || tabs.length === 0) return data
    const tab = tabs.find((item) => item.id === activeTab) ?? tabs[0]
    if (!tab?.filter) return data
    return data.filter(tab.filter)
  }, [data, tabs, activeTab])

  const globalFilterFn: FilterFn<T> = (row, _columnId, filterValue: string) => {
    const query = filterValue.trim().toLowerCase()
    if (!query) return true
    if (!searchFilter) return true
    return searchFilter(row.original, query)
  }

  const table = useReactTable({
    data: tabFilteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => getRowId(row),
  })

  const showTabs = tabs != null && tabs.length > 0

  return (
    <section
      className={`rounded-3xl border border-black/5 bg-white shadow-[0_4px_24px_rgba(26,32,44,0.06)] ${className}`}
    >
      <div className="flex flex-col gap-4 border-b border-black/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex w-full items-center sm:w-72">
            <span className="sr-only">Search</span>
            <input
              type="text"
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-full border border-black/10 bg-white py-2.5 pl-4 pr-10 text-sm text-relaive-navy placeholder:text-relaive-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
            />
            <span className="pointer-events-none absolute right-3.5 text-relaive-gray">
              <SearchIcon />
            </span>
          </label>

          {showTabs && (
            <div className="inline-flex w-fit flex-wrap items-center gap-1 rounded-full bg-gray-100 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-relaive-navy shadow-sm'
                      : 'text-relaive-gray hover:text-relaive-navy'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <FilterButton onClick={onFilterClick} />
          <button
            type="button"
            title={onExportClick ? 'Export' : 'Coming soon'}
            onClick={onExportClick}
            className="inline-flex items-center gap-2 rounded-lg bg-relaive-primary px-3.5 py-2 text-sm font-medium text-white hover:bg-relaive-primary-hover"
          >
            <DownloadIcon />
            Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-gray-50/60">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  return (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-relaive-gray sm:px-6"
                    >
                      {canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1.5 hover:text-relaive-navy"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <SortIcon direction={header.column.getIsSorted()} />
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-black/5">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/60">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-4 align-top sm:px-6">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-relaive-gray">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
