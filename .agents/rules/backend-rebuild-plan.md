# Backend Rebuild Plan

The backend was trimmed to authentication only. Every other feature needs to be rebuilt. This document has two parts: the procedure every task follows, and a task backlog (Part 2), which is filled in one ticket at a time as each is approved — do not add a ticket to Part 2 without approval first.

---

## Part 1 — Procedure

### Step 0 — Schema is designed in dependency order, not per-task

Before any ticket is written, the data models it needs must already exist in `backend/prisma/schema.prisma`, or be added as part of that ticket if it's foundational. Models are grouped by dependency level:

- **Level 0 (done):** `User`, `Role`
- **Level 1 (independent, depend only on User or nothing):** Client, Comparable Sale, Market Intelligence, Saved Property/Evidence, Notifications, Inspections
- **Level 2 (composite, depends on Level 1 existing):** Report — links to Client and Comparable Sale, stores a Market Intelligence snapshot
- **Level 3 (depends on Level 2 having real data):** AI Narrative Generation

A ticket for a Level 2 or 3 feature should not be started until the Level 1 models it depends on are already built and holding real data — otherwise it can only be tested against nulls or fakes.

### Step 1 — Add the schema model(s)

Add the new model(s) to `backend/prisma/schema.prisma`, following the existing style: an id field, `@map` on every field to a snake_case column name, `@@map` on the table to a plural snake_case name, an owner relation back to `User` if the data belongs to a specific person. Run a migration so the change reaches the actual database and the typed client regenerates.

### Step 2 — Write the data-access functions

Create a service file under `backend/src/services/` for this feature. This file is the only place allowed to import the database client directly. One function per operation — list, get one, create, update, delete as needed. Every function touching user-owned data takes the current user's id and filters or checks against it.

### Step 3 — Write the validation rules

Create a validator file under `backend/src/validators/`. Define the required and optional fields for each write operation using the same validation library already used elsewhere in the backend.

### Step 4 — Write business logic, only if there is any

Skip this unless there's a real decision being made beyond "save this row" — such as checking whether a related record already exists before creating a new one. Otherwise the controller calls the Step 2 service directly.

### Step 5 — Write the controller

Create a controller file under `backend/src/controllers/`. One function per endpoint: validate the request, read the current user's id (already available if the route requires authentication), call the service, respond. Every response follows the same envelope used elsewhere: a success flag, and either the data or an error message. Use the correct status code for what happened.

### Step 6 — Wire up the route

Create a route file under `backend/src/routes/` mapping URLs and methods to controller functions. Apply the authentication check to any route that needs to know who the user is. Register the route file in the central route file.

Every file created or meaningfully changed in Steps 1 through 6 must start with a short comment describing what the file is about — its role in the feature, not a restatement of the filename. One or two lines is enough; this isn't a full doc comment, just enough for someone opening the file cold to know what they're looking at before reading further.

### Step 7 — Connect the frontend

Check the frontend's existing service file for this feature — it was very likely already written against an expected shape before this backend work started. Make the real response match what that existing code already expects; only change frontend code if the shapes genuinely can't be reconciled.

### Step 8 — Confirm it actually works

The feature is done when the real frontend page, running against the real backend, shows real data instead of an error or empty state. Start both servers, log in, navigate to the page, watch it work. This is the actual finish line, not a written test suite.

---

## Conventions that apply to every feature

Every response follows the same envelope: a success flag, and either the requested data, or a message and field-level errors.

A logged-in request proves who it is with a bearer token in the authorization header. Once checked, the current user's id is available to the rest of the request without checking again.

Data belonging to a specific person is always filtered by that person's id at the database level, never just hidden in the interface.

The database is only touched from the service files described in Step 2 — controllers, routes, and validators never import the database client directly.

Don't restate a value in a response that's already included by copying the whole record — only override fields that genuinely need reshaping.

---

## Known Issues (flagged, not yet scheduled)

**Address parsing silently produces fake data.** The property address is a single free-text input in the UI (`enter-address-form.tsx`). Before being sent to the backend, `parseAddressContext` (`frontend/src/services/common.ts:63-88`) tries to split that one string into street/suburb/state/postcode with a regex expecting the exact format `"123 Street Name, Suburb ST 1234"`. If the user's input doesn't match that exact pattern — which is most real input — it silently falls back to hardcoded fake values (`suburb: 'Bonnyrigg', state: 'NSW', postcode: '2177'`) instead of erroring. Decision: when picked up, this should be fixed by validating the input and asking the user to correct the format, not by silently substituting fake data. Not blocking backend schema work — `addressLine`/`suburb`/`state`/`postcode` still exist as separate fields in Report regardless of how reliably the frontend currently populates them.

**Demand Signals section on the final "Generated Report" wizard step should be removed, not rebuilt.** `generated-report-container.tsx` calls `getDemandSignals()` (`common.ts:355-357`) to build a metric-cards section and a narrative paragraph that quotes signal levels directly in a sentence (`generated-report-container.tsx:181-194`). `/api/appraisal/demand-signals` no longer exists (removed with `mock.routes.ts`), so this section is already broken in the current app. Decision: remove this section from the frontend rather than rebuild a backend for it — it required inventing a `percent` value from a qualitative level with no real source, and duplicated the "market intelligence" concept already covered by the step-3 panel and the standalone Market Insights page. Not done yet — flagged here for a future pass. When picked up: remove the `getDemandSignals` call, `metricCards`, and `metricCardsIntro` from `generated-report-container.tsx`, and whatever JSX renders them.

---

## Part 2 — Task Backlog

Each ticket has a **Status** field: `Not Started`, `In Progress`, or `Done`. Update it as work proceeds — don't mark `Done` until the acceptance criteria are actually verified against the running app, per Step 8.

---

### [BACKEND-101] Build Client API

**Status:** In Progress — backend done and verified 2026-09-08 (`tsc --noEmit` clean, login + `GET /api/clients` (empty) + `POST /api/clients` (real row created) + `GET /api/clients` (returns it) + unauthenticated request (401) all confirmed against the running server; `PATCH`/`DELETE` and the 409/400 error paths reviewed but not individually exercised). Remaining: the frontend "Add Client" wiring described below is not done yet.

**Follow-up scope added 2026-09-09 — wire the "Add Client" modal to this API**
Found while manually testing: the agent's "Add Client" modal (`client-agent.tsx`) only updates local React state — `handleAddClient()` at `client-agent.tsx:378-396` pushes to `setClients` and never calls the backend, so anything added through it disappears on refresh. It was never wired to any API, mock or real. This needs to be fixed as part of this same ticket, not treated as done:
- Keep the modal's form as-is — a single `address` free-text field, no new fields added
- Before calling the API, parse that single string into `addressLine`/`suburb`/`state`/`postcode` the same way `parseAddressContext` does (`common.ts:63-88`)
- If the address doesn't match the expected format, show a validation error asking the user to re-enter it correctly — do not fall back to fake suburb/state/postcode values, consistent with the decision already made in Known Issues
- `handleAddClient()` calls the real `POST /api/clients` instead of only updating local state; on success, prepend the real returned row (with its server-generated `clientId`), not a locally-fabricated `ClientItem`
- On failure (parsing error, duplicate email → 409, or other validation error), show the message instead of silently closing the modal
- Files: `frontend/src/pages/dashboard/real-estate-agent/client-agent.tsx`, and likely a new `createClient()` function in `frontend/src/services/agent.ts` alongside the existing `updateClientNotes()`
**Level:** 1 (independent — no dependency on other new models)
**Depends on:** Auth only
**Blocks:** Report (Level 2)

**Description**
Client contacts that an agent manages — used by the dashboard's active-client count and pipeline stats, and by the agent's client list page. Read directly by the frontend; written only indirectly (a client gets created or matched when a report is sent with contact details — that happens as part of the Report ticket, not here).

**Schema — `Client` model, every field traced to where the frontend actually reads or writes it**
- `clientId` — `agent.ts:100`, and `dashboard.ts`'s `StoredClientRow`
- `fullName` — `agent.ts:101-102` (name + initials)
- `email` — `agent.ts:105`, and `agent.ts:190` (matched against report emails)
- `phone` — `agent.ts:106`
- `notes` — read at `agent.ts:107`; the only field the frontend ever sends in a `PATCH` body, at `agent.ts:219`
- `addressLine`, `suburb`, `state`, `postcode` — `agent.ts:104`, concatenated into one display string
- `status` — `agent.ts:109`, and `dashboard.ts`'s `StoredClientRow`; values confirmed at `agent.ts:6-11`: prospecting / active / appraisal_sent / listing / sold
- `createdAt` — `dashboard.ts`'s `StoredClientRow` (used for "new this week" counts)
- `updatedAt` — `agent.ts:110`, used directly as the client's follow-up date
- `reportCount` — optional, `agent.ts:192`; only used as a fallback if joining against `/api/reports` by id or email finds nothing
- `ownerUserId` — not read by any frontend type, but required for the auth-scoping rule (a user only ever sees their own clients)

Confirmed absent, dropped from the earlier draft: `propertyType`, `bedrooms`, `bathrooms`, `parking`, `landSizeSqm`. These existed on the old, deleted backend's Client model, but nothing in the current frontend reads or writes them — they were the old backend's own implementation choice (copying a report's property fields onto an auto-created client), not a frontend requirement.

Constraint: unique on `(ownerUserId, email)` — not globally unique, since two agents may share a contact.

**Endpoints (all require a Bearer token)**
- `GET /api/clients` — list, scoped to `ownerUserId`, newest first. This is the one the frontend actually depends on (`dashboard.ts:201`, `agent.ts:169`)
- `GET /api/clients/:clientId` — single record, 404 if missing or not owned by caller
- `PATCH /api/clients/:clientId` — partial update; the only write the frontend calls directly today, body is just `{ notes }` (`agent.ts:216-220`)
- `POST /api/clients` — build for completeness/testing; nothing in the frontend calls this directly today
- `DELETE /api/clients/:clientId` — build for completeness; not called by the frontend today

**Files to create**
- Schema addition in `backend/prisma/schema.prisma` + migration
- `backend/src/services/client.service.ts`
- `backend/src/validators/client.validator.ts`
- `backend/src/controllers/client.controller.ts`
- `backend/src/routes/client.routes.ts`, mounted in `backend/src/routes/index.ts`

**Frontend call sites (verified)**
- `dashboard.ts:201` — `GET /api/clients`
- `agent.ts:169` — `GET /api/clients`
- `agent.ts:216-217` — `PATCH /api/clients/:id` (`updateClientNotes`)

**Acceptance Criteria**
- Given I am logged in as User A, when I call `GET /api/clients`, then I only see clients where `ownerUserId` matches my own id
- Given I `PATCH` a client's notes, when it succeeds, then the updated notes are reflected on the next `GET`
- Given I request a client that doesn't exist or belongs to another user, when I call `GET /api/clients/:id`, then it returns 404
- Given the backend is running, when I open `/dashboard/agent` in the browser while logged in, then the client count and pipeline stats reflect real database rows instead of erroring
- Given I fill in the Add Client modal with a correctly formatted address and submit, when the request succeeds, then the new client appears in the list with a real server-generated `clientId`
- Given I enter an address that doesn't match the expected format, when I submit, then I see a validation error instead of the client being silently created with fake suburb/state/postcode
- Given I refresh the page after adding a client through the modal, when the page reloads, then the client is still there
- Given I submit a duplicate email through the modal, when the request fails, then I see an error instead of a fake local entry being added

---

### [BACKEND-102] Build Comparable Sale API

**Status:** Done — verified 2026-09-08: `tsc --noEmit` clean; wizard endpoint returns real same-suburb comparables with computed `soldAgo` and `matchPercent`/`distanceKm` both `0`, and returns `[]` for an unparseable address; search endpoint returns `isMatch: true` + populated `sales` for a same-suburb address, and `isMatch: false` + empty `sales` + the honest `beds/baths/areaSqm: 0` fallback `subjectProperty` for a no-match suburb; unauthenticated request returns 401. Seed data (3 Richmond comparables) added to `prisma/seed.ts` to make this testable.
**Level:** 1 (shared reference data — no owner, not user-scoped)
**Depends on:** Auth only
**Blocks:** Report (Level 2 — a report references a selected comparable)

**Description**
Sold-property records used as evidence during report-generation step 2, and in a standalone comparable-sales search page. Shared reference data, not owned by a specific user. Note: Valuer's "Evidence" pages (`/api/valuer/evidence*`) are a separate, unrelated model (a compliance checklist) and are out of scope here.

**Schema — `ComparableSale` model, every field traced to frontend usage**
- `comparableId` (uuid, PK)
- `addressLine` — `common.ts:288` (single display string; the row component further splits it on the first comma into street/suburb, `comparable-sale-row.tsx:63-73`)
- `soldPrice` — `common.ts:289`
- `soldDate` — used to compute `soldAgo` (`common.ts:290`, a relative string) server-side; not stored as a string
- `bedrooms`, `bathrooms`, `parking` — `common.ts:291-293`
- `areaSqm` — `common.ts:294`, rendered at `comparable-sale-row.tsx:103`
- `propertyType` — filter criterion, `common.ts:314, 323-327`
- `suburb`, `state`, `postcode` — the primary filter key (see matching logic below)
- `createdAt`

Confirmed dead, not stored: `matchPercent`, `distanceKm` (`common.ts:295-296`) — always return `0`; nothing in the UI reads either field (`comparable-sale-row.tsx:79-124`).

**Business logic — matching/filtering (applies to both endpoints)**
1. Filter to comparable sales in the same suburb as the subject property's address
2. Within that, rank/filter further by property type match and beds/bathrooms/parking closeness; the search endpoint additionally filters by `dateRange`
3. If no same-suburb comparables exist, return an empty `sales` array rather than falling back to unrelated suburbs — a "search nearby suburbs" fallback is a deliberate future improvement, not part of this ticket

**Resolved: what `isMatch` means for `/search`**
`isMatch: true` — same-suburb comparable sales were found; the UI shows the sales list directly. `isMatch: false` — no same-suburb comparables exist; `sales` is empty, and `subjectProperty` is populated (parsed from the search input) so the UI still shows the user what they searched for, per `comparable-sales.tsx:141-149`.

**Endpoints**
- `GET /api/appraisal/comparable-sales?address&propertyType&bedrooms&bathrooms&parking&landSizeSqm` — subject property details via `withAppraisalContext` (`common.ts:37-51`). Returns a plain list using the matching logic above — no `isMatch` concept here, this endpoint doesn't show a subject-property card, it's inline in the wizard.
- `GET /api/appraisal/comparable-sales/search?address&dateRange&propertyType` — `common.ts:311-327`. Returns `{ isMatch, subjectProperty, sales }` per the resolved logic above.
- No create/update/delete needed for the frontend — reference data, seeded directly via `prisma/seed.ts`

**Files to create**
- Schema addition in `backend/prisma/schema.prisma` + migration
- `backend/src/services/comparable-sale.service.ts`
- `backend/src/controllers/comparable-sale.controller.ts`
- `backend/src/routes/comparable-sale.routes.ts`, mounted at `/api/appraisal` in `backend/src/routes/index.ts`
- No validator file needed — both endpoints are GET-only with query params

**Frontend call sites (verified)**
- `common.ts:299-301` — `getComparableSales()` → `GET /api/appraisal/comparable-sales`
- `common.ts:323-328` — `searchComparableSales()` → `GET /api/appraisal/comparable-sales/search`

**Acceptance Criteria**
- Given comparable sales exist in the same suburb as the subject property, when I call `GET /api/appraisal/comparable-sales`, then I get back real rows filtered to that suburb
- Given I search an address with no same-suburb comparables, when I call `/search`, then `isMatch` is `false`, `sales` is empty, and `subjectProperty` is populated from the search input
- Given I search an address with same-suburb comparables, when I call `/search`, then `isMatch` is `true` and `sales` contains those rows
- Given the backend is running, when I open the report wizard's step 2 and the standalone comparable-sales search page in the browser, then both show real data instead of errors or empty states

---

### [BACKEND-103] Build Market Intelligence API

**Status:** Done — verified 2026-09-08: `tsc --noEmit` clean; all 4 role endpoints (`agent`/`valuer` market-insights, `buyer`/`investor` suburb-explorer) return identical, correctly formatted data for Richmond VIC (`$1.28M`, `+8.2%`, `+0.68%`, `+0.12pp`, `22`, `-3 days`, `3.4%`, `+0.2%` — matching the live UI screenshot exactly) and `null` for an unknown suburb; wizard's market-intelligence-overview returns the generic array shape for a parseable address and an empty-stats fallback for an unparseable one; unauthenticated request returns 401. Seed data (Richmond VIC) added to `prisma/seed.ts`.
**Level:** 1 (shared reference data — no owner, not user-scoped)
**Depends on:** Auth only

**Description**
One suburb-level market data model, shared across five real consumers with only two distinct response shapes: the named-field shape (agent's "Market Insights", valuer's "Market Insights", buyer's "Suburb Explorer", investor's "Suburb Explorer" — all four use field-for-field identical data, just different type names per role) and the generic-array shape (the wizard's step-3 panel). Demand signals are explicitly out of scope, per Known Issues.

**Schema — `MarketIntelligence` model**
- `marketId` (uuid, PK)
- `suburb`, `state` — composite unique `[suburb, state]`
- `medianPrice` (Float), `medianPriceGrowthPct` (Float)
- `monthlyGrowthPct` (Float), `monthlyGrowthTrendPp` (Float)
- `daysOnMarket` (Int, returned raw — confirmed not a string), `daysOnMarketTrendDays` (Int, signed)
- `rentalYieldPct` (Float), `rentalYieldTrendPct` (Float)
- `priceTrendJson` (String) — JSON-encoded array of 12 `{ month, priceIndex }` points
- `asOfMonth`, `createdAt`

**Endpoints**
- `GET /api/agent/market-insights?suburb=`
- `GET /api/valuer/market-insights?suburb=`
- `GET /api/buyer/suburb-explorer?suburb=`
- `GET /api/investor/suburb-explorer?suburb=`

All four hit the same service and return the identical named-field shape (`agent.ts:344-357`, `valuer.ts` equivalent, `buyer.ts:129-144`, `investor.ts:121-134` — all four types are structurally identical). Unknown suburb → `null`/404-equivalent; each page's own hardcoded suggestion chips handle that case already.

- `GET /api/appraisal/market-intelligence-overview` — suburb derived from `withAppraisalContext`'s address, shaped into the generic `stats: [{id,label,value,trend}]` contract (`common.ts:371-379`). Empty stats array if suburb can't be determined from the address, consistent with the Comparable Sale ticket's decision.

**Files to create**
- Schema addition in `backend/prisma/schema.prisma` + migration
- `backend/src/services/market-intelligence.service.ts` — one shared lookup by suburb/state, JSON parse/stringify for the trend, and the two response-shaping functions (named-field vs generic-array)
- `backend/src/controllers/market-insights.controller.ts` — one handler reused across all 4 role routes
- `backend/src/controllers/market-intelligence-overview.controller.ts` — the wizard's generic-array handler
- `backend/src/routes/market-insights.routes.ts` — mounted at `/api/agent`, `/api/valuer`, `/api/buyer`, `/api/investor` (4 mounts, 1 router)
- `backend/src/routes/market-intelligence-overview.routes.ts` — mounted at `/api/appraisal`
- Seed data: Richmond VIC in `prisma/seed.ts`

**Frontend call sites (verified)**
- `agent.ts:432-434` → `GET /api/agent/market-insights`
- `valuer.ts` equivalent → `GET /api/valuer/market-insights`
- `buyer.ts:217-219` → `GET /api/buyer/suburb-explorer`
- `investor.ts:209-211` → `GET /api/investor/suburb-explorer`
- `common.ts:377-379` → `GET /api/appraisal/market-intelligence-overview`

**Acceptance Criteria**
- Given Richmond VIC exists in the database, when I call any of the 4 role-specific endpoints, then each returns the correctly formatted named-field shape
- Given an unknown suburb, when I call any of them, then each page's existing "no data found, try one of these" fallback renders correctly
- Given the wizard's step 3 is reached with a parseable subject address, when it loads, then real `stats[]` and price trend render
- Given the backend is running, when I open each of the 4 role pages (Market Insights ×2, Suburb Explorer ×2) and search "Richmond VIC," then all four show real, identical data

---

### [BACKEND-104] Build Saved Property / Evidence API

**Status:** Not Started
**Level:** 1 (independent — owned by user)
**Depends on:** Auth only

**Not yet verified against the frontend in detail — treat the following as a starting hypothesis, not confirmed fact. Before drafting the full ticket, re-check each field/endpoint against actual code, the same way BACKEND-101/102/103 were verified (a past instance of this exact work skipped that step and had to be corrected by the user afterward — don't repeat that).**

Believed scope: 4 role-specific "saved property" endpoints that are likely the same underlying concept:
- `GET /api/buyer/properties/saved` — `buyer.ts:47`
- `GET /api/investor/properties/saved` — `investor.ts:101`
- `GET /api/agent/properties/saved` — `agent.ts:261`
- `GET /api/valuer/evidence/saved` — `valuer.ts:66` (named differently — "saved evidence" — confirm whether it's genuinely the same shape before assuming, the way Suburb Explorer turned out to be identical to Market Insights despite the different name)

Need to check: exact field shapes per role (may differ, unlike Market Intelligence where they were identical), whether there's a save/remove action anywhere in the UI (not just a read), and which page(s) actually render this data.

---

### [BACKEND-105] Build Notifications API

**Status:** Not Started
**Level:** 1 (independent — owned by user)
**Depends on:** Auth only

**Not yet verified in detail.** Believed scope: 8 endpoints (list + unread-count, × 4 roles):
- `agent.ts:243,247`, `buyer.ts:105,109`, `investor.ts:83,87`, `valuer.ts:48,52`

Need to check: the actual `InboxNotification` shape (defined in `common.ts`, shared type per earlier grep), whether notifications are ever created/marked-read from the UI (write endpoints) or purely read-only, and which page(s)/components render them (`notification.tsx`, `view-notifcation.tsx` were seen in the frontend file listing but not yet opened).

---

### [BACKEND-106] Build Inspections API

**Status:** Not Started
**Level:** 1 (independent — owned by user, buyer-specific)
**Depends on:** Auth only

**Not yet verified in detail.** Believed scope, from `buyer.ts`:
- `GET /api/buyer/inspections` — list
- `PUT /api/buyer/inspections/:id` — save/update (`saveBuyerInspection`, `buyer.ts:77-79`)

Need to check: the `BuyerInspection` type's exact fields, and the actual page (`pages/dashboard/buyer/inspections.tsx`) to confirm how it's used and whether create/delete exist anywhere in the UI beyond this one PUT.

---

### [BACKEND-107] Build Report API

**Status:** Not Started
**Level:** 2 (composite — depends on Client and Comparable Sale, both done, so this is unblocked)
**Depends on:** BACKEND-101 (Client, done), BACKEND-102 (Comparable Sale, done)

**Not yet drafted.** This is the central object of the whole product — subject property details, estimated value, market snapshot, selected comparable, and narrative text, optionally linked to a Client. Known call sites from earlier classification:
- `dashboard.ts:200-201`, `agent.ts:169-170` — `GET /api/reports` (already partially relied upon by BACKEND-101's `getClientListMockData`, currently tolerated via `Promise.allSettled` until this exists)
- `common.ts:121` — `GET /api/reports/:reportId`
- `common.ts:171-172` — `POST /api/reports` (the actual creation flow, `persistGeneratedReport`)
- `agent.ts:239`, `buyer.ts:101`, `investor.ts:75,79`, `valuer.ts:40,44` — per-role "reports"/"cases" views, likely filtered/formatted views of the same underlying Report table, not separate models (same assumption pattern as Market Intelligence — verify before building)

Before drafting: re-read `common.ts`'s `persistGeneratedReport` fully (the payload shape is already known from earlier investigation — `propertyAddressLine/Suburb/State/Postcode`, `propertyType`, `bedrooms/bathrooms/parking/landSizeSqm`, `estimatedValue`, `selectedComparable*`, `market*` fields, `narrativeText`, `pdfStoragePath`) and confirm the per-role report/case list pages' exact field expectations the same rigorous way Client/Comparable Sale/Market Intelligence were verified.

---

### [BACKEND-108] Re-wire AI Narrative Generation

**Status:** Not Started
**Level:** 3 (depends on Report having real data)
**Depends on:** BACKEND-107 (Report, not yet built)

**Not yet drafted — blocked until Report exists.** This is the actual thesis of the project: generate the narrative from a real report's real comparable sale and real market snapshot via Groq, instead of the old deterministic-formula mock. `GROQ_API_KEY`/`narrative-prompts.ts`-style prompts existed in the deleted backend and can inform this, but the orchestration needs to be rebuilt against the new schema.

---

### [BACKEND-109] Content & Navigation (lower priority)

**Status:** Not Started
**Level:** unclear — not yet investigated
**Depends on:** unclear

**Not yet drafted.** Whatever the old, deleted `content.controller.ts`/`navigation.controller.ts` served. Lower priority — the app still renders without it. Needs its own investigation pass before drafting: what did the frontend actually call, and does anything still reference those endpoints today.
