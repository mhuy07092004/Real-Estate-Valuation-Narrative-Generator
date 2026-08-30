import type { ReactNode } from 'react'
import type { NotificationIconKind } from '../../../../../services/common'

export function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0">
      <path d="M3.5 8.25 6.5 11.25 12.5 4.75" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function XIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function BellIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M5 9a5 5 0 0 1 10 0c0 3.3 1.2 4.6 1.2 4.6H3.8S5 12.3 5 9z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.3 15.6a1.7 1.7 0 0 0 3.4 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function AiIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path d="M10 3.5 11.1 7.4 15 8.5 11.1 9.6 10 13.5 8.9 9.6 5 8.5 8.9 7.4 10 3.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M15.5 12.5 16 14.2 17.7 14.7 16 15.2 15.5 16.9 15 15.2 13.3 14.7 15 14.2 15.5 12.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

export function MarketIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path d="M3.5 13.5 7.5 9.5 10.5 12.5 16.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 6.5h3.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ApprovalIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <circle cx="7.5" cy="7" r="2.25" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="13" cy="7.5" r="1.75" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 15.5c.6-2.2 2.2-3.5 4-3.5s3.4 1.3 4 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12 12.2c1.1-.5 2.3-.3 3.2.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function SaleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path d="M4 8.5 10 4.5 16 8.5V15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8 16V11h4v5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

export function ForecastIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path d="M4 14.5h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6 12V9.5M10 12V7M14 12V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function ReportIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path d="M6 3.5h6l3 3V16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M12 3.5V7h3.5M7.5 10.5h5M7.5 13.5h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ClockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0">
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 4.75V8l2.25 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export const ICON_MAP: Record<NotificationIconKind, ReactNode> = {
  ai: <AiIcon />,
  market: <MarketIcon />,
  approval: <ApprovalIcon />,
  sale: <SaleIcon />,
  forecast: <ForecastIcon />,
  report: <ReportIcon />,
}

// Filter chips map 1:1 onto the real `NotificationIconKind` values from
// services/common.ts — no invented categories (e.g. the prototype's
// "Watchlist"/"Team" chips) that the actual data model doesn't support.
export const FILTER_ITEMS: { id: NotificationIconKind | 'all'; label: string; icon: ReactNode }[] = [
  { id: 'all', label: 'All', icon: <BellIcon /> },
  { id: 'ai', label: 'AI', icon: <AiIcon /> },
  { id: 'market', label: 'Market', icon: <MarketIcon /> },
  { id: 'approval', label: 'Approvals', icon: <ApprovalIcon /> },
  { id: 'sale', label: 'Sales', icon: <SaleIcon /> },
  { id: 'forecast', label: 'Forecasts', icon: <ForecastIcon /> },
  { id: 'report', label: 'Reports', icon: <ReportIcon /> },
]
