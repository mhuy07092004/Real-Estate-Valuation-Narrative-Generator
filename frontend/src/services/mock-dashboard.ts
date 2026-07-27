// Shared mock data — role-parametrized dashboard home (all 4 roles).
// Per-role report/case lists live in mock-{agent,valuer,buyer,investor}.ts.

import type { AiInsight } from '../features/dashboard/components/ai-insights-panel'
import type { QuickActionTone } from '../features/dashboard/components/quick-actions-panel'
import type { RecentReport } from '../features/dashboard/components/recent-reports-panel'
import type { DashboardRole } from '../features/dashboard/utils/dashboard-role'
import { getInvestorDashboardMockData } from './mock-investor'

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
 * report list. Role-scoped lists live in mock-{role}.ts — this type is
 * the shared contract for CaseTable.
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
  investor: getInvestorDashboardMockData(),
  buyer: BUYER_DATA,
}

export function getDashboardMockData(role: DashboardRole): DashboardMockPayload {
  return DATA_BY_ROLE[role]
}
