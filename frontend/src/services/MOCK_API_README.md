# Mock API Reference (for Backend team)

This document lists **every placeholder "API" the frontend currently calls**, where it lives, what it should
return, and what the current mock data looks like. Each function below is a stand-in for a real backend
endpoint — the frontend already calls them asynchronously (`await` / `useEffect`), so replacing the body with
a real `fetch(...)` call is a **drop-in swap**: no component changes needed.

> Frontend contract: every function returns a `Promise<T>`. Today `T` is produced instantly from a local
> mock array/object via `simulateRequest()` ([`api-client.ts`](./api-client.ts)). Once a real endpoint
> exists, only the function body changes (`return fetch('/api/...').then(r => r.json())`), the return type
> `T` should stay the same shape.

```ts
// services/api-client.ts — current placeholder
export function simulateRequest<T>(data: T, delayMs = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delayMs))
}
```

The only **real** HTTP service so far is [`auth.ts`](./auth.ts) (`login`, session helpers) — it already
calls `POST /api/auth/login` etc. Use it as the reference for what a "real" service function should look
like once the backend is ready.

---

## File map

| File | Domain | Used by |
|---|---|---|
| [`mock-common.ts`](./mock-common.ts) | Shared: notifications helpers, AI Copilot, Generate Appraisal wizard (steps 1–5) | All roles |
| [`mock-agent.ts`](./mock-agent.ts) | Real-Estate Agent: CRM client list, client reports, notifications | Agent |
| [`mock-buyer.ts`](./mock-buyer.ts) | Buyer: affordability calculator, property search/saved, reports, notifications | Buyer |
| [`mock-investor.ts`](./mock-investor.ts) | Investor: dashboard home, ROI calculator, reports, notifications | Investor |
| [`mock-valuer.ts`](./mock-valuer.ts) | Property Valuer: evidence centre, valuation cases/reports, notifications | Valuer |
| [`mock-dashboard.ts`](./mock-dashboard.ts) | Shared: role-parametrized dashboard home + `CaseItem`/`DashboardMockPayload` contracts | All roles |
| [`auth.ts`](./auth.ts) | Real backend already implemented | All roles |

---

## `mock-common.ts`

### `getRoiDisclaimerNotification(): Promise<NotificationMock>`
Static disclaimer text shown above the ROI calculator.
```ts
type NotificationMock = { message: string }
```

### `getAffordabilityDisclaimerNotification(): Promise<NotificationMock>`
Same shape as above, shown on the Affordability calculator.

### `getCopilotConversations(): Promise<CopilotConversation[]>`
AI Copilot sidebar conversation list.
```ts
type CopilotConversation = {
  id: string
  title: string
  timestamp: string       // display string, e.g. "Today"
  snippet: string
  pinned?: boolean
  active?: boolean
}
```

### `getCopilotSuggestions(): Promise<CopilotSuggestion[]>`
Suggested-prompt cards shown in an empty Copilot chat.
```ts
type CopilotSuggestion = {
  id: string
  label: string
  icon: 'chart' | 'building' | 'compare' | 'document'
}
```

### `getCopilotMessages(): Promise<CopilotMessage[]>`
Chat message history for the active conversation.
```ts
type CopilotMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
}
```

### `getAppraisalSteps(): Promise<StepperStep[]>`
Step labels for the "Generate Appraisal" wizard progress bar.
```ts
type StepperStep = { id: string; label: string }
```

### `getPropertyInputMethods(): Promise<PropertyInputMethodOption[]>`
Choices on step 1 of the appraisal wizard (Enter Address / Search Property / Upload File).
```ts
type PropertyInputMethodOption = {
  id: string
  title: string
  description: string
  iconKey: 'address' | 'search' | 'upload'
}
```

### `getPropertyTypeOptions(): Promise<readonly string[]>`
Datalist options for the "Property Type" field, e.g. `['House', 'Unit', 'Townhouse']`.

### `getAiAnalysisMetrics(): Promise<AiAnalysisMetric[]>`
Step 2 (AI Analysis) score bars.
```ts
type AiAnalysisMetric = {
  id: string
  label: string
  value: number            // 0–100
  tone: 'blue' | 'teal' | 'orange' | 'sky'
}
```

### `getAiAnalysisSummaryNotification(): Promise<AiAnalysisSummaryNotification>`
AI-generated summary paragraph shown on steps 2 and 4.
```ts
type AiAnalysisSummaryNotification = { title: string; message: string }
```

### `getComparableSales(): Promise<ComparableSale[]>`
Step 3 (Comparables) list of similar recent sales.
```ts
type ComparableSale = {
  id: string
  address: string
  price: number
  soldAgo: string           // display string, e.g. "2 weeks ago"
  beds: number
  baths: number
  parking: number
  areaSqm: number
  matchPercent: number      // 0–100
  distanceKm: number
}
```

### `getSuburbOverview(): Promise<SuburbOverviewMetric[]>`
Step 4 (Market Intelligence) suburb stat rows (median price, growth, yield, days on market).
```ts
type SuburbOverviewMetric = {
  id: string
  label: string
  value: string             // pre-formatted, e.g. "$845,000" / "+8.5%"
  tone?: 'positive' | 'default'
}
```

### `getDemandSignals(): Promise<DemandSignal[]>`
Step 4 demand-signal progress rows (buyer interest, supply, price growth).
```ts
type DemandSignal = {
  id: string
  label: string
  level: string              // display label, e.g. "High"
  percent: number            // 0–100, drives the progress bar width
  tone: 'high' | 'medium' | 'strong'
}
```

### `getReportTemplates(): Promise<ReportTemplateOption[]>`
Step 5 report template picker (Vendor Appraisal / Bank Valuation / Buyer Advisory / Investment Report).
```ts
type ReportTemplateOption = {
  id: string
  title: string
  description: string
  iconKey: 'vendor' | 'bank' | 'buyer' | 'investment'
}
```

### Shared types also defined here
- `InboxNotification` — used by every role's notification list (see `get*Notifications()` below).
- `hoursAgo(hours)` / `daysAgo(days)` — local helpers that generate ISO timestamps for mock data; **not** endpoints, no backend equivalent needed.

---

## `mock-agent.ts` (Real-Estate Agent)

### `getClientListMockData(): Promise<ClientItem[]>`
Full CRM client list.
```ts
type ClientItem = {
  id: string
  name: string
  initials: string
  isStarred: boolean
  address: string | null
  reportCount: number
  status: 'prospecting' | 'active' | 'appraisal_sent' | 'listing' | 'sold'
  followUpAt: string        // ISO date string
}
```

### `getClientListSummary(): Promise<ClientListSummary>`
Header counters above the client table.
```ts
type ClientListSummary = { totalClients: number; followUpsDueSoon: number }
```

### `getAgentReportListMockData(): Promise<CaseItem[]>`
Agent's report list (see `CaseItem` under `mock-dashboard.ts`).

### `getAgentNotifications(): Promise<InboxNotification[]>`
### `getAgentUnreadNotificationCount(): Promise<number>`
Agent's notification inbox + unread badge count. `InboxNotification` defined in `mock-common.ts`.

---

## `mock-buyer.ts` (Buyer)

### `getAffordabilityCalculationMockData(): Promise<AffordabilityCalculationMock>`
Results panel for the Affordability calculator.
```ts
type AffordabilityCalculationMock = {
  annualSummary: { label: string; amount: number; tone: 'green' | 'red' | 'navy' | 'net' }[]
  metrics: { label: string; value: string; trend: string; tone: 'blue' | 'teal' | 'orange' | 'sky' }[]
  investmentReturns: { label: string; display: string; tone: 'green' | 'red' | 'navy' }[]
}
```

### `getSearchProperties(): Promise<PropertyCardData[]>`
Listings shown on the "Search Properties" page.
```ts
type PropertyCardData = {
  id: string
  address: { street: string; suburb: string; state: string; postcode: string }
  price: number
  estimatedRange: { min: string; max: string }
  propertyType: 'House' | 'Unit' | 'Townhouse'
  features: { beds: number; baths: number; areaSqm: number; parking?: number }
  listedDays: number
  status: 'within_range' | 'below_range' | 'above_range'
}
```
(defined in `components/ui/property-card/property-card.tsx`)

### `getSavedProperties(): Promise<PropertyCardData[]>`
Same shape as above, for the "Saved Properties" page.

### `getBuyerReportListMockData(): Promise<CaseItem[]>`
Buyer's report list (see `CaseItem` under `mock-dashboard.ts`).

### `getBuyerNotifications(): Promise<InboxNotification[]>`
### `getBuyerUnreadNotificationCount(): Promise<number>`
Buyer's notification inbox + unread badge count.

---

## `mock-investor.ts` (Investor)

### `getRoiCalculationMockData(): Promise<RoiCalculationMock>`
Same shape family as `AffordabilityCalculationMock` above, but for the ROI calculator:
```ts
type RoiCalculationMock = {
  annualSummary: { label: string; amount: number; tone: 'green' | 'red' | 'navy' | 'net' }[]
  metrics: { label: string; value: string; trend: string; tone: 'blue' | 'teal' | 'orange' | 'sky' }[]
  investmentReturns: { label: string; display: string; tone: 'green' | 'red' | 'navy' }[]
}
```

### `getInvestorDashboardMockData(): Promise<DashboardMockPayload>`
Investor's dashboard home payload (see `DashboardMockPayload` under `mock-dashboard.ts`).

### `getInvestorReportListMockData(): Promise<InvestorReportItem[]>`
```ts
type InvestorReportItem = {
  id: string
  propertyName: string
  suburb: string
  portfolio: string
  reportType: string
  status: 'draft' | 'in_review' | 'shared' | 'archived'
  purchaseValue: number
  grossYield: number | null
  updatedAt: string          // ISO date string
}
```

### `getInvestorReportSummary(): Promise<InvestorReportSummary>`
```ts
type InvestorReportSummary = { totalReports: number; draftCount: number; sharedCount: number }
```

### `getInvestorNotifications(): Promise<InboxNotification[]>`
### `getInvestorUnreadNotificationCount(): Promise<number>`
Investor's notification inbox + unread badge count.

---

## `mock-valuer.ts` (Property Valuer)

### `getEvidenceListMockData(): Promise<EvidenceItem[]>`
Full Evidence Centre row list.
```ts
type EvidenceItem = {
  id: string
  title: string
  detail: string
  category: 'comparable' | 'market' | 'document' | 'history' | 'missing'
  source: string
  status: 'verified' | 'pending' | 'missing'
  confidence: number | null   // 0–100, null when not applicable
  updatedAt: string           // ISO date string
}
```

### `getEvidenceCentreMockData(): Promise<EvidenceCentreMockPayload>`
Header counters + stat cards above the evidence table (currently computed client-side by filtering
`EvidenceItem[]` — backend can either compute these server-side or the frontend can keep deriving them
from the full list).
```ts
type EvidenceCentreMockPayload = {
  totalItems: number
  missingCount: number
  stats: { label: string; value: string; tone: 'blue' | 'teal' | 'orange' | 'sky' }[]
}
```

### `getValuationCasesMockData(): Promise<ValuationCasesMockPayload>`
Header counters + stat cards above the valuation cases table.
```ts
type ValuationCasesMockPayload = {
  totalCases: number
  returnedForRevision: number
  stats: { label: string; value: string; tone: 'blue' | 'teal' | 'orange' | 'sky' }[]
}
```

### `getValuerCaseListMockData(): Promise<CaseItem[]>`
Valuer's case/report list (see `CaseItem` under `mock-dashboard.ts`).

### `getValuerNotifications(): Promise<InboxNotification[]>`
### `getValuerUnreadNotificationCount(): Promise<number>`
Valuer's notification inbox + unread badge count.

---

## `mock-dashboard.ts` (shared)

### `getDashboardMockData(role: DashboardRole): Promise<DashboardMockPayload>`
Dashboard home payload for whichever role is active (`'agent' | 'valuer' | 'buyer' | 'investor'`).
```ts
type DashboardMockPayload = {
  welcomeSubtitle: string
  stats: { label: string; value: string; trend: string; tone: 'blue' | 'teal' | 'orange' | 'sky'; iconKey: 'document' | 'users' | 'trend' | 'clock' }[]
  reports: { id: string; title: string; detail: string; timeAgo: string }[]
  insights: { id: string; title: string; description: string; badge: string; tone: 'blue' | 'teal' | 'orange' }[]
  quickActions: { id: string; title: string; subtitle: string; tone: string; iconKey: 'sparkle' | 'document' | 'users' }[]
}
```
> Note: for `role === 'investor'` this just forwards to `getInvestorDashboardMockData()` in `mock-investor.ts` — same payload shape either way.

### Shared type: `CaseItem`
Row shape for every report/case table across all 4 roles (agent reports, buyer reports, investor reports use `InvestorReportItem` instead, valuer cases/reports):
```ts
type CaseItem = {
  id: string
  address: string
  suburb: string
  clientName: string
  status: 'valuer_review' | 'evidence_collection' | 'reviewer_approval' | 'approved' | 'exported' | 'draft' | 'returned_for_revision'
  purpose: string
  confidence: number | null
  updatedAt: string           // ISO date string
  hasWarning: boolean
}
```

---

## `auth.ts` (already real — reference implementation)

```
POST /api/auth/login        { email, password } -> { success, data: { user, accessToken, refreshToken, expiresIn } }
```
See [`types/auth.ts`](../types/auth.ts) for `User`, `AuthSession`, `ApiResponse`, `AuthError`. Once other
endpoints above are ready, follow this same pattern: a `services/*.ts` function does the `fetch`, parses
`ApiResponse<T>`, throws on `!success`, returns the typed data — no `fetch` calls in components.
