// Shared mock data — role-parametrized dashboard home + case/report lists (all 4 roles).

import type { AiInsight } from '../features/dashboard/components/ai-insights-panel'
import type { QuickActionTone } from '../features/dashboard/components/quick-actions-panel'
import type { RecentReport } from '../features/dashboard/components/recent-reports-panel'
import type { DashboardRole } from '../features/dashboard/utils/dashboard-role'
import { daysAgo, hoursAgo } from './mock-common'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DashboardStatIconKey = 'document' | 'users' | 'trend' | 'clock'
export type DashboardActionIconKey = 'sparkle' | 'document' | 'users'

export type DashboardStat = {
  label: string
  value: string
  trend: string
  tone: 'blue' | 'teal' | 'orange' | 'sky'
  iconKey: DashboardStatIconKey
}

export type DashboardQuickActionData = {
  id: string
  title: string
  subtitle: string
  tone: QuickActionTone
  iconKey: DashboardActionIconKey
}

export type DashboardMockPayload = {
  welcomeSubtitle: string
  stats: DashboardStat[]
  reports: RecentReport[]
  insights: AiInsight[]
  quickActions: DashboardQuickActionData[]
}

export type CaseStatus =
  | 'valuer_review'
  | 'evidence_collection'
  | 'reviewer_approval'
  | 'approved'
  | 'exported'
  | 'draft'
  | 'returned_for_revision'

/**
 * Shape the backend should return for each row of the valuation case /
 * report list.
 *
 * `ownerRole` exists so mock data (and the real backend) can isolate
 * records by the requesting user's *active* role — a single account can
 * hold multiple roles, so without this filter a user could see another
 * role's private reports.
 */
export type CaseItem = {
  id: string
  address: string
  suburb: string
  clientName: string
  status: CaseStatus
  purpose: string
  confidence: number | null
  updatedAt: string
  hasWarning: boolean
  ownerRole: DashboardRole
}

// ---------------------------------------------------------------------------
// Dashboard home data (per role)
// ---------------------------------------------------------------------------

const AGENT_DATA: DashboardMockPayload = {
  welcomeSubtitle: '4 pending client reports • 12 active listings',
  stats: [
    {
      label: 'Generated Reports',
      value: '24',
      trend: '+12 this week',
      tone: 'blue',
      iconKey: 'document',
    },
    {
      label: 'Active Clients',
      value: '18',
      trend: '+3 new',
      tone: 'teal',
      iconKey: 'users',
    },
    {
      label: 'Avg Appraisal',
      value: '$875k',
      trend: '+8% vs. last month',
      tone: 'orange',
      iconKey: 'trend',
    },
    {
      label: 'Pending Reports',
      value: '4',
      trend: '2 due today',
      tone: 'sky',
      iconKey: 'clock',
    },
  ],
  reports: [
    {
      id: '1',
      title: 'Vendor Appraisal - Smith St',
      detail: '$850,000 • Completed & Sent',
      timeAgo: '2 hours ago',
    },
    {
      id: '2',
      title: 'Buyer Advisory - Harbour View',
      detail: '$1,250,000 • In Review',
      timeAgo: '5 hours ago',
    },
    {
      id: '3',
      title: 'Comparable Sales - Oak Ave',
      detail: '$720,000 • Draft Saved',
      timeAgo: 'Yesterday',
    },
    {
      id: '4',
      title: 'Listing Appraisal - Bondi Beach',
      detail: '$1,450,000 • In Review',
      timeAgo: '2 days ago',
    },
  ],
  insights: [
    {
      id: '1',
      title: 'Client Follow-up Due',
      description: 'Sarah Thompson - Vendor appraisal',
      badge: 'Action Required',
      tone: 'teal',
    },
    {
      id: '2',
      title: 'Suburb Price Movement',
      description: 'Bondi median up 3.2% this quarter',
      badge: 'Market Update',
      tone: 'orange',
    },
    {
      id: '3',
      title: 'Report Ready to Send',
      description: 'Harbour View advisory draft complete',
      badge: 'Update',
      tone: 'blue',
    },
  ],
  quickActions: [
    {
      id: '1',
      title: 'Generate Appraisal',
      subtitle: 'Create new report',
      tone: 'blue',
      iconKey: 'sparkle',
    },
    {
      id: '2',
      title: 'Client Reports',
      subtitle: 'View all reports',
      tone: 'teal',
      iconKey: 'document',
    },
    {
      id: '3',
      title: 'CRM Workspace',
      subtitle: 'Manage clients',
      tone: 'orange',
      iconKey: 'users',
    },
  ],
}

const VALUER_DATA: DashboardMockPayload = {
  welcomeSubtitle: '3 open valuation cases • 8 evidence packs ready',
  stats: [
    {
      label: 'Open Cases',
      value: '3',
      trend: '1 due today',
      tone: 'blue',
      iconKey: 'document',
    },
    {
      label: 'Evidence Items',
      value: '42',
      trend: '+6 this week',
      tone: 'teal',
      iconKey: 'users',
    },
    {
      label: 'Avg Valuation',
      value: '$920k',
      trend: '+4% vs. last month',
      tone: 'orange',
      iconKey: 'trend',
    },
    {
      label: 'Pending Reviews',
      value: '2',
      trend: 'Awaiting peer check',
      tone: 'sky',
      iconKey: 'clock',
    },
  ],
  reports: [
    {
      id: '1',
      title: 'Valuation Case - Riverview Rd',
      detail: '$1,050,000 • In Progress',
      timeAgo: '1 hour ago',
    },
    {
      id: '2',
      title: 'Evidence Pack - Westmead',
      detail: '$890,000 • Ready',
      timeAgo: 'Yesterday',
    },
    {
      id: '3',
      title: 'Valuation Case - North Ryde',
      detail: '$1,180,000 • Peer Review',
      timeAgo: '3 hours ago',
    },
    {
      id: '4',
      title: 'Evidence Pack - Strathfield',
      detail: '$760,000 • Draft',
      timeAgo: '2 days ago',
    },
  ],
  insights: [
    {
      id: '1',
      title: 'Peer Review Requested',
      description: 'Riverview Rd draft needs second opinion',
      badge: 'Action Required',
      tone: 'teal',
    },
    {
      id: '2',
      title: 'Comparable Alert',
      description: 'New sale within 400m of open case',
      badge: 'Market Update',
      tone: 'orange',
    },
  ],
  quickActions: [
    {
      id: '1',
      title: 'Generate Appraisal',
      subtitle: 'Start valuation',
      tone: 'blue',
      iconKey: 'sparkle',
    },
    {
      id: '2',
      title: 'Evidence Center',
      subtitle: 'Browse comps',
      tone: 'teal',
      iconKey: 'document',
    },
  ],
}

const INVESTOR_DATA: DashboardMockPayload = {
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
  ],
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
  ],
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
  ],
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
  ],
}

const BUYER_DATA: DashboardMockPayload = {
  welcomeSubtitle: '6 shortlisted homes • 2 affordability checks pending',
  stats: [
    {
      label: 'Shortlist',
      value: '6',
      trend: '+1 this week',
      tone: 'blue',
      iconKey: 'document',
    },
    {
      label: 'Budget Cap',
      value: '$1.1m',
      trend: 'Within range',
      tone: 'teal',
      iconKey: 'trend',
    },
    {
      label: 'Suburb Matches',
      value: '4',
      trend: 'Based on prefs',
      tone: 'orange',
      iconKey: 'users',
    },
    {
      label: 'Pending Checks',
      value: '2',
      trend: 'Affordability',
      tone: 'sky',
      iconKey: 'clock',
    },
  ],
  reports: [
    {
      id: '1',
      title: 'Buyer Report - Marrickville',
      detail: '$980,000 • In Review',
      timeAgo: '4 hours ago',
    },
    {
      id: '2',
      title: 'Affordability Check - Dulwich Hill',
      detail: '$920,000 • Saved',
      timeAgo: 'Yesterday',
    },
    {
      id: '3',
      title: 'Buyer Report - Newtown Terrace',
      detail: '$1,050,000 • Draft',
      timeAgo: '6 hours ago',
    },
    {
      id: '4',
      title: 'Suburb Match - Leichhardt',
      detail: '$875,000 • Completed',
      timeAgo: '3 days ago',
    },
  ],
  insights: [
    {
      id: '1',
      title: 'Open Home Reminder',
      description: 'Marrickville inspection this Saturday',
      badge: 'Action Required',
      tone: 'teal',
    },
    {
      id: '2',
      title: 'Suburb Explorer Tip',
      description: 'Similar stock listed in Newtown',
      badge: 'Update',
      tone: 'blue',
    },
  ],
  quickActions: [
    {
      id: '1',
      title: 'Search Properties',
      subtitle: 'Find matches',
      tone: 'blue',
      iconKey: 'sparkle',
    },
    {
      id: '2',
      title: 'Buyer Report',
      subtitle: 'Generate advisory',
      tone: 'teal',
      iconKey: 'document',
    },
  ],
}

const DATA_BY_ROLE: Record<DashboardRole, DashboardMockPayload> = {
  agent: AGENT_DATA,
  valuer: VALUER_DATA,
  investor: INVESTOR_DATA,
  buyer: BUYER_DATA,
}

export function getDashboardMockData(role: DashboardRole): DashboardMockPayload {
  return DATA_BY_ROLE[role]
}

// ---------------------------------------------------------------------------
// Case / report list (per role via ownerRole filter)
// ---------------------------------------------------------------------------

const CASE_LIST_DATA: CaseItem[] = [
  // --- valuer: valuation cases / reports ---
  {
    id: 'VC-2047',
    address: '12 Church St',
    suburb: 'Richmond VIC 3121',
    clientName: 'ANZ Bank',
    status: 'valuer_review',
    purpose: 'Market Valuation',
    confidence: 91,
    updatedAt: hoursAgo(1),
    hasWarning: false,
    ownerRole: 'valuer',
  },
  {
    id: 'VC-2046',
    address: '45 Park Ave',
    suburb: 'Fitzroy VIC 3065',
    clientName: 'Commonwealth Bank',
    status: 'evidence_collection',
    purpose: 'Lending Support',
    confidence: 74,
    updatedAt: hoursAgo(3),
    hasWarning: true,
    ownerRole: 'valuer',
  },
  {
    id: 'VC-2045',
    address: '7 Collins St',
    suburb: 'Melbourne VIC 3000',
    clientName: 'Westpac',
    status: 'reviewer_approval',
    purpose: 'Internal Assessment',
    confidence: 89,
    updatedAt: daysAgo(1),
    hasWarning: false,
    ownerRole: 'valuer',
  },
  {
    id: 'VC-2044',
    address: '7 Harbour Dr',
    suburb: 'South Yarra VIC 3141',
    clientName: 'Private Client',
    status: 'approved',
    purpose: 'Retrospective Review',
    confidence: 93,
    updatedAt: daysAgo(2),
    hasWarning: false,
    ownerRole: 'valuer',
  },
  {
    id: 'VC-2043',
    address: '33 Oak St',
    suburb: 'Prahran VIC 3181',
    clientName: 'Private Client',
    status: 'exported',
    purpose: 'Buyer Advisory',
    confidence: 88,
    updatedAt: daysAgo(3),
    hasWarning: false,
    ownerRole: 'valuer',
  },
  {
    id: 'VC-2042',
    address: '5 Marina Rd',
    suburb: 'Williamstown VIC 3016',
    clientName: 'ANZ Bank',
    status: 'draft',
    purpose: 'Market Valuation',
    confidence: null,
    updatedAt: daysAgo(4),
    hasWarning: false,
    ownerRole: 'valuer',
  },
  {
    id: 'VC-2041',
    address: '88 High St',
    suburb: 'Northcote VIC 3070',
    clientName: 'NAB',
    status: 'returned_for_revision',
    purpose: 'Lending Support',
    confidence: 68,
    updatedAt: daysAgo(5),
    hasWarning: true,
    ownerRole: 'valuer',
  },

  // --- agent: client reports ---
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
    ownerRole: 'agent',
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
    ownerRole: 'agent',
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
    ownerRole: 'agent',
  },

  // --- investor: portfolio / investment reports ---
  {
    id: 'IN-4102',
    address: '9 Riverside Dr',
    suburb: 'Southbank VIC 3006',
    clientName: 'Self (Portfolio)',
    status: 'exported',
    purpose: 'Investment Analysis',
    confidence: 90,
    updatedAt: hoursAgo(5),
    hasWarning: false,
    ownerRole: 'investor',
  },
  {
    id: 'IN-4101',
    address: '61 Beach Rd',
    suburb: 'St Kilda VIC 3182',
    clientName: 'Self (Portfolio)',
    status: 'draft',
    purpose: 'Yield Assessment',
    confidence: null,
    updatedAt: daysAgo(2),
    hasWarning: false,
    ownerRole: 'investor',
  },
  {
    id: 'IN-4100',
    address: '14 Bay St',
    suburb: 'Port Melbourne VIC 3207',
    clientName: 'Self (Portfolio)',
    status: 'approved',
    purpose: 'Capital Growth Review',
    confidence: 84,
    updatedAt: daysAgo(4),
    hasWarning: false,
    ownerRole: 'investor',
  },

  // --- buyer: pre-purchase reports ---
  {
    id: 'BY-5210',
    address: '3 Grove St',
    suburb: 'Camberwell VIC 3124',
    clientName: 'Self',
    status: 'exported',
    purpose: 'Pre-Purchase Report',
    confidence: 88,
    updatedAt: hoursAgo(6),
    hasWarning: false,
    ownerRole: 'buyer',
  },
  {
    id: 'BY-5209',
    address: '27 Toorak Rd',
    suburb: 'Toorak VIC 3142',
    clientName: 'Self',
    status: 'draft',
    purpose: 'Due Diligence Review',
    confidence: null,
    updatedAt: daysAgo(2),
    hasWarning: false,
    ownerRole: 'buyer',
  },
  {
    id: 'BY-5208',
    address: '44 High St',
    suburb: 'Kew VIC 3101',
    clientName: 'Self',
    status: 'approved',
    purpose: 'Buyer Advisory Report',
    confidence: 91,
    updatedAt: daysAgo(5),
    hasWarning: false,
    ownerRole: 'buyer',
  },
]

/**
 * Returns the case/report rows owned by `ownerRole` only. `ownerRole` is
 * required so every call site must state which role's data it wants —
 * mirrors the scoped query the real backend must run per authenticated
 * user + active role.
 */
export function getCaseListMockData(ownerRole: DashboardRole): CaseItem[] {
  return CASE_LIST_DATA.filter((item) => item.ownerRole === ownerRole)
}
