import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { FilterButton } from '../../../components/ui/button/filter-button'
import { ClientReportCard } from '../../../features/dashboard/components/client-report-card'
import { useAsyncData } from '../../../hooks/use-async-data'
import {
  getAgentReportListMockData,
  type AgentClientReport,
  type AgentClientReportStatus,
} from '../../../services/agent'

dayjs.extend(relativeTime)

function SortIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 6v12M5 9l3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 18V6M13 15l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function AgentReport() {
  const { data, isLoading } = useAsyncData(getAgentReportListMockData, [])
  const [reports, setReports] = useState<AgentClientReport[]>([])
  const [recentFirst, setRecentFirst] = useState(true)

  useEffect(() => {
    if (data) setReports(data)
  }, [data])

  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => {
      const delta = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      return recentFirst ? delta : -delta
    })
  }, [reports, recentFirst])

  function handleAddressChange(id: string, address: string) {
    setReports((current) =>
      current.map((item) => (item.id === id ? { ...item, address } : item)),
    )
  }

  function handleStatusChange(id: string, status: AgentClientReportStatus) {
    setReports((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1 flex-col gap-6 p-4 sm:gap-7 sm:p-6 lg:p-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
              Client Reports
            </h1>
            <p className="mt-1 text-sm text-relaive-gray sm:text-base">
              {reports.length} {reports.length === 1 ? 'report' : 'reports'}
            </p>
          </div>
          <FilterButton
            label={recentFirst ? 'Recent first' : 'Oldest first'}
            icon={<SortIcon />}
            onClick={() => setRecentFirst((current) => !current)}
          />
        </header>

        {isLoading && reports.length === 0 ? (
          <p className="text-sm text-relaive-gray">Loading reports…</p>
        ) : sortedReports.length === 0 ? (
          <p className="text-sm text-relaive-gray">No client reports yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {sortedReports.map((report) => (
              <li key={report.id}>
                <ClientReportCard
                  report={report}
                  timeAgo={dayjs(report.updatedAt).fromNow()}
                  onAddressChange={handleAddressChange}
                  onStatusChange={handleStatusChange}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
