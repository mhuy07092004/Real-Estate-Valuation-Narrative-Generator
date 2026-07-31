import dayjs from 'dayjs'
import { http, HttpResponse } from 'msw'
import type { ClientItem, ClientListSummary } from '../../../services/agent'
import type { CaseItem } from '../../../services/dashboard'
import type { InboxNotification } from '../../../services/common'
import { simulateLatency } from './mock-utils'

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

function daysAgo(days: number): string {
  return hoursAgo(days * 24)
}

function startOfDayOffset(days: number): string {
  return dayjs().startOf('day').add(days, 'day').toISOString()
}

function isFollowUpDueSoon(followUpAt: string): boolean {
  const followUp = dayjs(followUpAt).startOf('day')
  const today = dayjs().startOf('day')
  const tomorrow = today.add(1, 'day')
  return followUp.isSame(today, 'day') || followUp.isSame(tomorrow, 'day')
}

const CLIENT_LIST_DATA: ClientItem[] = [
  {
    id: 'CL-1001',
    name: 'Sarah Mitchell',
    initials: 'SM',
    isStarred: false,
    address: '45 Park Ave, Richmond VIC',
    reportCount: 1,
    status: 'appraisal_sent',
    followUpAt: startOfDayOffset(0),
  },
  {
    id: 'CL-1002',
    name: 'David Park',
    initials: 'DP',
    isStarred: false,
    address: '12 Church St, Fitzroy VIC',
    reportCount: 2,
    status: 'active',
    followUpAt: startOfDayOffset(1),
  },
  {
    id: 'CL-1003',
    name: 'Emma Chen',
    initials: 'EC',
    isStarred: false,
    address: null,
    reportCount: 0,
    status: 'prospecting',
    followUpAt: startOfDayOffset(2),
  },
  {
    id: 'CL-1004',
    name: 'James & Kathy Wu',
    initials: 'JW',
    isStarred: true,
    address: '88 Brunswick St, Fitzroy VIC',
    reportCount: 3,
    status: 'listing',
    followUpAt: startOfDayOffset(4),
  },
  {
    id: 'CL-1005',
    name: 'Olivia Brown',
    initials: 'OB',
    isStarred: false,
    address: '22 High St, Prahran VIC',
    reportCount: 1,
    status: 'sold',
    followUpAt: startOfDayOffset(6),
  },
  {
    id: 'CL-1006',
    name: 'Tom Nguyen',
    initials: 'TN',
    isStarred: false,
    address: '7 Bridge Rd, Richmond VIC',
    reportCount: 1,
    status: 'active',
    followUpAt: startOfDayOffset(3),
  },
  {
    id: 'CL-1007',
    name: 'Priya Sharma',
    initials: 'PS',
    isStarred: false,
    address: null,
    reportCount: 0,
    status: 'prospecting',
    followUpAt: startOfDayOffset(5),
  },
]

const AGENT_REPORT_LIST: CaseItem[] = [
  {
    id: 'AG-3021',
    address: '22 Bridge Rd',
    suburb: 'Richmond VIC 3121',
    clientName: 'Sarah Mitchell',
    status: 'exported',
    purpose: 'Pre-Listing Appraisal',
    confidence: 92,
    updatedAt: hoursAgo(2),
    hasWarning: false,
  },
  {
    id: 'AG-3020',
    address: '5 Oxford St',
    suburb: 'Fitzroy VIC 3065',
    clientName: 'James Nguyen',
    status: 'draft',
    purpose: 'Sale Appraisal',
    confidence: null,
    updatedAt: daysAgo(1),
    hasWarning: false,
  },
  {
    id: 'AG-3019',
    address: '18 Church St',
    suburb: 'Hawthorn VIC 3122',
    clientName: 'Chen Family Trust',
    status: 'approved',
    purpose: 'Rental Appraisal',
    confidence: 87,
    updatedAt: daysAgo(3),
    hasWarning: false,
  },
]

const AGENT_NOTIFICATIONS: InboxNotification[] = [
  {
    id: 'agent-notif-1',
    title: 'AI Valuation Update',
    description:
      'Your property at 123 Smith St has a new AI estimate: $832,000 (+$7,000 from last week)',
    priority: 'high',
    timestamp: '2 mins ago',
    isRead: false,
    icon: 'ai',
  },
  {
    id: 'agent-notif-2',
    title: 'Market Alert – Richmond VIC',
    description:
      'Median house price rose 1.2% this week, now at $1.29M. Auction clearance rate: 82%',
    priority: 'high',
    timestamp: '1 hour ago',
    isRead: false,
    icon: 'market',
  },
  {
    id: 'agent-notif-3',
    title: 'Approval Required',
    description:
      "Sarah Chen has submitted '45 Park Ave Appraisal' for your review and approval",
    priority: 'high',
    timestamp: '2 hours ago',
    isRead: false,
    icon: 'approval',
  },
  {
    id: 'agent-notif-4',
    title: 'New Comparable Sale',
    description:
      '12 Church St, Richmond sold for $1.21M – 0.4km from your saved property 123 Smith St',
    priority: 'medium',
    timestamp: '3 hours ago',
    isRead: false,
    icon: 'sale',
  },
  {
    id: 'agent-notif-5',
    title: 'Forecast Update – Surry Hills',
    description:
      'AI growth forecast for Surry Hills upgraded from Moderate to Strong (now 7.2% p.a.)',
    priority: 'medium',
    timestamp: '1 day ago',
    isRead: true,
    icon: 'forecast',
  },
  {
    id: 'agent-notif-6',
    title: 'AI Report Ready',
    description:
      'Your AI Copilot has finished generating the market comparison report for Kew VIC',
    priority: 'low',
    timestamp: '2 days ago',
    isRead: true,
    icon: 'report',
  },
]

export const agentHandlers = [
  http.get('/api/agent/clients', async () => {
    await simulateLatency()
    return HttpResponse.json(CLIENT_LIST_DATA)
  }),

  http.get('/api/agent/clients/summary', async () => {
    await simulateLatency()
    const summary: ClientListSummary = {
      totalClients: CLIENT_LIST_DATA.length,
      followUpsDueSoon: CLIENT_LIST_DATA.filter((client) =>
        isFollowUpDueSoon(client.followUpAt),
      ).length,
    }
    return HttpResponse.json(summary)
  }),

  http.get('/api/agent/reports', async () => {
    await simulateLatency()
    return HttpResponse.json(AGENT_REPORT_LIST)
  }),

  http.get('/api/agent/notifications', async () => {
    await simulateLatency()
    return HttpResponse.json(AGENT_NOTIFICATIONS)
  }),

  http.get('/api/agent/notifications/unread-count', async () => {
    await simulateLatency()
    return HttpResponse.json(AGENT_NOTIFICATIONS.filter((n) => !n.isRead).length)
  }),
]
