// Shared navigation helper for "open this report in the wizard" (Phase 2 report-card
// consolidation). Generalizes the working pattern agent-report.tsx already used —
// `?step=4&ready=1&reportId=` — which generate-report.tsx (GenerateReportV2) consumes via
// getPersistedReport to hydrate the wizard's Report Configuration step with a saved report.
// See figma-ui-migration-plan.md §9.4 step 3 / the Phase 2 report-card audit.

import { useNavigate } from 'react-router-dom'
import type { DashboardRole } from '../../features/dashboard/utils/dashboard-role'

/**
 * Build the URL that opens a persisted report directly at the wizard's final
 * (Report Configuration / "ready") step, for a given role.
 *
 * Note: this only resolves to a real report if `reportId` is a key
 * `getPersistedReport` (GET /api/reports/:id) can actually look up — i.e. an id from
 * the real `Report` Prisma model, the same namespace Agent's `/api/reports`-backed
 * report cards already use. Some callers (Valuer cases, Investor reports) currently
 * pass ids from separate mock-only namespaces that won't resolve — see the TODO
 * comments at those call sites and backend/V2_BACKEND_TODO.md.
 */
export function buildReportViewPath(role: DashboardRole, reportId: string): string {
  return `/dashboard/${role}/generate-report?step=4&ready=1&reportId=${encodeURIComponent(reportId)}`
}

/**
 * Convenience hook for the common case: navigate to a report's wizard view for the
 * given role. Reduces call sites to `openReport(report.id)` instead of repeating
 * `navigate(buildReportViewPath(role, id))` everywhere.
 */
export function useOpenReport(role: DashboardRole): (reportId: string) => void {
  const navigate = useNavigate()
  return (reportId: string) => navigate(buildReportViewPath(role, reportId))
}
