import type { ReactNode } from 'react'
import { AiInsightsPanel, type AiInsight } from '../components/dashboard/ai-insights-panel'
import { QuickActionsPanel, type QuickAction } from '../components/dashboard/quick-actions-panel'
import {
  RecentReportsPanel,
  type RecentReport,
} from '../components/dashboard/recent-reports-panel'
import { DashboardNavbar } from '../components/ui/navbar/dashboard-navbar'
import { AddressSearch } from '../components/ui/search-bar/address-search'
import { StatCard } from '../components/ui/stat-card/stat-card'
import { WelcomeCard } from '../components/ui/welcome-card/welcome-card'

const MOCK_STATS: {
  label: string
  value: string
  trend: string
  tone: 'blue' | 'teal' | 'orange' | 'sky'
  icon: ReactNode
}[] = [
  {
    label: 'Generated Reports',
    value: '24',
    trend: '+12 this week',
    tone: 'blue',
    icon: <DocumentStatIcon />,
  },
  {
    label: 'Active Clients',
    value: '18',
    trend: '+3 new',
    tone: 'teal',
    icon: <UsersStatIcon />,
  },
  {
    label: 'Avg Appraisal',
    value: '$875k',
    trend: '+8% vs. last month',
    tone: 'orange',
    icon: <TrendStatIcon />,
  },
  {
    label: 'Pending Reports',
    value: '4',
    trend: '2 due today',
    tone: 'sky',
    icon: <ClockStatIcon />,
  },
]

const MOCK_REPORTS: RecentReport[] = [
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
]

const MOCK_QUICK_ACTIONS: QuickAction[] = [
  {
    id: '1',
    title: 'Generate Appraisal',
    subtitle: 'Create new report',
    tone: 'blue',
    icon: <SparkleActionIcon />,
  },
  {
    id: '2',
    title: 'Client Reports',
    subtitle: 'View all reports',
    tone: 'teal',
    icon: <DocumentActionIcon />,
  },
  {
    id: '3',
    title: 'CRM Workspace',
    subtitle: 'Manage clients',
    tone: 'orange',
    icon: <UsersActionIcon />,
  },
]

const MOCK_INSIGHTS: AiInsight[] = [
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
]

function DocumentStatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3.5h7l4 4V20.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M14 3.5V8h4.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function UsersStatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.5 18.5c0-2.5 2.5-4.5 5.5-4.5s5.5 2 5.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="16.5" cy="8.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M15 14c2.2.3 4 2 4 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function TrendStatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 16.5l5.5-5.5 3.5 3.5L20 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15 7.5h5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SparkleActionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l1.2 5.3L18.5 9.5 13.2 10.7 12 16l-1.2-5.3L5.5 9.5l5.3-1.2L12 3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 15.5l.6 2.4 2.4.6-2.4.6-.6 2.4-.6-2.4-2.4-.6 2.4-.6.6-2.4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DocumentActionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3.5h7l4 4V20.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M14 3.5V8h4.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 12h6M9 15.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function UsersActionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.5 18.5c0-2.5 2.5-4.5 5.5-4.5s5.5 2 5.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="16.5" cy="8.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M15 14c2.2.3 4 2 4 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ClockStatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 8v4.5l3 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Dashboard() {
  return (
    <DashboardNavbar>
      <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
        <AddressSearch
          placeholder="Search by address, suburb, postcode or report ID..."
          className="max-w-none"
        />

        <WelcomeCard
          name="John"
          subtitle="4 pending client reports • 12 active listings"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {MOCK_STATS.map((stat) => (
            <StatCard
              key={stat.label}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              trend={stat.trend}
              tone={stat.tone}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <RecentReportsPanel reports={MOCK_REPORTS} />
          <AiInsightsPanel insights={MOCK_INSIGHTS} />
        </div>

        <QuickActionsPanel actions={MOCK_QUICK_ACTIONS} />
      </div>
    </DashboardNavbar>
  )
}
