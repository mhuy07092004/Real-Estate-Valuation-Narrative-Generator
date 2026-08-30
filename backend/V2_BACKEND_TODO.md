# v2 backend TODO — Valuer / Investor / Buyer roles

Companion doc to `figma-ui-migration-plan.md` (repo root) §10-§12. The v2 frontend migration
for these three roles is proceeding **frontend-first, on mock/existing data** — nothing here
blocks that work. This doc is the punch list for the backend work that would come after, to
take each screen from "mock-backed" to "real."

Existing real infrastructure already reusable by all three roles, no new work needed:
`/api/appraisal/*` (comparable-sales, market-metrics, narrative-preview, appraisal-summary,
disclaimer, report-templates — all role-agnostic, query-param keyed), `/api/reports` (real
`Report` Prisma model + CRUD, currently only wired to the Agent flow), `/api/saved-properties`
(real `SavedPropertySearch` model + CRUD, currently only wired to Agent's Comparable Sales
"Save Property" button), `/api/clients`.

---

## Valuer

| Screen | Needed | Priority |
|---|---|---|
| Valuation Cases list | New `ValuationCase` Prisma model (property fields, client, purpose, status workflow, confidence score, midpoint/range) + CRUD routes. Currently a 2-row hardcoded array in `mock.routes.ts`. | High — this is the role's home screen |
| Valuation Cases / dashboard report deep-link | **Phase 2 addition**: `valuation-cases.tsx` and `valuer-home.tsx`'s Recent Reports panel now navigate to `/dashboard/valuer/generate-report?step=4&ready=1&reportId=<caseId>` on click (see `frontend/src/v2/services/report-navigation.ts`), but `getValuerCaseListMockData()`'s case ids (from `/api/valuer/cases`) and the dashboard's mock report ids (from `/api/dashboard/valuer`) are a separate id namespace from the real `Report` model — they do NOT resolve via `GET /api/reports/:id`. Once the `ValuationCase` model above exists, give it a `reportId` foreign key into `Report` so these clicks actually hydrate the wizard, the way Agent's real `/api/reports` ids already do. | High — currently a dead-end click, just a less-broken one than before |
| Evidence Centre | New `EvidenceRecord` model (category, source, status, confidence, linked case) + CRUD. Currently a hardcoded array; figma's UX is a live search-then-save flow (closer to Agent's Comparable Sales page), not v1's static table — this is a real feature, not just a data source swap. | Medium |
| Audit Trail | New `AuditEvent`/`AuditTrail` model (actor, action, field, old/new value, AI-suggested value, decision, linked case, stage). Zero backend representation today. | Low — net-new screen, no v1 equivalent at all |
| Explainable AI | No obvious persisted model — likely fine to compute/derive client-side from `Report` + comparables rather than storing anything. Lowest priority to build backend for. | Low |
| "Full Valuation Report" narrative | **No new backend needed** — `bank-valuation` is already a valid `reportType` in `narrative-prompts.ts` and listed in `/api/appraisal/report-templates`. Real Groq narrative generation already works for this report type. | — (already real) |

Also needed regardless of the above: valuer-flavored copy for `agent-recommendations` /
`appraisal-disclaimer` mock endpoints — their hardcoded text currently says "licensed real
estate agent" / "AGENT RECOMMENDATIONS", not valuer-appropriate. Either add a `role` param
these endpoints branch on, or add valuer-specific sibling endpoints.

## Investor

| Screen | Needed | Priority |
|---|---|---|
| Investment Reports list | `Report` Prisma model needs `roi`/`comparables`-shaped fields (or a separate `InvestorReportMeta` side table) — currently `/api/investor/reports*` are static mock arrays, not Prisma-backed at all, unlike Agent's real `/api/reports`. | High |
| Investment Reports / dashboard report deep-link | **Phase 2 addition**: `investor-reports.tsx` and `investor-home.tsx`'s Recent Reports panel now navigate to `/dashboard/investor/generate-report?step=4&ready=1&reportId=<id>` on click, but `getInvestorReportListMockData()`'s ids (from `/api/investor/reports`) and the dashboard's mock report ids (from `/api/dashboard/investor`) are a separate id namespace from the real `Report` model and do NOT resolve via `GET /api/reports/:id`. Fixing the row above (real Prisma-backed investor reports, sharing `Report`'s id space) resolves this too. | High — currently a dead-end click, just a less-broken one than before |
| ROI Calculator | **No new backend needed for the math** — `useCalculator` (loan amortization, gross/net yield, cash flow, cash-on-cash, break-even rent) is 100% client-side in figma. The existing `/api/investor/roi-calculation` mock endpoint (which returns pre-canned rows today) should be **retired**, not extended, once v2 ports the client-side calculator. | — (frontend-only work, this row is a removal, not an addition) |
| Suburb Explorer | Net-new suburb-level dataset/model (median price, yield, vacancy, opportunity score, demographics, forecast, risk). Even figma's own prototype hasn't finished most of these tabs (several show "loading" placeholders permanently) — recommend not building backend for tabs figma itself hasn't designed yet. | Low |
| Market Comparison | Needs a suburb catalog + comparison endpoint. No current backend equivalent. | Low |
| Watchlist ("Portfolio") | **Doc correction**: the migration plan's "Portfolio" gap item doesn't correspond to any real figma screen — the closest match is `WatchlistPage.tsx` (saved properties/suburbs/searches/alerts), not an investment-tracking ledger. Its "Saved Properties"/"Saved Searches" tabs map to the existing real `SavedPropertySearch` model — reusable now, no new backend. "Saved Suburbs" and "Alerts" have no model — net-new if wanted. | Low — and re-scope, don't build a literal "portfolio" ledger unless separately requested |
| Investment Intelligence — Portfolio tab | **Phase 4 addition**: `frontend/src/v2/pages/dashboard/investor/investment-intelligence.tsx`'s Portfolio tab (suburb ranking by AI score, with Invested/Current/Yield/Total Return columns) ports figma's static 4-suburb mock array as illustrative placeholder content — no real cross-suburb investment-tracking dataset exists (`services/investor.ts` and `v2/services/common.ts` only expose per-address market metrics/comparables, not a ranked suburb dataset, and there's no per-user "what did I actually invest in this suburb" model either). Needs a net-new suburb-ranking dataset/model (median price, yield, historical ROI, AI opportunity score) plus, if this is meant to reflect a user's actual holdings rather than a market ranking, a `PortfolioHolding`-style model (suburb, amount invested, purchase date) tied to the user. | Low — net-new, no existing partial backend to extend |

## Buyer

| Screen | Needed | Priority |
|---|---|---|
| Inspections | Full net-new: no Prisma model, no routes. Needs property/date/agent + a checklist (item, status, notes, cost estimate) + overall notes. **Phase 5 update**: built as a real, working local-only feature at `frontend/src/v2/pages/dashboard/buyer/inspections.tsx` (`InspectionsPageV2`) — add/edit/remove inspections + a 10-point checklist, persisted via the same module-var + localStorage pattern as `roi-scenario-store.ts` (key `relaive_buyer_inspections`). This is real per-viewer state, not fabricated data, but it doesn't sync across devices and is lost if the browser storage is cleared. A real backend model would look like: `Inspection { id, userId, addressLine, suburb, state, postcode, scheduledDate, scheduledTime, notes, overallNotes, checklistItems: InspectionChecklistItem[] }` / `InspectionChecklistItem { id, inspectionId, label, status (enum: unchecked/ok/concern/major), note, estimatedCost }`, plus `GET/POST/PATCH/DELETE /api/inspections` CRUD. | Medium — real screen in figma, currently has zero backend; now has a real local implementation but no server sync |
| Affordability Calculator | **No new backend needed for the math** — `useAffordability` is 100% client-side (7 inputs → borrowing capacity, max loan, repayment-to-income, a 6-point rate-sensitivity table). The existing `/api/buyer/affordability-calculation` mock endpoint returns data shaped like an *investor ROI* response (rental yield, cash flow) — it doesn't match the real affordability inputs/outputs at all. **Recommend retiring this endpoint**, not fixing it, once v2 ports the client-side calculator. | — (frontend-only work, this row is a removal) |
| Saved Properties | Real `SavedPropertySearch` model + `/api/saved-properties` CRUD already exists and is reusable as-is (same as Agent's). Currently buyer's v1 page calls a *different*, mock-only endpoint (`/api/buyer/properties/saved`) instead of the real one — this is a genuine bug/gap worth fixing regardless of the wider v2 work: point buyer's saved-properties read at the real endpoint. | Medium |
| Property Search | Backend has `/api/buyer/properties/search`, mock-only. Figma's richer version (filtering, save/compare toggles, fairness badges vs comparable range) needs either query params added to this mock endpoint or client-side filtering over the same real comparable-sales data agent uses. | Low |
| Compare Properties | Net-new page, no v1 equivalent. The "AI summary" text is hardcoded in figma — could stay client-composed from comparable data rather than needing a new narrative endpoint. | Low |
| Buyer Reports | Same story as Investor Reports — needs the real `/api/reports` CRUD wired into a buyer-aware wizard, instead of the current `/api/buyer/reports` mock array. | Medium |
| Buyer Reports / dashboard report deep-link | **Phase 2 addition**: net-new `frontend/src/v2/pages/dashboard/buyer/buyer-reports.tsx` and `buyer-home.tsx`'s Recent Reports panel now navigate to `/dashboard/buyer/generate-report?step=4&ready=1&reportId=<id>` on click, but `getBuyerReportListMockData()`'s ids (from `/api/buyer/reports`) and the dashboard's mock report ids (from `/api/dashboard/buyer`) are a separate id namespace from the real `Report` model and do NOT resolve via `GET /api/reports/:id`. Fixing the row above resolves this too. | Medium — currently a dead-end click, just a less-broken one than before |
| Buyer Advisory narrative | **No new backend needed** — `buyer-advisory` is already a valid report type / narrative-preview target. | — (already real) |

---

## Cross-cutting

- None of `/api/appraisal/*`'s copy (recommendations, disclaimer) is genuinely role-neutral —
  it all currently reads as agent-flavored. If Valuer/Investor/Buyer reports should show
  role-appropriate text instead of "AGENT RECOMMENDATIONS" verbatim, that's real backend
  work (branch on a `role` param, or add sibling endpoints) rather than a frontend fix.
- Two existing mock endpoints (`/api/investor/roi-calculation`, `/api/buyer/affordability-calculation`)
  are recommended for **retirement**, not extension, once the frontend ports the real
  client-side calculators from figma. Flagging here so nobody spends backend effort "fixing"
  data shapes that are about to become unused.

---

## Phase 3 — Settings / Notifications / AI Copilot (all roles)

Companion to the Phase 3 remediation that wrapped these three routes in `VersionSwitch` and
built real v2 implementations (`frontend/src/v2/pages/dashboard/settings.tsx`,
`notifications.tsx`, `copilot.tsx`). Confirmed by reading `backend/src/routes/mock.routes.ts`:
only `GET /api/{role}/notifications` and `GET /api/{role}/notifications/unread-count` exist —
there is no PATCH/mark-read, dismiss, or delete-account endpoint anywhere in the backend.

| Area | Needed | Priority |
|---|---|---|
| Notifications mark-read / dismiss | New `PATCH /api/{role}/notifications/:id` (or a generic `/api/notifications/:id`) to persist read/dismissed state server-side. Currently `frontend/src/v2/features/dashboard/components/notifications/notification-store.ts` tracks this client-side only (localStorage, same pattern as the ROI/affordability scenario stores), so it doesn't sync across devices/sessions. | Medium |
| Notifications mark-all-read | Companion bulk endpoint (`PATCH /api/{role}/notifications/read-all`) once the above exists. | Medium |
| Delete Account | No endpoint exists (no `account.routes.ts`/controller, nothing in `mock.routes.ts`). v2 Settings' Delete Account flow (`settings-delete-account-dialog.tsx`) now shows a real confirm step but keeps the final destructive action disabled with an explanatory note ("isn't available yet — contact support") instead of the v1 bug (a silent `preventDefault()` no-op). Needs a real `DELETE /api/account` (or `/api/users/me`) with auth/session teardown. | High — currently the only way for a user to leave is via support |
| Settings — change password | No endpoint exists. `settings-sections.tsx`'s `SecuritySection` form is real (controlled inputs, show/hide, submit handler) but submitting shows an inline "isn't available yet" message rather than calling a nonexistent API. Needs `PATCH /api/account/password` (or equivalent) with current-password verification. | Medium |
| Settings — notification preferences / appearance (theme, language) | No backend field for either. Both are real, working, localStorage-backed via `settings-store.ts` (same module-var + localStorage pattern as `roi-scenario-store.ts`), so they work per-browser but don't sync across devices. Needs `UserPreferences`-shaped columns/table + `GET`/`PATCH /api/account/preferences` if cross-device sync is wanted. | Low |
| Settings — subscription / billing | No real billing backend (no Stripe/payment-provider integration, no plan/invoice models). v2's Subscription and Billing sections port the prototype's plan-tier display and payment-method/invoice-history *shape* as informational UI; "Upgrade"/"Switch Plan" link to `/plans`, "Cancel Plan" and invoice download are explicitly disabled/labelled as unavailable rather than faking a live billing action. This is a materially large feature (real payment provider integration) if ever pursued — not a small addition. | Low (net-new, no v1 equivalent to fix) |
| AI Copilot — real AI backend | **No real AI/chat backend exists at all.** `getCopilotConversations`/`getCopilotMessages`/`getCopilotSuggestions` (`services/common.ts`) are GET-only mock endpoints with no send-message endpoint. v1's chat input was literally non-functional (`readOnly`, no state); v2 now has a fully real controlled chat UI (typed input, conversation switching, New Conversation, suggestion cards, copy/thumbs/regenerate), but the AI *replies* are locally simulated via canned templates + a `setTimeout`, exactly mirroring what `figma-protoype_v2/src/app/components/AICopilotPage.tsx` itself does (it also has no real backend). The v2 UI copy was deliberately softened from v1's "Online · GPT-4 powered" (a false claim for scripted replies) to "Online · Demo responses". Wiring a real LLM-backed `/api/copilot/messages` (POST) endpoint, with actual property/market data grounding, is a **significantly larger feature** than everything else in this table — likely its own project (model choice, cost, prompt design, streaming, per-conversation persistence), not a quick backend addition. | High effort, flag separately from a normal backend task |
| AI Copilot — conversation persistence | Conversations/messages are in-memory only per page load (matches the prototype's own `useState`-only behaviour — it doesn't persist to storage either). If cross-session persistence is wanted, needs `Conversation`/`Message` models + CRUD, likely delivered alongside the real AI backend above rather than separately. | Low (tie to the AI backend item above) |

---

## Phase 4 — Agent / Valuer dashboard fixes

Companion to the Phase 4 remediation (KPI clickability, "This Week" widget, client edit,
Valuer KPI/quick-actions/Monthly Progress). Read-only findings below — no backend files were
modified.

| Area | Finding | Priority |
|---|---|---|
| Valuer KPI "Avg Valuation Value" / "Value Distribution" (figma: `ValuerDashboard.tsx` ~13-15, ~178-196) | Neither is reproduced in `valuer-home.tsx`. `GET /api/valuer/cases` (`VALUER_CASES` in `mock.routes.ts`) has no valuation amount/midpoint field on cases at all — only `id/address/suburb/clientName/status/purpose/confidence/updatedAt/hasWarning`. Used `confidence` instead to build a real "Avg Confidence Score" KPI in its place, and skipped the price-band "Value Distribution" chart entirely rather than fabricate numbers. This is the same gap the existing "Valuation Cases list" row above already flags (`New ValuationCase Prisma model... midpoint/range`) — once that model exists with a real amount field, both of these become buildable from real data. | High — same root cause as the existing Valuation Cases row |
| Valuer dashboard backend mock (`GET /api/dashboard/valuer`) | `DASHBOARD_DATA.valuer` in `mock.routes.ts` (stats: "Valuations in Review / Approved Reports / Low Confidence Cases / Pending Reports"; quickActions: "Generate Appraisal" + "Evidence Center") is a static, non-representative hardcoded payload — none of its 4 stats matched the figma design, and it isn't derived from `VALUER_CASES` or any other real collection. `valuer-home.tsx` no longer reads `dashboard.stats` or `dashboard.quickActions` for the KPI row / Quick Actions — both are now computed/defined client-side from `GET /api/valuer/cases` and a local constant list respectively. Recommend either deleting this dead stats/quickActions data once the frontend fully owns it, or wiring it to real data if another consumer still depends on it. | Medium |
| Agent/Valuer client "Generate Report" prefill | No backend change needed — `client-detail-panel.tsx`'s Generate Report button now calls the existing `setAppraisalInputContext()` (`services/common.ts`) with the client's address before navigating, the same mechanism already used elsewhere in the wizard. | — (frontend-only fix) |
| Client name / property address edit (Agent Clients page) | No backend change needed — `PATCH /api/clients/:id` already accepts `fullName`/`addressLine`/`suburb`/`state`/`postcode` (`updateClientSchema = createClientSchema.partial()` in `backend/src/validators/client.validator.ts`), so `client-detail-panel.tsx`'s new inline name/address editors call the existing endpoint directly — nothing here to add. | — (already real) |

---

## Phase 5 — Shared (Team Workspace / Property Timeline, all roles)

Companion to the Phase 5 remediation that built the two shared screens reachable from any
role's sidebar "Team" and "Timeline" nav items (wired in Phase 1 to `/dashboard/{role}/team`
and `/dashboard/{role}/timeline`): `frontend/src/v2/pages/dashboard/shared/team-workspace.tsx`
and `property-timeline.tsx`.

| Screen | Needed | Priority |
|---|---|---|
| Team Workspace | **Substantial net-new feature.** No org/team/membership model exists anywhere — `backend/prisma/schema.prisma` only has a `Role` model (per-user role like agent/valuer/investor/buyer, not agency membership), and `mock.routes.ts` has no "team"/"member"/"invite"/"review-queue"/"audit-log" routes at all. A real implementation needs: an `Agency`/`Organisation` model; a `TeamMembership` join model (user, agency, role-within-team e.g. Admin/Senior Valuer/Valuer/Agent, status Active/Invited, invited-by, joined-at) with its own permission matrix distinct from the four top-level `DashboardRole`s; a shared `ReviewQueue`/approval-workflow model (linking to `Report`/`ValuationCase`, assignee, status, priority, submitted-by); and an org-scoped `AuditLog` model (actor, action, target entity, detail, timestamp) — related to, but broader than, the Valuer-only `AuditEvent` model already flagged above (that one is per-case field edits; this one is org-wide activity: approvals, invites, permission changes, exports). v2 currently ports the figma prototype's illustrative 5-member roster, review queue, and audit log verbatim as local mock data — none of it is tied to the signed-in user or any real report/case. | High effort — likely its own project (org modeling, invite flow, permission system), not a quick addition |
| Property Timeline | Net-new per-address property-history data source. No sale-history / listing-history / title-transfer / renovation-record endpoint exists — `services/common.ts` and the wizard's comparable-sales/appraisal-summary endpoints return *current* comparable listings and suburb-level metrics, never a single address's own event history over time. A real implementation needs a `PropertyHistoryEvent` model (address, event type: sale/listing/ownership-transfer/renovation/market-event, date, price, source, and optionally AI-generated commentary) ideally sourced from a title/sales-history data provider (e.g. CoreLogic-style feed) rather than hand-entered. v2 currently seeds only the *subject address* from the real `getAppraisalInputContext()` store (so the header reflects whatever property the user was last working on); the actual timeline events, sale-price chart, and AI commentary remain the figma prototype's illustrative mock data, not tied to that address. | Medium — needs an external data source, not just a new table |

---

## Phase 5 — Watchlist / Market Comparison / Suburb Explorer / Compare Properties / Inspections

Companion to the Phase 5 remediation that built these 5 net-new screens: `frontend/src/v2/pages/dashboard/investor/watchlist.tsx` (`WatchlistPageV2`), `market-comparison.tsx` (`MarketComparisonPageV2`), `frontend/src/v2/pages/dashboard/shared-market/suburb-explorer.tsx` (`SuburbExplorerPageV2`, shared by Investor + Buyer nav), `frontend/src/v2/pages/dashboard/buyer/compare-properties.tsx` (`ComparePropertiesPageV2`), and `inspections.tsx` (`InspectionsPageV2`, covered in the Buyer table above).

Real data reused as-is: `/api/saved-properties` (Watchlist's Saved Properties tab, Compare Properties' picker, Inspections' property picker), `/api/investor/notifications` (Watchlist's Alerts tab), and `/api/appraisal/market-metrics` called per-suburb via a new `getMarketMetricsForAddress()` helper in `v2/services/common.ts` (Market Comparison, Suburb Explorer) — this endpoint is deterministic per `suburb+postcode` (`backend/src/routes/mock.routes.ts`'s `buildMarketMetrics()`), so calling it with different synthetic addresses gives real, distinct, backend-computed numbers per suburb without needing a new endpoint.

| Screen | Needed | Priority |
|---|---|---|
| Watchlist — Saved Suburbs | No backend model exists (checked `backend/prisma/schema.prisma` — only `SavedPropertySearch`, no suburb-level saved-item table). Figma's seed data (median price/growth/yield/demand per saved suburb) was not ported — the tab shows an honest "not available yet" panel instead. Needs a `SavedSuburb { userId, suburb, state, postcode, createdAt }` model + CRUD, then real growth/yield figures can come from the same `market-metrics` endpoint per saved suburb. | Medium |
| Watchlist — Saved Searches | No search-history backend model or frontend service exists (checked `services/common.ts`, `services/investor.ts` — nothing search-history-shaped). Figma's seed data (saved query text + result count) was not ported — honest "not available yet" panel instead. Needs a `SavedSearch { userId, queryText, filters (json), resultCount, createdAt }` model + a way to actually re-run a stored filter set against `/api/buyer/properties/search` or an equivalent investor search endpoint (neither currently accepts rich filter params — see the existing "Property Search" row above). | Low |
| Watchlist — AI Recommendations banner | Figma's banner (3 suburbs with fabricated 92/87/84 "AI scores" and reasons) was not ported — no recommendation engine or per-user preference model exists to generate it honestly. If wanted, this is a real feature (needs user investment-preference data + a scoring model), not a quick addition. | Low |
| Market Comparison — full radar dimensions | Figma's radar chart has 6 axes (Growth, Yield, Low Vacancy, Clearance Rate, Population Growth, Supply Constraint). Only 2 of those (growth, yield) map to real data via `market-metrics`; vacancy rate, auction clearance rate, population growth, and supply/building-approval data don't exist anywhere in this repo. Shipped radar uses 4 axes built entirely from real `market-metrics` fields (12-month growth, monthly growth, rental yield, days-on-market-inverted) instead of fabricating the other 4. A real suburb-statistics data source (REIV/ABS/CoreLogic-style feed) would be needed to add the rest. | Low — cosmetic completeness only, current version is honest |
| Suburb Explorer — Rental Market / Supply & Demand / Demographics / Forecast / Risks tabs | Same root cause as Market Comparison above — no vacancy-rate, auction-clearance, population, supply-pipeline, or forecast dataset exists. These 5 of the prototype's 7 tabs are collapsed into a single "More Insights" tab that explains the gap rather than porting the prototype's fabricated charts (rental yield/vacancy dual-line chart, demographic bars, forecast ranges, risk-factor scores — all static numbers unconnected to any real address in the original figma component). | Medium — the richest tabs in the original design, needs the same external suburb-statistics feed as above |
| Suburb Explorer / Market Comparison — suburb search | No suburb-autocomplete/lookup endpoint exists (only free-text address parsing in `mock.routes.ts`'s `parseAddress()`). Both pages use a fixed list of ~6 real Australian suburbs rather than a live search-as-you-type experience. A real suburb gazetteer/autocomplete endpoint would remove this limitation. | Low |
| Compare Properties — price/fairness/commute/school/yield rows | The real `SavedPropertyRow` type (`/api/saved-properties`) only carries address/type/beds/baths/land/createdAt — no price, estimated valuation range, price-fairness verdict, commute time, nearest-school distance, rental yield, or buyer-demand fields exist for a saved property anywhere in this repo. Figma's comparison table (and its fabricated "AI Buyer Summary" paragraph synthesising all of the above) was not ported — the shipped table only compares the fields that are actually real. Extending `SavedPropertySearch` with a valuation snapshot at save-time (linking to the comparable-sales estimate already computed when the property was saved) would unlock the richer comparison. | Low — net-new page, no v1 equivalent |
