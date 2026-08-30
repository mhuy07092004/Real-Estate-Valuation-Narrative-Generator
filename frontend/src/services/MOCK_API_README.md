# Mock API Reference (for Backend team)

This document lists **every API the frontend currently calls**, where it lives, what it should
return, and what the current mock data looks like. Each function below is a thin `fetchJson`
wrapper over a real HTTP path — today MSW intercepts those paths; once a real backend exists,
only the server side changes. No component changes needed.

> Frontend contract: every function returns a `Promise<T>` via `fetchJson()` ([`api-client.ts`](./api-client.ts)).
> Responses are **plain JSON** of type `T` (no `{ success, data }` envelope — auth is the exception).

```ts
// services/api-client.ts
export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`)
  }
  return (await response.json()) as T
}
```

MSW handlers live in `features/dashboard/mock/` (plus `features/auth/mock/` for auth).
Enable with `VITE_ENABLE_MOCKS=true` in `frontend/.env.development` (local dev) or
`frontend/.env.production` (Vercel / `vite build`). To use the real backend after it is ready,
set `VITE_ENABLE_MOCKS=false` in `.env.production` and redeploy — no application code changes.

---

## File map

| File | Domain | Used by |
|---|---|---|
| [`common.ts`](./common.ts) | Shared: notifications helpers, AI Copilot, Generate Appraisal wizard (steps 1–5) | All roles |
| [`agent.ts`](./agent.ts) | Real-Estate Agent: CRM client list, client reports, notifications | Agent |
| [`buyer.ts`](./buyer.ts) | Buyer: affordability calculator, property search/saved, reports, notifications | Buyer |
| [`investor.ts`](./investor.ts) | Investor: dashboard home, ROI calculator, reports, notifications | Investor |
| [`valuer.ts`](./valuer.ts) | Property Valuer: evidence centre, valuation cases/reports, notifications | Valuer |
| [`dashboard.ts`](./dashboard.ts) | Shared: role-parametrized dashboard home + `CaseItem`/`DashboardMockPayload` contracts | All roles |
| [`auth.ts`](./auth.ts) | Auth (envelope response) — reference for auth-style APIs | All roles |

MSW handlers: `features/dashboard/mock/{common,agent,buyer,investor,valuer,dashboard}-handlers.ts`

---

## `common.ts`

### `getRoiDisclaimerNotification(): Promise<NotificationMock>`
`GET /api/notifications/roi-disclaimer`
```ts
type NotificationMock = { message: string }
```

### `getAffordabilityDisclaimerNotification(): Promise<NotificationMock>`
`GET /api/notifications/affordability-disclaimer`

### `getCopilotConversations(): Promise<CopilotConversation[]>`
`GET /api/copilot/conversations`
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
`GET /api/copilot/suggestions`
```ts
type CopilotSuggestion = {
  id: string
  label: string
  icon: 'chart' | 'building' | 'compare' | 'document'
}
```

### `getCopilotMessages(): Promise<CopilotMessage[]>`
`GET /api/copilot/messages`
```ts
type CopilotMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
}
```

### `getAppraisalSteps(): Promise<StepperStep[]>`
`GET /api/appraisal/steps`
```ts
type StepperStep = { id: string; label: string }
```

### `getPropertyInputMethods(): Promise<PropertyInputMethodOption[]>`
`GET /api/appraisal/property-input-methods`
```ts
type PropertyInputMethodOption = {
  id: string
  title: string
  description: string
  iconKey: 'address' | 'search' | 'upload'
}
```

### `getPropertyTypeOptions(): Promise<readonly string[]>`
`GET /api/appraisal/property-types`
e.g. `['House', 'Unit', 'Townhouse']`

### `getAiAnalysisSummaryNotification(): Promise<AiAnalysisSummaryNotification>`
`GET /api/appraisal/ai-analysis-summary`
```ts
type AiAnalysisSummaryNotification = { title: string; message: string }
```

### `getComparableSales(): Promise<ComparableSale[]>`
`GET /api/appraisal/comparable-sales`
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
`GET /api/appraisal/suburb-overview`
```ts
type SuburbOverviewMetric = {
  id: string
  label: string
  value: string             // pre-formatted, e.g. "$845,000" / "+8.5%"
  tone?: 'positive' | 'default'
}
```

### `getDemandSignals(): Promise<DemandSignal[]>`
`GET /api/appraisal/demand-signals`
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
`GET /api/appraisal/report-templates`
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

---

## `agent.ts` (Real-Estate Agent)

### `getClientListMockData(): Promise<ClientItem[]>`
`GET /api/agent/clients`
```ts
type ClientItem = {
  id: string
  name: string
  initials: string
  isStarred: boolean
  address: string | null
  email: string
  phone: string
  notes: string
  reportCount: number
  status: 'prospecting' | 'active' | 'appraisal_sent' | 'listing' | 'sold'
  followUpAt: string        // ISO date string
}
```

### `getClientListSummary(): Promise<ClientListSummary>`
`GET /api/agent/clients/summary`
```ts
type ClientListSummary = { totalClients: number; followUpsDueSoon: number }
```

### `updateClientNotes(id, notes): Promise<ClientItem>`
`PATCH /api/agent/clients/:id`

Request body:
```ts
{ notes: string }
```

Success `200`: full `ClientItem` (same shape as list entries).

Errors (plain JSON):
```ts
{ message: string }  // 400 if notes missing or not a string
{ message: string }  // 404 if client id not found
```

### `getAgentReportListMockData(): Promise<CaseItem[]>`
`GET /api/agent/reports`

### `getAgentNotifications(): Promise<InboxNotification[]>`
`GET /api/agent/notifications`

### `getAgentUnreadNotificationCount(): Promise<number>`
`GET /api/agent/notifications/unread-count`

### `getMarketInsightsMockData(query: MarketInsightsQuery): Promise<MarketInsightsData | null>`
**Not yet wired to `fetchJson`/MSW** — currently a pure local mock (in-memory lookup by suburb) used
by the Market Insights page's suburb search box. Documented here so the shape can become a real
endpoint later: suggested `GET /api/agent/market-insights?suburb=<suburb>`.
```ts
type MarketInsightsQuery = {
  suburb: string            // free-text "Suburb STATE", e.g. "Richmond VIC" (from the search input)
}

type MarketTrendPoint = {
  month: string              // short month label, e.g. "Jan"
  priceIndex: number         // relative price index (not a dollar value), ~0-120 scale
}

type MarketInsightsStats = {
  medianPrice: string        // pre-formatted, e.g. "$1.28M"
  medianPriceTrend: string   // e.g. "+8.2%"
  monthlyGrowth: string      // e.g. "+0.68%"
  monthlyGrowthTrend: string // e.g. "+0.12pp"
  daysOnMarket: number       // e.g. 22
  daysOnMarketTrend: string  // e.g. "-3 days"
  rentalYield: string        // e.g. "3.4%"
  rentalYieldTrend: string   // e.g. "+0.2%"
}

type MarketInsightsData = {
  suburb: string
  stats: MarketInsightsStats
  priceTrend: MarketTrendPoint[]   // 12 points, Jan-Dec
}
```
Response is `null` when the requested suburb has no data (frontend shows a "not found" state
with suggestions — the real endpoint should return `404`/`null` rather than throwing).

---

## `buyer.ts` (Buyer)

### `getAffordabilityCalculationMockData(): Promise<AffordabilityCalculationMock>`
`GET /api/buyer/affordability-calculation`
```ts
type AffordabilityCalculationMock = {
  annualSummary: { label: string; amount: number; tone: 'green' | 'red' | 'navy' | 'net' }[]
  metrics: { label: string; value: string; trend: string; tone: 'blue' | 'teal' | 'orange' | 'sky' }[]
  investmentReturns: { label: string; display: string; tone: 'green' | 'red' | 'navy' }[]
}
```

### `getSearchProperties(): Promise<PropertyCardData[]>`
`GET /api/buyer/properties/search`
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

### `getSavedProperties(): Promise<PropertyCardData[]>`
`GET /api/buyer/properties/saved`

### `getBuyerReportListMockData(): Promise<CaseItem[]>`
`GET /api/buyer/reports`

### `getBuyerNotifications(): Promise<InboxNotification[]>`
`GET /api/buyer/notifications`

### `getBuyerUnreadNotificationCount(): Promise<number>`
`GET /api/buyer/notifications/unread-count`

### `getSuburbExplorerMockData(query: SuburbExplorerQuery): Promise<SuburbExplorerData | null>`
**Not yet wired to `fetchJson`/MSW** — currently a pure local mock (in-memory lookup by suburb),
independent from the equivalent functions in `investor.ts`/`agent.ts` (duplicated on purpose so
each role's page has no cross-role dependency). Suggested real endpoint:
`GET /api/buyer/suburb-explorer?suburb=<suburb>`.
```ts
type SuburbExplorerQuery = { suburb: string }   // free-text "Suburb STATE", e.g. "Richmond VIC"

type SuburbTrendPoint = { month: string; priceIndex: number }   // priceIndex: relative, ~0-120 scale

type SuburbExplorerStats = {
  medianPrice: string
  medianPriceTrend: string
  monthlyGrowth: string
  monthlyGrowthTrend: string
  daysOnMarket: number
  daysOnMarketTrend: string
  rentalYield: string
  rentalYieldTrend: string
}

type SuburbExplorerData = {
  suburb: string
  stats: SuburbExplorerStats
  priceTrend: SuburbTrendPoint[]   // 12 points, Jan-Dec
}
```
Response is `null` when the requested suburb has no data (frontend shows a "not found" state).

---

## `investor.ts` (Investor)

### `getRoiCalculationMockData(): Promise<RoiCalculationMock>`
`GET /api/investor/roi-calculation`
```ts
type RoiCalculationMock = {
  annualSummary: { label: string; amount: number; tone: 'green' | 'red' | 'navy' | 'net' }[]
  metrics: { label: string; value: string; trend: string; tone: 'blue' | 'teal' | 'orange' | 'sky' }[]
  investmentReturns: { label: string; display: string; tone: 'green' | 'red' | 'navy' }[]
}
```

### `getInvestorReportListMockData(): Promise<InvestorReportItem[]>`
`GET /api/investor/reports`
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
`GET /api/investor/reports/summary`
```ts
type InvestorReportSummary = { totalReports: number; draftCount: number; sharedCount: number }
```

### `getInvestorNotifications(): Promise<InboxNotification[]>`
`GET /api/investor/notifications`

### `getInvestorUnreadNotificationCount(): Promise<number>`
`GET /api/investor/notifications/unread-count`

### `getSuburbExplorerMockData(query: SuburbExplorerQuery): Promise<SuburbExplorerData | null>`
**Not yet wired to `fetchJson`/MSW** — currently a pure local mock (in-memory lookup by suburb),
independent from the equivalent functions in `buyer.ts`/`agent.ts` (duplicated on purpose so each
role's page has no cross-role dependency). Suggested real endpoint:
`GET /api/investor/suburb-explorer?suburb=<suburb>`. Same shape as `buyer.ts`'s
`getSuburbExplorerMockData` (see above).

---

## `valuer.ts` (Property Valuer)

### `getEvidenceListMockData(): Promise<EvidenceItem[]>`
`GET /api/valuer/evidence`
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
`GET /api/valuer/evidence/summary`
```ts
type EvidenceCentreMockPayload = {
  totalItems: number
  missingCount: number
}
```

### `getValuationCasesMockData(): Promise<ValuationCasesMockPayload>`
`GET /api/valuer/cases/summary`
```ts
type ValuationCasesMockPayload = {
  totalCases: number
  returnedForRevision: number
}
```

### `getValuerCaseListMockData(): Promise<CaseItem[]>`
`GET /api/valuer/cases`

### `getValuerNotifications(): Promise<InboxNotification[]>`
`GET /api/valuer/notifications`

### `getValuerUnreadNotificationCount(): Promise<number>`
`GET /api/valuer/notifications/unread-count`

### `getMarketInsightsMockData(query: MarketInsightsQuery): Promise<MarketInsightsData | null>`
**Not yet wired to `fetchJson`/MSW** — currently a pure local mock (in-memory lookup by suburb),
independent from the equivalent function in `agent.ts` (duplicated on purpose so each role's page
has no cross-role dependency). Suggested real endpoint: `GET /api/valuer/market-insights?suburb=<suburb>`.
Same shape as `agent.ts`'s `getMarketInsightsMockData` (see above).

---

## `dashboard.ts` (shared)

### `getDashboardMockData(role: DashboardRole): Promise<DashboardMockPayload>`
`GET /api/dashboard/:role` where `role` is `'agent' | 'valuer' | 'buyer' | 'investor'`. MSW payloads live in `features/dashboard/mock/dashboard-mock-data.ts`.
```ts
type DashboardMockPayload = {
  welcomeSubtitle: string
  stats: { label: string; value: string; trend: string; tone: 'blue' | 'teal' | 'orange' | 'sky'; iconKey: 'document' | 'users' | 'trend' | 'clock' }[]
  reports: { id: string; title: string; detail: string; timeAgo: string }[]
  insights: { id: string; title: string; description: string; badge: string; tone: 'blue' | 'teal' | 'orange' }[]
  quickActions: { id: string; title: string; subtitle: string; tone: string; iconKey: 'sparkle' | 'document' | 'users' }[]
}
```

### Shared type: `CaseItem`
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

## `auth.ts` (envelope response — reference)

```
POST /api/auth/login        { email, password } -> { success, data: { user, accessToken, refreshToken, expiresIn } }
```
See [`types/auth.ts`](../types/auth.ts) for `User`, `AuthSession`, `ApiResponse`, `AuthError`.

Auth uses the `{ success, data }` envelope. All other endpoints above return **plain JSON** of type `T`.
