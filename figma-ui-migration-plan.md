# Figma Prototype → Real Frontend UI Migration Plan (Append-Only, Toggle-Switchable)

## 1. Goal

Port polished screens/components from `figma_prototype` into `frontend` without touching existing working code, and with a runtime toggle to instantly fall back to the current design if the new UI misbehaves.

Hard constraints from discussion:
1. **Append-only** — no existing page, component, or route logic gets rewritten in place.
2. **Reversible at runtime** — switching from new UI back to current UI must not require a rebuild/redeploy.
3. **Same folder conventions** — new code follows the existing `pages/ features/ components/ services/` pattern, just under a parallel namespace.

---

## 2. Confirmed Constraints

1. Do not modify existing files in `frontend/src/pages`, `frontend/src/features`, `frontend/src/components`, `frontend/src/services`, or `frontend/src/routes/index.tsx` beyond the minimal, mechanical touch points listed in §4.3.
2. `figma_prototype` code is a static/mock reference only — no local mock state gets carried over; every ported page must eventually read from `frontend/src/services/*` (real backend) or `features/dashboard/mock/*` (MSW), matching how existing pages already work.
3. New third-party dependencies (Radix, `motion`, `recharts`, `react-hook-form`, etc.) are added only as needed per component, not wholesale.
4. The toggle must be flippable by a developer/QA at runtime (browser storage or URL param), not just at build time.

---

## 3. Current State Snapshot

### 3.1 `figma_prototype` — screens available to port

| Area | Screens |
|---|---|
| Public/marketing | Hero, FeaturesBento, PremiumIntelligenceSuite, TransparentIntelligence, PropertyComparison, InvestmentDashboard, PropertyIntelligenceMap, VisualInsights, MarketInsights, Pricing, Contact, Terms, Privacy, Refund |
| Agent | Generate Appraisal, Comparable Sales, Saved Properties, Client Reports, Clients, Market Insights |
| Valuer | Valuation Cases, New Valuation, Evidence Centre, Audit Trail, Explainable AI |
| Investor | Suburb Explorer, ROI Calculator, Market Comparison, Investment Reports, Portfolio |
| Buyer | Property Search, Compare Properties, Affordability Calculator, Inspections, Buyer Reports |
| Shared | AI Copilot, Notifications, Settings, Property Timeline, Team Workspace, Watchlist |

All of it is static: local `useState` in `App.tsx`, no `fetch`, canned AI Copilot transcript, `setTimeout`-faked loading states.

### 3.2 `frontend` — existing routes (from `frontend/src/routes/index.tsx`)

```
/                                  Landing
/plans, /about, /features
/signin, /signup, /forgot-password
/dashboard/:role                  DashboardRoleHome
/dashboard/:role/valuation-cases
/dashboard/:role/clients
/dashboard/:role/report           (role-branches: Agent/Investor/Valuer/Buyer report)
/dashboard/:role/evidence-centre
/dashboard/:role/search-properties
/dashboard/:role/saved
/dashboard/:role/settings
/dashboard/:role/copilot
/dashboard/:role/roi-calculation
/dashboard/:role/affortability-calculation
/dashboard/:role/notifications
/dashboard/:role/generate-report
/dashboard/:role/mock
```

UI kit today is bespoke Tailwind components in `frontend/src/components/ui/` (custom `Button`, `Card`, `Table`, etc. using `relaive-*` brand tokens) — **not** shadcn/Radix. Data comes from `frontend/src/services/*.ts` (real backend) or MSW handlers (`features/*/mock/`).

### 3.3 Page mapping — figma screen → existing route → gap?

| Figma screen | Existing real route | Status |
|---|---|---|
| Agent: Generate Appraisal | `/dashboard/agent/generate-report` | Exists — reskin |
| Agent: Clients / Client Reports | `/dashboard/agent/clients`, `/dashboard/agent/report` | Exists — reskin |
| Agent: Comparable Sales | — | **Gap — new page** |
| Agent: Saved Properties | `/dashboard/agent/saved` (currently buyer-only in code) | Needs generalizing |
| Agent: Market Insights | — | **Gap — new page** |
| Valuer: Valuation Cases | `/dashboard/valuer/valuation-cases` | Exists — reskin |
| Valuer: Evidence Centre | `/dashboard/valuer/evidence-centre` | Exists — reskin |
| Valuer: New Valuation | overlaps `generate-report` | Reuse generate-report v2 |
| Valuer: Audit Trail, Explainable AI | — | **Gap — new pages** |
| Investor: ROI Calculator | `/dashboard/investor/roi-calculation` | Exists — reskin |
| Investor: Investment Reports | `/dashboard/investor/report` | Exists — reskin |
| Investor: Suburb Explorer, Market Comparison, Portfolio | — | **Gap — new pages** |
| Buyer: Property Search | `/dashboard/buyer/search-properties` | Exists — reskin |
| Buyer: Affordability Calculator | `/dashboard/buyer/affortability-calculation` | Exists — reskin |
| Buyer: Buyer Reports | `/dashboard/buyer/report` | Exists — reskin |
| Buyer: Compare Properties, Inspections | — | **Gap — new pages** |
| Shared: Copilot | `/dashboard/:role/copilot` | Exists — reskin |
| Shared: Notifications | `/dashboard/:role/notifications` | Exists — reskin |
| Shared: Settings | `/dashboard/:role/settings` | Exists — reskin |
| Shared: Property Timeline, Team Workspace, Watchlist | — | **Gap — new pages/routes** |

Roughly two-thirds of the figma screens map onto pages that already exist (reskin work); the rest are net-new routes, which are naturally append-only since there's nothing to conflict with.

---

## 4. Architecture Decision

### 4.1 Parallel `v2` namespace (append-only, same folder pattern)

Add one new top-level folder that internally mirrors the existing structure:

```
frontend/src/v2/
  pages/dashboard/<role>/<page>.tsx     (mirrors frontend/src/pages/dashboard/...)
  features/dashboard/components/...     (mirrors frontend/src/features/dashboard/...)
  features/dashboard/mock/...
  components/ui/...                     (new shared UI atoms, only if bespoke kit can't cover it)
  services/...                          (only if new endpoints are needed; otherwise reuse existing services/*)
```

Nothing under `frontend/src/pages`, `features`, `components`, `services` (v1) is edited. `v2/` is purely additive — deleting the whole folder is a full, instant rollback of everything ported so far.

### 4.2 Version toggle

- `frontend/src/v2/version-toggle.ts` (new): reads/writes a flag, source of truth is `localStorage['relaive_ui_version']` (`'v1' | 'v2'`, default `'v1'`), with a one-time override from `?ui=v2` in the URL on first load (for shareable QA links).
- `frontend/src/v2/VersionSwitch.tsx` (new): a small component — `<VersionSwitch v1={<OldPage/>} v2={<NewPage/>} />` — renders whichever the flag says.
- `frontend/src/v2/VersionToggleControl.tsx` (new): a small floating control (visible to devs/QA, e.g. gated behind a `?debug=1` param or only in non-prod builds) to flip the flag without editing localStorage by hand.

### 4.3 The only two touches to existing files

These are mechanical, reviewable, one-purpose edits — no business logic changes:

1. **`frontend/src/routes/index.tsx`** — for each route being migrated, wrap the existing element:
   ```tsx
   // before
   <Route path="generate-report" element={<GenerateReport />} />
   // after
   <Route path="generate-report" element={<VersionSwitch v1={<GenerateReport />} v2={<GenerateReportV2 />} />} />
   ```
   Routes with no v2 counterpart yet are left completely untouched.
2. **One mount point** (e.g. `frontend/src/layouts/DashboardLayout` or `App.tsx`) — add a single import + render line for `<VersionToggleControl />` so the switch is reachable in the UI.

Everything else — new pages, new components, new mock handlers — is 100% new files.

### 4.4 Design system for v2 (open decision)

Two options, pick before Phase 1:

- **A — Extend the existing bespoke kit** (`frontend/src/components/ui` styles/tokens copied into `v2/components/ui`, enhanced to match figma's visual polish). Lower dependency risk, more manual work per component.
- **B — Adopt select Radix primitives** (only ones actually needed — e.g. Dialog, Popover, Combobox — not the full shadcn set, and skip MUI/emotion entirely) alongside `motion` for animation and `recharts` for charts, which the current app doesn't have.

Recommendation: **A for basic elements (buttons, cards, inputs, tables) to keep bundle size/style consistency; B selectively for the few interactions the bespoke kit can't do (modals, comboboxes) plus `recharts` for chart-heavy pages (ROI calculator, market insights).**

✅ Agreed.

### 4.5 Shared core components for "wizard step + standalone page" duplicates

Figma builds several features twice — once as a compact step inside the appraisal wizard (`GenerateAppraisalPage.tsx`), and again as a full standalone page — with two separate, hand-duplicated implementations rather than one shared component. Confirmed instances:

| Wizard step (in `GenerateAppraisalPage.tsx`) | Duplicate standalone page (figma) | Role |
|---|---|---|
| Step 2: "Comparable Sales" | `ComparableSalesPage.tsx` | Agent / Investor / Buyer |
| Step 2: "Evidence Centre" (same step component, title swapped via an `isValuer` flag) | `EvidenceCentrePage.tsx` | Valuer |
| Step 3: "Market Intelligence" | `MarketIntelligencePage.tsx` | All roles |
| Step 4: "ROI Analysis" | `ROICalculatorPage.tsx` | Investor only |
| Step 4: "Affordability" | `AffordabilityPage.tsx` | Buyer only |

(Note: `MarketInsights.tsx` is a *different* file — a public marketing-page section shown to logged-out visitors, unrelated to the dashboard "Market Intelligence" feature above. It is out of scope for role dashboards.)

**Rule for v2: never port these as two separate files.** For each row above, build:

1. **One shared "core" presentational component** — e.g. `ComparableSalesView`, `MarketIntelligenceView`, `RoiAnalysisView`, `AffordabilityView` — that takes the data as props plus a `variant: 'compact' | 'full'` flag, and owns the actual layout/markup once.
   - Location: `frontend/src/v2/features/dashboard/components/<topic>/<Topic>View.tsx`.
2. **Two thin wrapper components**, each only responsible for its own data-fetching and surrounding chrome/actions:
   - Wizard-step wrapper — reuses the address/suburb already captured earlier in the wizard, renders `<Topic View variant="compact" />` plus Back/Continue buttons. Location: `frontend/src/v2/features/dashboard/components/generate-report/<topic>-panel.tsx` (mirrors the existing v1 panel location).
   - Standalone-page wrapper — has its own search/filter UI to pick an address/suburb, renders `<TopicView variant="full" />` plus page chrome (breadcrumbs, save actions, etc.). Location: `frontend/src/v2/pages/dashboard/<role>/<topic>.tsx`.

Applies immediately to Comparable Sales and Market Intelligence for the Agent role (§9, since the real app's wizard steps for these already exist and standalone pages are being added new). Evidence Centre, ROI Analysis, and Affordability follow the same rule when their turn comes in the Valuer/Investor/Buyer phases.

---

## 5. Implementation Phases

### Phase 0 — Scaffold (infra only, no visual change)
1. Create `frontend/src/v2/` skeleton folders.
2. Build `version-toggle.ts`, `VersionSwitch.tsx`, `VersionToggleControl.tsx`.
3. Wire the one mount point for the toggle control.
4. Verify: toggling the flag does nothing yet (no v2 pages exist), confirming zero regression risk.

### Phase 1 — Pilot page
1. Pick one page to prove the pattern end-to-end — suggest `generate-report` (highest-value, most visually rich in figma) or `notifications` (simplest, lowest risk) as the first pilot.
2. Build `v2/pages/dashboard/<role>/<page>.tsx`, rewire its data to existing `services/*` (no local mock state).
3. Wrap its route with `VersionSwitch`.
4. Validate both v1 and v2 render correctly via the toggle; only then proceed.

### Phase 2 — Reskin existing-route pages (the "Exists — reskin" rows in §3.3)
Port role by role (Agent → Valuer → Investor → Buyer), reusing shared v2 UI atoms as they accumulate.

### Phase 3 — New pages (the "Gap" rows in §3.3)
Add net-new routes (Comparable Sales, Suburb Explorer, Audit Trail, etc.) — purely additive since there's no v1 counterpart to switch against; these can ship straight to v1 routes once stable, or stay behind the same toggle for consistency.

### Phase 4 — Data wiring pass
For every ported page, confirm it's calling real `services/*`/MSW and not any leftover figma mock data.

### Phase 5 — Stabilize & decide cutover
Once v2 has been validated (manually, and ideally by a few real users flipping the toggle), decide: keep both permanently behind the toggle, or promote v2 to be the default and eventually delete v1 + the toggle scaffold.

---

## 6. Risks and Mitigations

1. **Two design systems living side by side temporarily.** Mitigation: keep v2 components scoped to `v2/components/ui`, never imported into v1 pages.
2. **Toggle control shipping to production accidentally.** Mitigation: gate `VersionToggleControl` visibility behind a dev/QA flag (env var or `?debug=1`), default hidden.
3. **New dependencies bloating bundle size.** Mitigation: add Radix/`motion`/`recharts` incrementally per component, not as a bulk install; check bundle impact after each addition.
4. **Drift between v1 and v2 route trees** as new routes get added only to v2. Mitigation: §3.3 table kept up to date as the single source of truth for what's ported vs. gap.

---

## 7. Rollback Plan

- **Per-page:** flip the toggle back to `v1` — instant, no deploy.
- **Full abandonment:** delete `frontend/src/v2/`, revert the small `VersionSwitch` wraps in `routes/index.tsx`, remove the toggle mount line. Since v1 was never edited, this is a clean, low-risk revert.

---

## 8. Next Execution Order

1. Confirm design-system decision (§4.4). ✅ Agreed — Option A (extend bespoke kit) for buttons/cards/inputs/tables; Option B (selective Radix + `recharts`) only where the bespoke kit can't do the job.
2. Confirm shared-component rule for step/page duplicates (§4.5). ✅ Agreed.
3. Build Phase 0 scaffold.
4. Ship Phase 1 pilot page, validate toggle behavior manually.
5. Proceed through Phase 2 role by role — **starting with Real Estate Agent, detailed in §9.**

---

## 9. Real Estate Agent Role — Detailed Plan

Scope: the agent-related figma screens, ported one at a time into `frontend/src/v2/pages/dashboard/real-estate-agent/`, each behind its own `VersionSwitch`. Comparable Sales and Market Intelligence follow the shared-component rule from §4.5 rather than being separate files.

### 9.1 Screen-by-screen mapping

| Figma source (`figma_prototype/src/app/components/`) | Size | v1 target (`frontend/src/pages/dashboard/...`) | v2 target (`frontend/src/v2/...`) | Data source today |
|---|---|---|---|---|
| `AgentDashboard.tsx` | 217 lines | `real-estate-agent/agent-dashboard.tsx` (currently a 5-line wrapper around shared `RoleDashboardView`) | `pages/dashboard/real-estate-agent/agent-home.tsx` | `features/dashboard/mock/dashboard-mock-data.ts` via `RoleDashboardView` — needs an agent-specific v2 view since v1 is a shared cross-role component |
| `ClientsPage.tsx` | 678 lines | `real-estate-agent/client-agent.tsx` (196 lines, already wired to real data) | `pages/dashboard/real-estate-agent/clients.tsx` | **Real** — `services/agent.ts` → `/api/clients`, `/api/reports` (Prisma-backed) |
| `ClientReportsPage.tsx` | 239 lines | `real-estate-agent/agent-report.tsx` (60 lines) | `pages/dashboard/real-estate-agent/agent-report.tsx` | **Real** — same `/api/reports` via `getAgentReportListMockData` in `services/agent.ts` |
| `GenerateAppraisalPage.tsx` (Step 1 + Step 5 only — Steps 2/3 covered below) | 2050 lines total | `dashboard/generate-report.tsx` (shared across roles) + `features/dashboard/components/generate-report/` panels | `features/dashboard/components/generate-report/` (mirrors existing 4-panel structure) | Mixed — steps 1–3 are backend mocks (`mock.routes.ts`), step 4/final narrative is real (Groq) |
| `GenerateAppraisalPage.tsx` Step 2 ("Comparable Sales") + standalone `ComparableSalesPage.tsx` | 277 lines (standalone page alone) | wizard: `ComparablesPanel` in `features/dashboard/components/generate-report/`; standalone: *none yet* | **Shared core**: `features/dashboard/components/comparable-sales/ComparableSalesView.tsx`; wrappers: `features/dashboard/components/generate-report/comparables-panel.tsx` (compact) + `pages/dashboard/real-estate-agent/comparable-sales.tsx` (full, new route) | Backend mock (`/api/appraisal/comparable-sales`) for both |
| `GenerateAppraisalPage.tsx` Step 3 ("Market Intelligence") + standalone `MarketIntelligencePage.tsx` | figma page not yet sized | wizard: `MarketIntelligencePanel` in `features/dashboard/components/generate-report/`; standalone: *none yet* | **Shared core**: `features/dashboard/components/market-intelligence/MarketIntelligenceView.tsx`; wrappers: `features/dashboard/components/generate-report/market-intelligence-panel.tsx` (compact) + `pages/dashboard/real-estate-agent/market-intelligence.tsx` (full, new route) | Backend mock — needs a suburb-lookup endpoint for the standalone page's search (wizard version already gets suburb from Step 1) |

### 9.2 Comparable Sales & Market Intelligence — resolved as standalone pages (§4.5 applied)

Per §4.5: build one shared core view per topic, reused by both the existing wizard step and the new standalone page. No duplicate files. The standalone pages are net-new routes, so they carry no risk to existing wizard behavior — the wizard's `comparables-panel.tsx`/`market-intelligence-panel.tsx` wrappers simply start rendering the shared core component internally instead of their own markup.

### 9.3 Route changes (`frontend/src/routes/index.tsx`)

Only existing agent routes get wrapped; two new routes are pure additions (nothing to wrap):

```tsx
<Route index element={<VersionSwitch v1={<DashboardRoleHome />} v2={<AgentHomeV2 />} />} />        // agent only — v2 checks role internally, falls back to v1 for other roles until they're migrated
<Route path="clients" element={<VersionSwitch v1={<ClientAgent />} v2={<ClientsV2 />} />} />
<Route path="report" element={<VersionSwitch v1={<DashboardReport />} v2={<AgentReportV2 />} />} /> // same role-gating caveat as index
<Route path="generate-report" element={<VersionSwitch v1={<GenerateReport />} v2={<GenerateReportV2 />} />} />
<Route path="comparable-sales" element={<ComparableSalesPageV2 />} />   {/* new route, no v1 counterpart */}
<Route path="market-intelligence" element={<MarketIntelligencePageV2 />} />  {/* new route, no v1 counterpart */}
```

**Implementation note (from building the pilot):** the `index` role-home route isn't rendered directly in `routes/index.tsx` — it goes through `DashboardRoleHome` in `pages/dashboard/index.tsx`, which internally picks a lazy per-role component (`LAZY_ROLE_VIEWS[roleParam]`). So the `VersionSwitch` wrap for the index route lives inside `DashboardRoleHome` itself (gated to `roleParam === 'agent'`), not in `routes/index.tsx`. Same spirit (one small, mechanical, revertible wrap), different exact file. `routes/index.tsx` itself remains untouched so far.

### 9.4 Suggested execution order within the Agent role

1. ✅ **Pilot: `agent-home.tsx`** — shipped. `frontend/src/v2/pages/dashboard/real-estate-agent/agent-home.tsx` built, reusing the existing `StatCard`/`Card`/`RecentReportsPanel`/`dashboard-icons` components (no new deps) and 100% real data (`services/dashboard.ts`, `services/agent.ts`). Adds a Quick Actions row and a real Client Pipeline panel (grouped from actual client statuses) that v1 didn't have. Verified in a real browser: toggle appears behind `?debug=1`, flips v1 ↔ v2 instantly, zero console errors. Touched exactly one existing file (`pages/dashboard/index.tsx`) for the two mount points described in §9.3's implementation note.
2. ✅ **`clients.tsx`** — shipped. Reuses v1's `ClientTable`/`DataTable` unchanged (search + tabs), and adds real functionality v1 didn't have: an inline stage-change dropdown (`ClientStageDropdown`), an "Add Client" flow (`AddClientModal`, calling the backend's already-existing but previously-unused `POST /api/clients`), and inline contact editing in the detail panel (`ClientDetailPanel`, calling `PATCH /api/clients/:id`). New v2-only service file `v2/services/agent.ts` adds `createClient`/`updateClient` (v1's `services/agent.ts` untouched). **Backend fix along the way:** `client.validator.ts`'s status enum only accepted 2 of the 5 real `ClientStatus` values (`prospecting`/`appraisal_sent`) — a plain `String` column with an incomplete validator, not an intentional constraint — broadened to all 5 with user sign-off before building the stage dropdown. Verified in a real browser end-to-end: added a client, changed its stage through all 5 values, edited contact info, added a note — all persisted via real API calls, zero console errors.
3. ✅ **`agent-report.tsx`** — shipped. `frontend/src/v2/pages/dashboard/real-estate-agent/agent-report.tsx` reskins the report list as figma-style cards (property icon, title, client/suburb/relative-time, estimated value, beds/baths/land, real status badge) plus a working sort toggle and search — all client-side over real data. New `getAgentReportCards()` in `v2/services/agent.ts` reads the same `/api/reports` endpoint v1 already calls but keeps fields v1's `CaseItem` mapping drops (`estimatedValue`, `bedrooms`, `bathrooms`, `landSizeSqm`). Deliberately **did not** port figma's "mark as sent" status dropdown — it was local-only fake state in the prototype with no backend field to persist it against, so status stays derived from real data (`pdfStoragePath`/`clientEmail`/`clientName` presence → exported vs draft), same rule v1 already followed. Verified live: created a real draft report via the backend API, confirmed it renders correctly in v2 with accurate real fields, and exercised sort/search/tabs — zero console errors.
4. ✅ **Shared core: `ComparableSalesView` + `MarketIntelligenceView`** — shipped, then **corrected**. First pass built `MarketIntelligenceView` from v1's existing wizard panel (Suburb Overview list + Demand Signals bars) instead of studying figma's actual source — wrong reference file. Re-read `GenerateAppraisalPage.tsx` Step 3 and the standalone `MarketIntelligencePage.tsx` in full and found both figma versions actually use the *same* pattern (metric cards with trend arrows + a 12-month price-trend area chart), just at different sizes — meaning the shared-core approach was right, the content inside it was wrong. Rebuilt `market-intelligence-view.tsx` accordingly, using `recharts` (§4.4 Option B, now installed). `ComparableSalesView` was checked against figma too and was already faithful — no change needed there.
5. ✅ **Wire the two new standalone routes** — shipped. `comparable-sales` and `market-intelligence` added as net-new routes (no `VersionSwitch` needed, no v1 counterpart). **One additional real touch:** the sidebar already had a "Comparable Sales" nav item that silently fell through to the `/mock` placeholder page (dead link) — `dashboard-navbar.tsx`'s `handleNavChange` got two new `else if` branches (gated on `uiVersion === 'v2'`, so v1's fallback-to-`/mock` behavior is provably unchanged — verified live) to actually route it, plus a new "Market Intelligence" nav entry added to the agent nav section.
6. ✅ **`generate-report.tsx` wizard reskin** — shipped, then **fully corrected**. The original call to reuse v1's `PropertyInputPanel` unchanged for step 1 was wrong: figma's actual Step 1 (filled `#EEF3F7` inputs, +/- spinner counters for beds/baths/car, pill property-type selector, no "choose input method" gate) looks nothing like v1's bordered-input/datalist form. Rebuilt as `v2/features/dashboard/components/generate-report/property-input-panel.tsx`, still backed by the real `getPropertyTypeOptions()` data. Step 4 was also rebuilt — see below — closing what had been an open gap.

**Step 4 rebuild (Report Type → Generated Report):** figma splits this into two steps; kept as one macro wizard step (same 4-step stepper/URL contract as v1, `?step=4` links elsewhere keep working) with an internal phase switch, to avoid touching the shared stepper contract. `report-type-step.tsx` shows a single role-locked report card ("Vendor Appraisal", no picker — figma auto-selects by role, unlike v1's 4-option `OptionCardGroup`) with a "Generate Report" button. `vendor-appraisal-report.tsx` is the actual document: dark gradient header banner (title, prepared-by/date, 4 key stats), then `SectionDivider`-separated sections — Executive Summary (the real Groq-generated narrative, or static fallback, same as v1 used), Property Description (prose + a value-adding-factors checklist), Market Analysis (3 stat tiles), **Comparable Sales Evidence** (a data table with an average-price row — reuses the exact same `getComparableSales()` data as wizard step 2), **Valuation Assessment** (a range bar, matching figma's own static 15%/15%-inset visual — figma's bar isn't data-positioned either), Campaign Strategy (3 cards from real `getAgentRecommendations()` data), and Agent Certification (the logged-in user's real name via `useAuth()`, plus figma's fixed certification/licensing copy). `report-configuration-panel.tsx` orchestrates the two phases and reuses v1's `SendReportCard` and `persistGeneratedReport()` unchanged for Export PDF / Send to Client — same real persistence as before, just presented inside the new document layout.

Verified live end-to-end: ran the full wizard from the new Step 1 through the new Step 4, confirmed the Report Type screen matches figma (single locked card, checkmark), and confirmed the generated document renders correctly — real narrative text referencing the actual comparable addresses/prices, real market stats, the comparables table with a correct average, the range bar, campaign cards, and the real logged-in user's name in the certification block. Zero console errors throughout.

### 9.5 New/changed dependencies expected for this role

- `recharts` was added (§4.4 Option B) — needed once `MarketIntelligenceView` was corrected to match figma's actual chart-based pattern. Everything else (Clients, Comparable Sales, Property Input, the report document) was buildable with the extended bespoke kit (§4.4 Option A), no further new deps.

### 9.6 Real Estate Agent role — status: shipped, live, and fully verified against figma

Dashboard, Clients, Client Reports, the Generate Appraisal wizard, and Comparable Sales (standalone page) are all verified against figma's actual source, including the two gap sets logged in §9.7 (processing overlay + report action bar; Comparable Sales filters/Subject Property card/real Save/row style), now fixed and re-verified live. **Lesson learned mid-migration, worth carrying into every future role:** always read the actual figma source file in full — start to finish, including the outer orchestrator component, not just the sub-components that looked relevant — before building its v2 counterpart. Multiple corrections this session (Market Intelligence, the wizard's Property Input step, and the §9.7 gaps) all traced back to building from a partial read or an assumption instead of the full file. Next: move on to Valuer/Investor/Buyer (§5 Phase 2 continued) using the same (now-corrected) shared-core approach — each has its own step+page duplication pairs already catalogued in §4.5 (Evidence Centre, ROI Analysis, Affordability).

### 9.7 Known gaps — status: both fixed (2026-08-23)

Both items below were found by re-reading figma's source files in full and comparing against the shipped v2 code, then fixed in a follow-up session against the exact instructions that used to live here. Kept below (marked done) as a record of what changed and why; file paths and figma line numbers are still accurate if a future audit needs to re-verify against source.

#### A. Generate Appraisal wizard — ✅ fixed

1. **Processing overlay** — added `frontend/src/v2/features/dashboard/components/generate-report/processing-overlay.tsx` (`ProcessingOverlayV2`), matching figma's spinner + title + `AI_STEPS.agent` checklist. Wired into `report-configuration-panel.tsx` as a new `'generating'` phase between `'type'` and `'report'` (`ReportTypeStep`'s `onGenerate` now sets `'generating'` instead of jumping straight to `'report'`). The first 4 steps advance on the same decorative delays as figma; the last step ("Finalising report…") holds via a `dataReady` prop until all of the panel's real `useAsyncData` calls (summary/narrative/factors/recommendations/disclaimer/comparables) have resolved, then reveals the document — verified live that the document never appears before the real Groq-backed narrative has actually loaded.
2. **Report action bar** — added the figma-style bar above `<VendorAppraisalReport>`: **← Back**, **Generate another report** (calls a new `onGenerateAnother` prop threaded from `v2/pages/dashboard/generate-report.tsx`, which resets `currentStep` to 0), a spacer, **Send to Client** (the existing `SendReportCard` toggle, moved up from below the document to match figma's order), and a plain **Save Report** button (calls the existing `saveReport({})` helper with no `markAsExported`, flips to a "✓ Saved" state). The pre-existing **Export PDF** button (real functionality with no figma equivalent, `markAsExported: true`) was kept as its own row below the document rather than removed.
3. Minor decorative-spinner item (Step 2) — left as-is, still judged a non-issue per the original note.

Verified live (Playwright): wizard address 45 Park Ave, Richmond VIC 3121 → processing overlay ticks through all 5 steps and holds correctly → generated document shows Back/Generate-another/Send-to-Client/Save-Report bar → clicking Save Report flips to "✓ Saved" → clicking Generate another report resets the wizard to a blank Property Details step 1. Zero console errors.

#### B. Comparable Sales standalone page — ✅ fixed

Files touched: `frontend/src/v2/pages/dashboard/real-estate-agent/comparable-sales.tsx`, the shared core `frontend/src/v2/features/dashboard/components/comparable-sales/comparable-sales-view.tsx`, new `frontend/src/v2/services/saved-properties.ts`, and additive fields on `frontend/src/v2/services/common.ts` / `backend/src/routes/mock.routes.ts` (see below).

1. **Filters** — added Date Range and Property Type `<select>` controls to the search card, matching figma. Real, not decorative: Property Type filters client-side on a new `propertyType` field the backend mock now echoes onto each comparable (see item 4); Date Range parses the real `soldAgo` ("N weeks ago") string and excludes rows older than the selected window. Backend endpoint itself wasn't changed to accept the filters as query params — filtering happens client-side over the real fetched array, per the "if not, add as real client-side filters" fallback in the original instructions.
2. **Subject Property card** — added, matching figma's highlighted/bordered card with gradient accent strip. Beds/baths/land/type line is sourced live from `getAppraisalInputContext()` (omits any field that's genuinely unset, rather than hardcoding figma's fixed "3 bed · 2 bath · 430m²"). **Save Property is real**: new `frontend/src/v2/services/saved-properties.ts` posts to the backend's existing `SavedPropertySearch` model via `POST /api/saved-properties` (same contract as `backend/src/validators/saved-property.validator.ts` / `saved-properties.controller.ts`, previously wired to no frontend flow at all — v1's Buyer "Saved Properties" page actually calls a different mock endpoint, `/api/buyer/properties/saved`, not this real CRUD router). Verified the click produces an actual persisted row in the `SavedPropertySearch` table (checked via Prisma client directly, not just the UI's "✓ Saved" state). Scope stayed limited to the save action — no Agent-role review-saved-properties page was built, per the standing decision.
3. **Invented stats row removed** — the Comparable Sales count / Average Price / Average Match row is gone from `comparable-sales-view.tsx` entirely (both variants); figma never had it.
4. **Row layout style** — also fixed while touching this file (was marked lower-priority/optional). Rows now match figma's lean text-line pattern (address + suburb inline, "N bed · N bath · Nm² · Type" as one line, price + calendar icon + date on the right) instead of the old icon-badge stat groups. This required adding a `propertyType` field to comparables end-to-end: `backend/src/routes/mock.routes.ts`'s `ComparableSalePayload`/`createComparableSales` now include it (additive — the real subject property's type, echoed onto each comparable, not fabricated diversity), and a new v2-only `ComparableSaleV2` type + `getComparableSalesV2()` in `frontend/src/v2/services/common.ts` expose it without touching v1's `ComparableSale` type in `frontend/src/services/common.ts` (append-only — v1's service file is untouched). Both the standalone page and the wizard's compact `comparables-panel.tsx` wrapper were switched to `getComparableSalesV2()` so the one shared `ComparableSalesView` core keeps working for both variants.

Verified live (Playwright): searched 91 Church Street, Richmond VIC 3121 → Date Range/Property Type filters render and are wired → Subject Property card shows real address + beds/baths/land/type → Save Property → confirmed a real `SavedPropertySearch` row was created in the DB, button flips to "✓ Saved" → no stats row anywhere → comparable rows render in the lean figma style with property type included. Zero console errors.

#### A. Generate Appraisal wizard (`figma_prototype/src/app/components/GenerateAppraisalPage.tsx`)

Current v2 files: `frontend/src/v2/features/dashboard/components/generate-report/report-type-step.tsx` and `report-configuration-panel.tsx`.

1. **Missing: the "Generating Appraisal Report" processing overlay.** Figma (`GenerateAppraisalPage.tsx` lines 1806–1854, `ProcessingOverlay`) shows a dedicated animated screen between clicking "Generate Report" and seeing the document: a spinning ring, the title "Generating Appraisal Report", and a live checklist of `AI_STEPS.agent` (lines 168–176: "Searching comparable sales…", "Analysing suburb market data…", "Running valuation model…", "Generating appraisal narrative…", "Finalising report…") that tick off one by one with checkmarks. Figma times this with `setTimeout` (lines 1812–1825, ~900/700/1200/900/600ms per step, decorative). v2 currently just flips straight to the document with a bare "Preparing your report…" line while `useAsyncData` calls resolve.
   - **Fix:** add a `ProcessingOverlayV2` component reusing this checklist pattern, real transition: since v2's narrative fetch (`getNarrativePreview`) is a real network call (not a fixed mock delay), drive the checklist off actual load state rather than fixed timeouts where possible — e.g., advance through the first few steps on fixed short delays (decorative, matches figma) and hold on the last step ("Finalising report…") until the real `useAsyncData` calls actually resolve, then reveal the document. Wire it into `report-configuration-panel.tsx`'s phase state (add a `'generating'` phase between `'type'` and `'report'`).

2. **Missing/wrong: the report's action bar.** Figma (`GenerateAppraisalPage.tsx` lines 1669–1695) puts an actions bar *above* the report document: **← Back**, **Generate another report** (RefreshCw icon, resets wizard to step 1 — figma lines 1955–1971 `handleGenerateAnother`), a spacer, **Send to Client**, and **Save Report** (Bookmark icon → turns into a green "✓ Saved" state after saving, lines 1690–1694). v2's `report-configuration-panel.tsx` currently only has **Export PDF** and **Send to Client** *below* the document, no Back/Generate-another bar, and no plain "Save Report" (draft-save, distinct from Export PDF's `markAsExported: true`).
   - **Fix:** add the actions bar above `<VendorAppraisalReport>` in `report-configuration-panel.tsx`: a Back button (calls the existing `onBack` prop), a "Generate another report" button (needs a new callback threaded up to `v2/pages/dashboard/generate-report.tsx` to reset `currentStep` to 0 and clear the appraisal context), and a "Save Report" button that calls `saveReport({})` (no `markAsExported`) and flips to a "✓ Saved" state — `saveReport` already exists in the file, just isn't wired to a plain-save button yet.

3. **Minor, optional:** figma's wizard Step 2 (Comparable Sales) shows a decorative ~900ms spinner before revealing results even though data is instant (figma lines 383–386, 395–404). v2 shows the real async loading state instead. Judged a non-issue (more honest than a fake delay) — only fix if visual consistency with figma's motion feel matters more than that.

#### B. Comparable Sales standalone page (`figma_prototype/src/app/components/ComparableSalesPage.tsx` — read in full, all 278 lines)

Current v2 files: `frontend/src/v2/pages/dashboard/real-estate-agent/comparable-sales.tsx` and the shared core `frontend/src/v2/features/dashboard/components/comparable-sales/comparable-sales-view.tsx`.

1. **Missing: filters.** Figma (lines 106–138) has a **Date Range** dropdown (Last 3/6/12 months, 2 years) and a **Property Type** dropdown (All Types/House/Townhouse/Unit/Apartment), inside the same card as the search bar, below a divider. v2 has no filters at all.
   - **Fix:** add both `<select>` controls to `comparable-sales.tsx`'s search form. Check whether `/api/appraisal/comparable-sales` (backend `mock.routes.ts`) actually supports filtering by these — if not, these can still be added as real client-side filters over the fetched `ComparableSale[]` (or extend the mock endpoint to accept them, matching the existing pattern of query-param-driven mock data).

2. **Missing, and the biggest gap: the "Subject Property" card.** Figma (lines 171–219) shows a prominent highlighted card (gradient accent strip, bordered) right after searching, framing the searched address as *"Subject Property"* with an icon, a "3 bed · 2 bath · 430m² · House" summary line, and a **"Save Property"** button that turns into a "✓ Saved" pill (lines 199–216, `handleSave`). v2 jumps straight from the search bar to the comparables list — no subject-property framing, no save action.
   - **Fix:** add this card to `comparable-sales.tsx` between the search form and `<ComparableSalesView>`. The property detail line (beds/baths/land/type) should come from the real `AppraisalInputContext` (already available via `getAppraisalInputContext()`), not hardcoded like figma's fixed "3 bed · 2 bath · 430m²". **Decided (2026-08-23): the "Save Property" button must be real** — wire it to the backend's existing `SavedPropertySearch` Prisma model / `/api/saved-properties` routes (currently only wired to the Buyer role in v1 — check `services/buyer.ts` or the saved-properties routes/controller for the exact contract), a real POST that persists, not a fabricated local-only "saved" toggle. **Scope is the save action only** — building an Agent-role page to *review* saved properties afterward is explicitly out of scope for this fix (v1's `ROLE_NAV_SECTIONS.agent` has no "Saved" nav item, only Buyer does; leave that as a separate future item, don't build it as part of this fix).

3. **Remove: the invented stats row.** v2's `variant="full"` currently shows a summary row (Comparable Sales count / Average Price / Average Match) at the top of the results. **Figma's standalone page has no such stats row anywhere** — this was invented when `ComparableSalesView`'s `full` variant was built, not sourced from figma. Remove it from the `full` variant (check whether `compact` — the wizard step — should keep any equivalent; per the earlier full read of figma's wizard Step 2 comparable-sales rendering, it doesn't have this either, so it can likely be removed from both variants of `comparable-sales-view.tsx`).

4. **Row layout style differs.** Figma's comparable rows (lines 227–269) are lean horizontal lines: address + suburb inline, then "3 bed · 2 bath · 420m² · House" as one small text line (no icons), price + calendar-icon date on the right. v2's rows use icon-badge stat groups (bed/bath/parking/area icons, one per stat) wrapped across the row — bulkier and visually different, though not incorrect on data. Lower priority than gaps 1–3, but note it while touching this file.
