// Shared dashboard types + HTTP service — role-parametrized dashboard home.

import type { AiInsight } from '../features/dashboard/components/ai-insights-panel'
import type { QuickActionTone } from '../features/dashboard/components/quick-actions-panel'
import type { RecentReport } from '../features/dashboard/components/recent-reports-panel'
import type { DashboardRole } from '../features/dashboard/utils/dashboard-role'
import { fetchJson } from './api-client'

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

export function getDashboardMockData(role: DashboardRole): Promise<DashboardMockPayload> {
  return fetchJson(`/api/dashboard/${role}`)
}
