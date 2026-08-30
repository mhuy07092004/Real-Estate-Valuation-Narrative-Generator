import { useState } from 'react'

// v2 build of the shared Team Workspace page (figma: TeamWorkspacePage.tsx, read in full) —
// reachable from any role via the sidebar's "Team" nav item (wired in Phase 1 to
// `/dashboard/{role}/team`, see use-dashboard-nav-state.ts). This is inherently
// multi-user/org content (team roster, roles, a shared review queue, an org-wide audit
// log) with no backend representation anywhere in this app: checked
// `backend/prisma/schema.prisma` (only a `Role` enum-style model exists — user roles like
// agent/valuer/investor/buyer, not an org/team/membership model) and
// `backend/src/routes/mock.routes.ts` (no "team"/"member"/"invite"/"review-queue" routes at
// all). Built here from local illustrative mock data (clearly team/org roster content, not
// personal financial data), following this migration's established "mock data now, document
// backend gap" pattern (same as Audit Trail / Explainable AI). See
// backend/V2_BACKEND_TODO.md — a real team/org data model is a substantial net-new feature,
// flagged there as such rather than folded into an existing row.

type TeamTab = 'dashboard' | 'members' | 'reviews' | 'audit'

type TeamMember = {
  id: string
  name: string
  role: 'Admin' | 'Senior Valuer' | 'Valuer' | 'Agent'
  email: string
  status: 'Active' | 'Invited'
  reportsThisMonth: number
  avatar: string
}

const TEAM_MEMBERS: TeamMember[] = [
  { id: '1', name: 'Alex Wilson', role: 'Admin', email: 'alex@agency.com', status: 'Active', reportsThisMonth: 12, avatar: 'AW' },
  { id: '2', name: 'Sarah Chen', role: 'Senior Valuer', email: 'sarah@agency.com', status: 'Active', reportsThisMonth: 18, avatar: 'SC' },
  { id: '3', name: 'Michael Lee', role: 'Agent', email: 'michael@agency.com', status: 'Active', reportsThisMonth: 9, avatar: 'ML' },
  { id: '4', name: 'Emma Wilson', role: 'Agent', email: 'emma@agency.com', status: 'Active', reportsThisMonth: 7, avatar: 'EW' },
  { id: '5', name: 'James Park', role: 'Valuer', email: 'james@agency.com', status: 'Invited', reportsThisMonth: 0, avatar: 'JP' },
]

type ReviewItem = {
  id: string
  property: string
  type: string
  status: 'Awaiting Approval' | 'In Review' | 'Ready to Export' | 'Pending Review'
  assignee: string
  submitted: string
  priority: 'High' | 'Medium' | 'Low'
}

const REVIEW_QUEUE: ReviewItem[] = [
  { id: '1', property: '123 Smith Street, Melbourne', type: 'Appraisal', status: 'Awaiting Approval', assignee: 'Sarah Chen', submitted: '2 hours ago', priority: 'High' },
  { id: '2', property: '45 Park Avenue, Kew', type: 'CMA Report', status: 'In Review', assignee: 'You', submitted: '5 hours ago', priority: 'Medium' },
  { id: '3', property: '78 Main Road, Hawthorn', type: 'Valuation', status: 'Ready to Export', assignee: 'Michael Lee', submitted: '1 day ago', priority: 'Low' },
  { id: '4', property: '22 Oak Lane, South Yarra', type: 'Appraisal', status: 'Pending Review', assignee: 'Emma Wilson', submitted: '2 days ago', priority: 'Medium' },
]

type AuditLogEntry = {
  user: string
  action: string
  detail: string
  time: string
}

const AUDIT_LOGS: AuditLogEntry[] = [
  { user: 'Alex Wilson', action: 'Approved report', detail: '45 Park Ave appraisal approved', time: '2h ago' },
  { user: 'Sarah Chen', action: 'Created report', detail: 'New appraisal for 123 Smith St', time: '3h ago' },
  { user: 'Michael Lee', action: 'Shared report', detail: 'Report shared with client@email.com', time: '5h ago' },
  { user: 'Alex Wilson', action: 'Updated permissions', detail: 'James Park added as Valuer', time: '1d ago' },
  { user: 'Sarah Chen', action: 'Exported PDF', detail: '78 Main Rd valuation exported', time: '1d ago' },
]

const ROLE_PERMISSIONS: Record<TeamMember['role'], string[]> = {
  Admin: ['Create', 'Edit', 'Delete', 'Share', 'Approve', 'Export', 'Invite Users', 'Manage Billing'],
  'Senior Valuer': ['Create', 'Edit', 'Share', 'Approve', 'Export'],
  Valuer: ['Create', 'Edit', 'Export'],
  Agent: ['Create', 'Edit', 'Export'],
}

const STATUS_STYLES: Record<ReviewItem['status'], string> = {
  'Awaiting Approval': 'bg-amber-50 text-amber-600',
  'In Review': 'bg-relaive-primary/10 text-relaive-primary',
  'Ready to Export': 'bg-emerald-50 text-emerald-600',
  'Pending Review': 'bg-black/5 text-relaive-gray',
}

const PRIORITY_STYLES: Record<ReviewItem['priority'], string> = {
  High: 'bg-red-50 text-red-500',
  Medium: 'bg-amber-50 text-amber-600',
  Low: 'bg-black/5 text-relaive-gray',
}

const TABS: { id: TeamTab; label: string }[] = [
  { id: 'dashboard', label: 'Agency Dashboard' },
  { id: 'members', label: 'Members & Roles' },
  { id: 'reviews', label: 'Review Queue' },
  { id: 'audit', label: 'Audit Logs' },
]

export function TeamWorkspacePageV2() {
  const [activeTab, setActiveTab] = useState<TeamTab>('dashboard')
  const [selectedMember, setSelectedMember] = useState<string | null>(null)

  const activeMembers = TEAM_MEMBERS.filter((m) => m.status === 'Active')
  const totalReports = TEAM_MEMBERS.reduce((sum, m) => sum + m.reportsThisMonth, 0)
  const pendingReviews = REVIEW_QUEUE.length

  return (
    <div className="flex flex-col gap-6 p-4 font-sans sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">Team Workspace</h1>
          <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">
            Collaborate, review, and manage your agency workflows
          </p>
        </div>
        <button
          type="button"
          className="rounded-xl bg-relaive-primary px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Invite Member
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-1 border-b border-black/5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-relaive-primary text-relaive-primary'
                : 'border-transparent text-relaive-gray hover:text-relaive-navy'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Team Members', value: String(TEAM_MEMBERS.length) },
              { label: 'Reports This Month', value: String(totalReports) },
              { label: 'Pending Reviews', value: String(pendingReviews) },
              { label: 'Avg. Turnaround', value: '1.4 days' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-black/5 bg-white p-4">
                <p className="text-2xl font-bold text-relaive-primary">{stat.value}</p>
                <p className="mt-0.5 text-xs text-relaive-gray">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-black/5 bg-white p-6">
              <h3 className="mb-4 text-base font-medium text-relaive-navy">Team Activity</h3>
              <div className="flex flex-col gap-3">
                {activeMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-relaive-primary text-xs font-semibold text-white">
                      {member.avatar}
                    </div>
                    <div className="min-w-0 flex-grow">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm text-relaive-navy">{member.name}</span>
                        <span className="text-xs font-medium text-relaive-primary">{member.reportsThisMonth} reports</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-black/5">
                        <div
                          className="h-full rounded-full bg-relaive-primary"
                          style={{ width: `${Math.min(100, (member.reportsThisMonth / 20) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-6">
              <h3 className="mb-4 text-base font-medium text-relaive-navy">Recent Reviews</h3>
              <div className="flex flex-col gap-3">
                {REVIEW_QUEUE.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl bg-[#F5F7FA] p-3">
                    <div className="min-w-0 flex-grow">
                      <p className="truncate text-sm text-relaive-navy">{item.property}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className={`rounded-md px-2 py-0.5 text-xs ${STATUS_STYLES[item.status]}`}>
                          {item.status}
                        </span>
                        <span className="text-xs text-relaive-gray/70">{item.submitted}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'members' ? (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-3 md:col-span-2">
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.id}
                className={`cursor-pointer rounded-2xl border bg-white p-5 transition-colors ${
                  selectedMember === member.id ? 'border-relaive-primary/40 shadow-md' : 'border-black/5 hover:border-relaive-primary/25'
                }`}
                onClick={() => setSelectedMember(selectedMember === member.id ? null : member.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-relaive-primary font-semibold text-white">
                    {member.avatar}
                  </div>
                  <div className="flex-grow">
                    <div className="mb-0.5 flex items-center gap-2">
                      <h3 className="text-sm font-medium text-relaive-navy">{member.name}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          member.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {member.status}
                      </span>
                    </div>
                    <p className="text-xs text-relaive-gray">{member.email}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-relaive-primary">{member.role}</div>
                    <div className="text-xs text-relaive-gray/70">{member.reportsThisMonth} reports</div>
                  </div>
                </div>
                {selectedMember === member.id ? (
                  <div className="mt-4 border-t border-black/5 pt-4">
                    <h4 className="mb-3 text-xs uppercase tracking-wider text-relaive-gray/70">Permissions</h4>
                    <div className="flex flex-wrap gap-2">
                      {ROLE_PERMISSIONS[member.role].map((perm) => (
                        <span key={perm} className="rounded-lg bg-relaive-primary/10 px-3 py-1 text-xs text-relaive-primary">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-black/5 bg-white p-5">
              <h3 className="mb-4 text-sm font-medium text-relaive-navy">Roles & Permissions</h3>
              <div className="flex flex-col gap-3">
                {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
                  <div key={role} className="rounded-xl bg-[#F5F7FA] p-3">
                    <p className="mb-1 text-sm font-medium text-relaive-navy">{role}</p>
                    <p className="text-xs text-relaive-gray/70">{perms.length} permissions</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-relaive-primary p-5 text-white">
              <h3 className="mb-2 text-sm font-medium">Invite Team Member</h3>
              <p className="mb-4 text-xs text-white/70">Add colleagues to collaborate on reports</p>
              <input
                type="email"
                placeholder="colleague@agency.com"
                className="mb-3 w-full rounded-xl border border-white/30 bg-white/20 px-3 py-2 text-sm text-white placeholder:text-white/50 outline-none"
              />
              <button type="button" className="w-full rounded-xl bg-white px-4 py-2 text-sm font-medium text-relaive-primary hover:bg-white/90">
                Send Invite
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'reviews' ? (
        <div className="flex flex-col gap-3">
          {REVIEW_QUEUE.map((item) => (
            <div key={item.id} className="rounded-2xl border border-black/5 bg-white p-5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-grow">
                  <h3 className="truncate text-sm font-medium text-relaive-navy">{item.property}</h3>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-relaive-gray">
                    <span>{item.type}</span>
                    <span className="text-relaive-gray/40">·</span>
                    <span>Assigned to {item.assignee}</span>
                    <span className="text-relaive-gray/40">·</span>
                    <span className="text-relaive-gray/70">{item.submitted}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-lg px-2 py-1 text-xs ${STATUS_STYLES[item.status]}`}>{item.status}</span>
                  <span className={`rounded-lg px-2 py-1 text-xs ${PRIORITY_STYLES[item.priority]}`}>{item.priority}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === 'audit' ? (
        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
          <div className="flex items-center justify-between border-b border-black/5 p-5">
            <h3 className="text-base font-medium text-relaive-navy">Audit Log</h3>
            <span className="text-xs text-relaive-gray/70">Last 30 days</span>
          </div>
          <div className="divide-y divide-black/5">
            {AUDIT_LOGS.map((log, idx) => (
              <div key={idx} className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-relaive-primary/10 text-xs font-semibold text-relaive-primary">
                  {log.user
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="min-w-0 flex-grow">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-relaive-navy">{log.user}</span>
                    <span className="rounded-md bg-relaive-primary/10 px-2 py-0.5 text-xs text-relaive-primary">{log.action}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-relaive-gray">{log.detail}</p>
                </div>
                <span className="shrink-0 text-xs text-relaive-gray/70">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
