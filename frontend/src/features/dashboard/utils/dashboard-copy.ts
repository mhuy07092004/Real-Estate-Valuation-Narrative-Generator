import type { DashboardActionIconKey, DashboardStatIconKey } from '../../../services/dashboard'
import type { DashboardRole } from './dashboard-role'

export type DashboardStatCopy = {
  label: string
  hint?: string
  tone: 'blue' | 'teal' | 'orange' | 'sky'
  iconKey: DashboardStatIconKey
}

export type DashboardQuickActionCopy = {
  id: string
  title: string
  subtitle: string
  tone: 'blue' | 'teal' | 'orange'
  iconKey: DashboardActionIconKey
  to: string
}

export type DashboardThisWeekCopy = {
  title: string
  primaryLabel: string
  secondaryLabel: string
  tertiaryLabel?: string
  hideTotal?: boolean
  style?: 'bars' | 'dots'
  viewAllLabel?: string
  viewAllTo?: string
}

export type DashboardPipelineCopy = {
  title: string
  prospecting: string
  appraisalSent: string
  listing: string
  sold: string
  viewAllLabel: string
  viewAllTo: string
  subtitles?: Partial<Record<'prospecting' | 'appraisalSent' | 'listing' | 'sold', string>>
  values?: Partial<Record<'prospecting' | 'appraisalSent' | 'listing' | 'sold', string>>
  trends?: Partial<Record<'prospecting' | 'appraisalSent' | 'listing' | 'sold', string>>
}

export type DashboardRoleCopy = {
  recentReportsTitle: string
  inspectionsTitle?: string
  thisWeek: DashboardThisWeekCopy
  pipeline: DashboardPipelineCopy
  quickActionsTitle: string
  stats: DashboardStatCopy[]
  quickActions: DashboardQuickActionCopy[]
}

export const DASHBOARD_COPY_BY_ROLE: Record<DashboardRole, DashboardRoleCopy> = {
  agent: {
    recentReportsTitle: 'Recent Reports',
    thisWeek: {
      title: 'This Week',
      primaryLabel: 'Reports Generated',
      secondaryLabel: 'Appraisals Sent',
    },
    pipeline: {
      title: 'Appraisal Pipeline',
      prospecting: 'Prospecting',
      appraisalSent: 'Appraisal Sent',
      listing: 'Listing',
      sold: 'Sold',
      viewAllLabel: 'View all clients →',
      viewAllTo: '/dashboard/agent/clients',
    },
    quickActionsTitle: 'Quick Actions',
    stats: [
      { label: 'Generated Reports', tone: 'blue', iconKey: 'document' },
      { label: 'Active Clients', tone: 'teal', iconKey: 'users' },
      { label: 'Avg Appraisal', tone: 'orange', iconKey: 'trend' },
    ],
    quickActions: [
      {
        id: 'client-reports',
        title: 'Client Reports',
        subtitle: 'View all reports',
        tone: 'teal',
        iconKey: 'document',
        to: '/dashboard/agent/report',
      },
      {
        id: 'add-client',
        title: 'Add Client',
        subtitle: 'Manage clients',
        tone: 'blue',
        iconKey: 'userPlus',
        to: '/dashboard/agent/clients',
      },
      {
        id: 'comparables',
        title: 'Comparables',
        subtitle: 'Comparable sales',
        tone: 'teal',
        iconKey: 'nodes',
        to: '/dashboard/agent/generate-report?step=2',
      },
    ],
  },
  valuer: {
    recentReportsTitle: 'Valuation Cases',
    thisWeek: {
      title: 'Monthly Progress',
      primaryLabel: 'Completed',
      secondaryLabel: 'In Progress',
      hideTotal: true,
    },
    pipeline: {
      title: 'Value Distribution',
      prospecting: '< $800K',
      appraisalSent: '$800K–$1.2M',
      listing: '$1.2M–$2M',
      sold: '> $2M',
      viewAllLabel: 'View all cases →',
      viewAllTo: '/dashboard/valuer/valuation-cases',
    },
    quickActionsTitle: 'Quick Actions',
    stats: [
      { label: 'Completed This Month', hint: 'finalised reports', tone: 'teal', iconKey: 'checkCircle' },
      { label: 'Avg Valuation Value', hint: 'across cases', tone: 'sky', iconKey: 'trend' },
    ],
    quickActions: [
      {
        id: 'new-valuation',
        title: 'New Valuation',
        subtitle: 'Start valuation',
        tone: 'teal',
        iconKey: 'sparkle',
        to: '/dashboard/valuer/generate-report',
      },
      {
        id: 'valuation-cases',
        title: 'Valuation Cases',
        subtitle: 'Open case list',
        tone: 'teal',
        iconKey: 'document',
        to: '/dashboard/valuer/valuation-cases',
      },
      {
        id: 'saved-evidence',
        title: 'Saved Evidence',
        subtitle: 'Saved comps',
        tone: 'orange',
        iconKey: 'nodes',
        to: '/dashboard/valuer/saved-evidence',
      },
      {
        id: 'evidence-centre',
        title: 'Evidence Centre',
        subtitle: 'Browse comps',
        tone: 'blue',
        iconKey: 'userPlus',
        to: '/dashboard/valuer/evidence-centre',
      },
    ],
  },
  investor: {
    recentReportsTitle: 'Recent Investment Reports',
    thisWeek: {
      title: 'Portfolio Overview',
      primaryLabel: 'Watchlist Properties',
      secondaryLabel: 'Reports This Month',
      hideTotal: true,
      style: 'dots',
    },
    pipeline: {
      title: 'Market Signals',
      prospecting: 'Vacancy Rate Change',
      appraisalSent: 'Price Momentum',
      listing: 'Rental Yield Trend',
      sold: 'Inventory Movement',
      subtitles: {
        prospecting: 'Richmond VIC',
        appraisalSent: 'Brunswick VIC',
        listing: 'Footscray VIC',
        sold: 'Fitzroy VIC',
      },
      viewAllLabel: 'Market comparison →',
      viewAllTo: '/dashboard/investor/report',
    },
    quickActionsTitle: 'Quick Actions',
    stats: [
      { label: 'Saved Properties', hint: 'in watchlist', tone: 'blue', iconKey: 'heart' },
      { label: 'Generated Reports', hint: 'investment analyses', tone: 'teal', iconKey: 'document' },
      { label: 'Avg Investment Report Value', hint: 'median of reports', tone: 'orange', iconKey: 'dollar' },
    ],
    quickActions: [
      {
        id: 'generate-report',
        title: 'Generate Report',
        subtitle: 'Create new report',
        tone: 'blue',
        iconKey: 'sparkle',
        to: '/dashboard/investor/generate-report',
      },
      {
        id: 'comparables',
        title: 'Comparable Sales',
        subtitle: 'Comparable sales',
        tone: 'teal',
        iconKey: 'nodes',
        to: '/dashboard/investor/generate-report?step=2',
      },
      {
        id: 'saved-properties',
        title: 'Saved Properties',
        subtitle: 'Watchlist',
        tone: 'teal',
        iconKey: 'heart',
        to: '/dashboard/investor/saved-properties',
      },
      {
        id: 'roi-calculator',
        title: 'ROI Calculator',
        subtitle: 'Model returns',
        tone: 'orange',
        iconKey: 'calculator',
        to: '/dashboard/investor/roi-calculation',
      },
    ],
  },
  buyer: {
    recentReportsTitle: 'Recent Reports',
    inspectionsTitle: 'Upcoming Inspections',
    thisWeek: {
      title: 'Search Activity',
      primaryLabel: 'Properties Saved',
      secondaryLabel: 'Reports Generated',
      tertiaryLabel: 'Inspections Booked',
      style: 'dots',
      viewAllLabel: 'View all reports >',
      viewAllTo: '/dashboard/buyer/report',
    },
    pipeline: {
      title: 'Melbourne Market',
      prospecting: 'Median House Price',
      appraisalSent: 'Days on Market',
      listing: 'Rental Yield',
      sold: '',
      viewAllLabel: 'Full market intelligence >',
      viewAllTo: '/dashboard/buyer/search-properties',
      values: {
        prospecting: '$1.28M',
        appraisalSent: '22 days',
        listing: '3.4%',
      },
      trends: {
        prospecting: '+6.2%',
        appraisalSent: '-3 days',
        listing: '+0.2%',
      },
    },
    quickActionsTitle: 'Quick Actions',
    stats: [
      { label: 'Saved Properties', tone: 'teal', iconKey: 'heart' },
      { label: 'Upcoming Inspections', tone: 'blue', iconKey: 'clock' },
      { label: 'Generated Reports', tone: 'orange', iconKey: 'document' },
    ],
    quickActions: [
      {
        id: 'buyer-reports',
        title: 'Buyer Report',
        subtitle: 'View all reports',
        tone: 'teal',
        iconKey: 'document',
        to: '/dashboard/buyer/report',
      },
      {
        id: 'search-properties',
        title: 'Search Properties',
        subtitle: 'Find matches',
        tone: 'blue',
        iconKey: 'userPlus',
        to: '/dashboard/buyer/search-properties',
      },
      {
        id: 'affordability',
        title: 'Affordability',
        subtitle: 'Check budget',
        tone: 'teal',
        iconKey: 'nodes',
        to: '/dashboard/buyer/affortability-calculation',
      },
    ],
  },
}
