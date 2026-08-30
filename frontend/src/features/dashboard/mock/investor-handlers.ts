import { http, HttpResponse } from 'msw'
import type {
  InvestorReportListItem,
  InvestorReportSummary,
  InvestorSavedProperty,
  RoiCalculationMock,
} from '../../../services/investor'
import type { InboxNotification } from '../../../services/common'
import { simulateLatency } from './mock-utils'

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

function daysAgo(days: number): string {
  return hoursAgo(days * 24)
}

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

const INVESTOR_REPORT_LIST: InvestorReportListItem[] = [
  {
    id: 'IN-4108',
    address: '9 Riverside Dr',
    suburb: 'Southbank VIC 3006',
    clientName: 'Melbourne Core',
    status: 'shared',
    estimatedValue: 1_120_000,
    beds: 2,
    baths: 2,
    areaSqm: 92,
    updatedAt: hoursAgo(5),
  },
  {
    id: 'IN-4107',
    address: '22 King St',
    suburb: 'Newtown NSW 2042',
    clientName: 'Sydney Satellite',
    status: 'generated',
    estimatedValue: 1_050_000,
    beds: 2,
    baths: 1,
    areaSqm: 85,
    updatedAt: hoursAgo(8),
  },
  {
    id: 'IN-4106',
    address: '61 Beach Rd',
    suburb: 'St Kilda VIC 3182',
    clientName: 'Melbourne Core',
    status: 'generated',
    estimatedValue: 890_000,
    beds: 2,
    baths: 1,
    areaSqm: 78,
    updatedAt: daysAgo(1),
  },
  {
    id: 'IN-4105',
    address: '8 Grove Ave',
    suburb: 'Ashfield NSW 2131',
    clientName: 'Sydney Satellite',
    status: 'generated',
    estimatedValue: 695_000,
    beds: 3,
    baths: 1,
    areaSqm: 142,
    updatedAt: daysAgo(2),
  },
  {
    id: 'IN-4104',
    address: '14 Bay St',
    suburb: 'Port Melbourne VIC 3207',
    clientName: 'Growth Portfolio',
    status: 'generated',
    estimatedValue: 1_450_000,
    beds: 3,
    baths: 2,
    areaSqm: 186,
    updatedAt: daysAgo(4),
  },
  {
    id: 'IN-4103',
    address: '101 Collins St',
    suburb: 'Melbourne VIC 3000',
    clientName: 'Melbourne Core',
    status: 'generated',
    estimatedValue: 720_000,
    beds: 1,
    baths: 1,
    areaSqm: 58,
    updatedAt: daysAgo(5),
  },
  {
    id: 'IN-4102',
    address: '44 Punt Rd',
    suburb: 'Richmond VIC 3121',
    clientName: 'Growth Portfolio',
    status: 'generated',
    estimatedValue: 1_380_000,
    beds: 3,
    baths: 2,
    areaSqm: 210,
    updatedAt: daysAgo(7),
  },
  {
    id: 'IN-4101',
    address: '7 Toorak Rd',
    suburb: 'South Yarra VIC 3141',
    clientName: 'Growth Portfolio',
    status: 'shared',
    estimatedValue: 2_450_000,
    beds: 4,
    baths: 3,
    areaSqm: 510,
    updatedAt: daysAgo(14),
  },
]

const INVESTOR_NOTIFICATIONS: InboxNotification[] = [
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
    description: 'Draft ROI scenario for Kew VIC is waiting for your final confirmation.',
    priority: 'low',
    timestamp: '2 days ago',
    isRead: true,
    icon: 'approval',
  },
]

const INVESTOR_SAVED_PROPERTIES: InvestorSavedProperty[] = [
  {
    id: 'investor-saved-collins',
    address: '101 Collins Street, Melbourne VIC 3000',
    savedAgo: '4 days ago',
    propertyType: 'Apartment',
    beds: 2,
    baths: 2,
    areaSqm: 92,
  },
  {
    id: 'investor-saved-punt',
    address: '44 Punt Road, Richmond VIC 3121',
    savedAgo: '1 week ago',
    propertyType: 'Townhouse',
    beds: 3,
    baths: 2,
    areaSqm: 186,
  },
  {
    id: 'investor-saved-toorak',
    address: '7 Toorak Road, South Yarra VIC 3141',
    savedAgo: '12 days ago',
    propertyType: 'House',
    beds: 4,
    baths: 3,
    areaSqm: 510,
  },
]

export const investorHandlers = [
  http.get('/api/investor/properties/saved', async () => {
    await simulateLatency()
    return HttpResponse.json(INVESTOR_SAVED_PROPERTIES)
  }),

  http.get('/api/investor/roi-calculation', async () => {
    await simulateLatency()
    return HttpResponse.json(ROI_CALCULATION_DATA)
  }),

  http.get('/api/investor/reports', async () => {
    await simulateLatency()
    return HttpResponse.json(INVESTOR_REPORT_LIST)
  }),

  http.get('/api/investor/reports/summary', async () => {
    await simulateLatency()
    const summary: InvestorReportSummary = {
      totalReports: INVESTOR_REPORT_LIST.length,
      draftCount: INVESTOR_REPORT_LIST.filter((item) => item.status === 'generated').length,
      sharedCount: INVESTOR_REPORT_LIST.filter((item) => item.status === 'shared').length,
    }
    return HttpResponse.json(summary)
  }),

  http.get('/api/investor/notifications', async () => {
    await simulateLatency()
    return HttpResponse.json(INVESTOR_NOTIFICATIONS)
  }),

  http.get('/api/investor/notifications/unread-count', async () => {
    await simulateLatency()
    return HttpResponse.json(INVESTOR_NOTIFICATIONS.filter((n) => !n.isRead).length)
  }),
]
