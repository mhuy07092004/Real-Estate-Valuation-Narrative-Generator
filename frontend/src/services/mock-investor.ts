// Investor-only mock data — dashboard home, reports, ROI calculator.

import type { AiInsight } from '../features/dashboard/components/ai-insights-panel'
import type { QuickActionTone } from '../features/dashboard/components/quick-actions-panel'
import type { RecentReport } from '../features/dashboard/components/recent-reports-panel'
import { simulateRequest } from './api-client'
import type {
  DashboardActionIconKey,
  DashboardMockPayload,
  DashboardStat,
} from './mock-dashboard'
import { daysAgo, hoursAgo, type InboxNotification } from './mock-common'

// ---------------------------------------------------------------------------
// ROI calculator types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Investor report list types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// ROI calculator data
// ---------------------------------------------------------------------------

const ROI_CALCULATION_DATA: RoiCalculationMock = {
  annualSummary: [
    { label: 'Annual Rental Income', amount: 50000, tone: 'green' },
    { label: 'Annual Mortgage Repayments', amount: -2000, tone: 'navy' },
    { label: 'Annual Operating Expenses', amount: -45000, tone: 'navy' },
    { label: 'Management Fees', amount: -5000, tone: 'navy' },
    { label: 'Net Annual Cash-Flow', amount: -52000, tone: 'net' },
  ],
  metrics: [
    {
      label: 'Loan Amount',
      value: '$300,000',
      trend: 'monthly payment: $25,000',
      tone: 'blue',
    },
    {
      label: 'Break-even Rent',
      value: '$1,165',
      trend: 'current: $650/wk',
      tone: 'teal',
    },
  ],
  investmentReturns: [
    { label: 'Gross Yield', display: '4.0%', tone: 'green' },
    { label: 'Net Yield', display: '2.6%', tone: 'navy' },
    { label: 'Monthly Cash-Flow', display: '$2,341/mth', tone: 'red' },
    { label: 'Cash-on-Cash Returns', display: '-16.5%', tone: 'red' },
  ],
}

// ---------------------------------------------------------------------------
// Dashboard home data
// ---------------------------------------------------------------------------

const INVESTOR_DASHBOARD_DATA: DashboardMockPayload = {
  welcomeSubtitle: '2 portfolios tracked • 5 ROI scenarios saved',
  stats: [
    {
      label: 'Tracked Assets',
      value: '11',
      trend: '+2 this month',
      tone: 'blue',
      iconKey: 'document',
    },
    {
      label: 'Avg Yield',
      value: '4.8%',
      trend: '+0.3% vs. last qtr',
      tone: 'teal',
      iconKey: 'trend',
    },
    {
      label: 'Open Scenarios',
      value: '5',
      trend: '2 need refresh',
      tone: 'orange',
      iconKey: 'users',
    },
    {
      label: 'Watchlist',
      value: '9',
      trend: '3 price alerts',
      tone: 'sky',
      iconKey: 'clock',
    },
  ] satisfies DashboardStat[],
  reports: [
    {
      id: '1',
      title: 'Investor Report - Parramatta Unit',
      detail: '$620,000 • Draft',
      timeAgo: '3 hours ago',
    },
    {
      id: '2',
      title: 'Market Comparison - Inner West',
      detail: '$540,000 • Completed',
      timeAgo: 'Yesterday',
    },
    {
      id: '3',
      title: 'ROI Scenario - Ashfield',
      detail: '$715,000 • In Review',
      timeAgo: '5 hours ago',
    },
    {
      id: '4',
      title: 'Portfolio Report - Canterbury',
      detail: '$880,000 • Sent',
      timeAgo: '2 days ago',
    },
  ] satisfies RecentReport[],
  insights: [
    {
      id: '1',
      title: 'Yield Opportunity',
      description: 'Ashfield median rent up 2.4%',
      badge: 'Market Update',
      tone: 'orange',
    },
    {
      id: '2',
      title: 'Scenario Expiring',
      description: 'Parramatta cash-flow model is 30 days old',
      badge: 'Update',
      tone: 'blue',
    },
  ] satisfies AiInsight[],
  quickActions: [
    {
      id: '1',
      title: 'Generate Report',
      subtitle: 'Investor pack',
      tone: 'blue',
      iconKey: 'sparkle',
    },
    {
      id: '2',
      title: 'ROI Calculator',
      subtitle: 'Model returns',
      tone: 'teal',
      iconKey: 'document',
    },
  ] satisfies {
    id: string
    title: string
    subtitle: string
    tone: QuickActionTone
    iconKey: DashboardActionIconKey
  }[],
}

// ---------------------------------------------------------------------------
// Investor report list data
// ---------------------------------------------------------------------------

const INVESTOR_REPORT_LIST: InvestorReportItem[] = [
  {
    id: 'IN-4102',
    propertyName: '9 Riverside Dr',
    suburb: 'Southbank VIC 3006',
    portfolio: 'Melbourne Core',
    reportType: 'Investment Analysis',
    status: 'shared',
    purchaseValue: 620_000,
    grossYield: 4.8,
    updatedAt: hoursAgo(5),
  },
  {
    id: 'IN-4101',
    propertyName: '61 Beach Rd',
    suburb: 'St Kilda VIC 3182',
    portfolio: 'Melbourne Core',
    reportType: 'Yield Assessment',
    status: 'draft',
    purchaseValue: 540_000,
    grossYield: null,
    updatedAt: daysAgo(2),
  },
  {
    id: 'IN-4100',
    propertyName: '14 Bay St',
    suburb: 'Port Melbourne VIC 3207',
    portfolio: 'Growth Portfolio',
    reportType: 'Capital Growth Review',
    status: 'archived',
    purchaseValue: 880_000,
    grossYield: 3.9,
    updatedAt: daysAgo(4),
  },
  {
    id: 'IN-4099',
    propertyName: '22 King St',
    suburb: 'Newtown NSW 2042',
    portfolio: 'Sydney Satellite',
    reportType: 'Cash-Flow Scenario',
    status: 'in_review',
    purchaseValue: 715_000,
    grossYield: 5.1,
    updatedAt: hoursAgo(8),
  },
  {
    id: 'IN-4098',
    propertyName: '8 Grove Ave',
    suburb: 'Ashfield NSW 2131',
    portfolio: 'Sydney Satellite',
    reportType: 'Market Comparison',
    status: 'draft',
    purchaseValue: 695_000,
    grossYield: null,
    updatedAt: daysAgo(1),
  },
]

// ---------------------------------------------------------------------------
// Getters
// ---------------------------------------------------------------------------

export function getRoiCalculationMockData(): Promise<RoiCalculationMock> {
  return simulateRequest(ROI_CALCULATION_DATA)
}

export function getInvestorDashboardMockData(): Promise<DashboardMockPayload> {
  return simulateRequest(INVESTOR_DASHBOARD_DATA)
}

export function getInvestorReportListMockData(): Promise<InvestorReportItem[]> {
  return simulateRequest(INVESTOR_REPORT_LIST)
}

export function getInvestorReportSummary(): Promise<InvestorReportSummary> {
  const draftCount = INVESTOR_REPORT_LIST.filter((item) => item.status === 'draft').length
  const sharedCount = INVESTOR_REPORT_LIST.filter((item) => item.status === 'shared').length

  return simulateRequest({
    totalReports: INVESTOR_REPORT_LIST.length,
    draftCount,
    sharedCount,
  })
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const MOCK_INVESTOR_NOTIFICATIONS: InboxNotification[] = [
  {
    id: 'investor-notif-1',
    title: 'ROI Alert – 45 Park Ave',
    description:
      'Projected net yield improved to 4.8% after updated rent and expense assumptions.',
    priority: 'high',
    timestamp: '20 mins ago',
    isRead: false,
    icon: 'ai',
  },
  {
    id: 'investor-notif-2',
    title: 'Market Alert – Surry Hills',
    description:
      'Unit median rose 0.9% this month. Vacancy rate held at 1.8% across the suburb.',
    priority: 'high',
    timestamp: '2 hours ago',
    isRead: false,
    icon: 'market',
  },
  {
    id: 'investor-notif-3',
    title: 'Forecast Upgrade – Newtown',
    description:
      'AI growth forecast for Newtown upgraded from Moderate to Strong (7.1% p.a.).',
    priority: 'medium',
    timestamp: '4 hours ago',
    isRead: false,
    icon: 'forecast',
  },
  {
    id: 'investor-notif-4',
    title: 'Comparable Investment Sale',
    description:
      '22 King St sold for $1.05M at an implied 4.2% yield – close to your watchlist asset.',
    priority: 'medium',
    timestamp: '6 hours ago',
    isRead: false,
    icon: 'sale',
  },
  {
    id: 'investor-notif-5',
    title: 'Investor Report Shared',
    description:
      "Your 'Richmond Portfolio Review' report was marked shared with your adviser.",
    priority: 'low',
    timestamp: '1 day ago',
    isRead: true,
    icon: 'report',
  },
  {
    id: 'investor-notif-6',
    title: 'Approval Reminder',
    description:
      'Draft ROI scenario for Kew VIC is waiting for your final confirmation.',
    priority: 'low',
    timestamp: '2 days ago',
    isRead: true,
    icon: 'approval',
  },
]

export function getInvestorNotifications(): Promise<InboxNotification[]> {
  return simulateRequest(MOCK_INVESTOR_NOTIFICATIONS)
}

export function getInvestorUnreadNotificationCount(): Promise<number> {
  return simulateRequest(MOCK_INVESTOR_NOTIFICATIONS.filter((n) => !n.isRead).length)
}
