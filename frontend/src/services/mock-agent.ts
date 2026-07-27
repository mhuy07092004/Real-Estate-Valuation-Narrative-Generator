// Agent-only mock data — CRM client list + client reports.

import dayjs from 'dayjs'
import type { CaseItem } from './mock-dashboard'
import { daysAgo, hoursAgo } from './mock-common'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ClientStatus =
  | 'prospecting'
  | 'active'
  | 'appraisal_sent'
  | 'listing'
  | 'sold'

export type ClientItem = {
  id: string
  name: string
  initials: string
  isStarred: boolean
  address: string | null
  reportCount: number
  status: ClientStatus
  followUpAt: string
}

export type ClientListSummary = {
  totalClients: number
  followUpsDueSoon: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function startOfDayOffset(days: number): string {
  return dayjs().startOf('day').add(days, 'day').toISOString()
}

function isFollowUpDueSoon(followUpAt: string): boolean {
  const followUp = dayjs(followUpAt).startOf('day')
  const today = dayjs().startOf('day')
  const tomorrow = today.add(1, 'day')
  return followUp.isSame(today, 'day') || followUp.isSame(tomorrow, 'day')
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Client reports
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Getters
// ---------------------------------------------------------------------------

export function getClientListMockData(): ClientItem[] {
  return CLIENT_LIST_DATA
}

export function getClientListSummary(): ClientListSummary {
  const clients = CLIENT_LIST_DATA
  return {
    totalClients: clients.length,
    followUpsDueSoon: clients.filter((client) => isFollowUpDueSoon(client.followUpAt)).length,
  }
}

export function getAgentReportListMockData(): CaseItem[] {
  return AGENT_REPORT_LIST
}
