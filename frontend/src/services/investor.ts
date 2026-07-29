// Investor types + HTTP service — ROI calculator, reports, notifications.

import { fetchJson } from './api-client'
import type { DashboardMockPayload } from './dashboard'
import type { InboxNotification } from './common'

export type RoiSummaryTone = 'green' | 'red' | 'navy' | 'net'

export type RoiSummaryRow = {
  label: string
  amount: number
  tone: RoiSummaryTone
}

export type RoiStatMetric = {
  label: string
  value: string
  trend: string
  tone: 'blue' | 'teal' | 'orange' | 'sky'
}

export type RoiReturnTone = 'green' | 'red' | 'navy'

export type RoiReturnRow = {
  label: string
  display: string
  tone: RoiReturnTone
}

export type RoiCalculationMock = {
  annualSummary: RoiSummaryRow[]
  metrics: RoiStatMetric[]
  investmentReturns: RoiReturnRow[]
}

export type InvestorReportStatus = 'draft' | 'in_review' | 'shared' | 'archived'

export type InvestorReportItem = {
  id: string
  propertyName: string
  suburb: string
  portfolio: string
  reportType: string
  status: InvestorReportStatus
  purchaseValue: number
  grossYield: number | null
  updatedAt: string
}

export type InvestorReportSummary = {
  totalReports: number
  draftCount: number
  sharedCount: number
}

export function getRoiCalculationMockData(): Promise<RoiCalculationMock> {
  return fetchJson('/api/investor/roi-calculation')
}

export function getInvestorDashboardMockData(): Promise<DashboardMockPayload> {
  return fetchJson('/api/dashboard/investor')
}

export function getInvestorReportListMockData(): Promise<InvestorReportItem[]> {
  return fetchJson('/api/investor/reports')
}

export function getInvestorReportSummary(): Promise<InvestorReportSummary> {
  return fetchJson('/api/investor/reports/summary')
}

export function getInvestorNotifications(): Promise<InboxNotification[]> {
  return fetchJson('/api/investor/notifications')
}

export function getInvestorUnreadNotificationCount(): Promise<number> {
  return fetchJson('/api/investor/notifications/unread-count')
}
