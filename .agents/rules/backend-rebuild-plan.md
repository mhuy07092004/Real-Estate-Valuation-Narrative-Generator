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

**Demand Signals section — RESOLVED 2026-09-09.** Was flagged here as "not done yet" through BACKEND-104 → 110, and got missed even when BACKEND-110 touched this exact file for the closely related `propertySpecificFactors` removal — a real oversight, not a deliberate deferral. Consequence while it sat unresolved: since `getDemandSignals()`'s endpoint doesn't exist and mocks are off, `generated-report-container.tsx`'s all-or-nothing loading gate (`if (!selectedTemplate || ... || !demandSignals) return <Loading/>`) meant **the entire "Generated Report" step could never render in the real app** — it would sit on "Loading generated report…" forever, silently undoing all of BACKEND-108/109/110's work from the user's perspective. Fixed: removed the `getDemandSignals` call, `metricCards`/`metricCardsIntro` construction, and their rendering (`generated-report-panel.tsx`'s Market Analysis metric-cards section, now conditionally rendered and skipped) from `generated-report-container.tsx`; removed the now-dead `getDemandSignals`/`DemandSignal`/`DemandSignalTone` exports from `common.ts`. `tsc --noEmit` clean.

---

## Real Data Ingestion (2026-09-10): bronze NSW listings

`data_ai/bronze_listings.csv` (42,320 real sold-listing rows scraped from domain.com.au, NSW only) got imported for real, directly addressing part of the Fake Data Audit below. This isn't part of the ticket backlog numbering (BACKEND-10x) since it's a data operation, not a feature — recorded here for the record and so a future session doesn't re-discover or re-run it blindly.

**Decisions locked:**
1. Port the cleaning rules already proven in `data_ai/ingestion/clean_listings.py` (a separate, more elaborate Python/Postgres pipeline that was never connected to this app) into a plain Node/TS script, inserting directly into our own `Property`/`ComparableSale`/`MarketIntelligence` tables via Prisma — no new infrastructure, stays consistent with "one Express/Prisma backend, one DB."
2. Import as-is: this data is 100% NSW, zero overlap with the existing Richmond VIC seed data. Richmond VIC stays the only VIC coverage; this just adds real NSW suburb coverage alongside it.
3. `MarketIntelligence.daysOnMarket`/`daysOnMarketTrendDays`/`rentalYieldPct`/`rentalYieldTrendPct` made **nullable** (migration `market_intelligence_nullable_metrics`) — these are genuinely not derivable from bulk sold-listing data (no original listing date to measure time-on-market, no rental data at all). `null` is stored and surfaced as `"N/A"`, never a fabricated number. Richmond VIC's existing seed values are untouched (see correction below — those are fabricated demo numbers, not real sales, despite earlier wording here calling them "real").

**Scripts** (both standalone, re-run manually, NOT part of `prisma:seed` — that script wipes and re-seeds Property/ComparableSale/MarketIntelligence on every run and is meant to stay fast/repeatable dev seed data, not a 40k-row import that would need re-running after every `prisma migrate reset`):
- `backend/scripts/ingest-bronze-listings.ts` — reads the CSV, cleans each row (postcode via the same real external lookup their Python cleaner uses — `Elkfox/Australian-Postcode-Data` on GitHub, fetched live; property_type normalized to our exact dropdown values, agent-name-polluted rows and anything else unrecognized are skipped, never defaulted to "House"; price/date parsed), inserts as `Property` + `ComparableSale`. Configurable via `BRONZE_CSV_PATH` env var (defaults to `../data_ai/bronze_listings.csv`, run from `backend/`). Result: **33,572 properties imported** (79% of the file) across **1,563 NSW suburbs**; skipped honestly (not fabricated) — 4,358 unrecognizable property types, 2,030 missing parking, 1,894 unparseable sale dates, 315 suburbs with no postcode match, ~150 other malformed rows.
- `backend/scripts/build-suburb-market-intelligence.ts` — computes real per-suburb `MarketIntelligence` rows from the `ComparableSale` data the above script just inserted (not re-reading the CSV). For each suburb: median price and a real 12-month price-index trend from actual monthly median sold prices (gaps in months with no sales are forward/back-filled from the nearest known month — an honest "price held at last known level" proxy, not a guess), median price growth %, and month-over-month growth trend, all genuinely derived. Skips any suburb with fewer than 8 sales in the trailing 12 months — below that, a "trend" is mostly noise. Result: **814 suburbs got a real row**, 677 skipped for insufficient recent sales volume.

**Verified**: curl-tested `GET /api/agent/market-insights?suburb=Orange%20NSW` returns real computed stats (`$750K` median, `-5.0%` growth, real 12-point price trend) with `daysOnMarket: null`/`"N/A"` correctly for the unavailable metrics; `GET /api/agent/market-insights?suburb=Richmond%20VIC` confirmed unchanged (still `$1.28M`, `22` days on market, `3.4%` rental yield — the original seed values, not overwritten). Note: those Richmond VIC values are **not real** — see the new Fake Data Audit item below found while reviewing `seed.ts` directly.

**Follow-up needed before any of this is visible anywhere**: this only touched the backend/DB. The corrected BACKEND-103 frontend-wiring fix (swap each role's hardcoded mock call for a real `fetchJson`) still hasn't been done — see the Fake Data Audit's first item below. That fix will also need to widen `MarketInsightsStats.daysOnMarket`'s type from `number` to `number | null` (currently `agent.ts`/`valuer.ts`/`investor.ts`/`buyer.ts`) and update each page's rendering (`String(data.stats.daysOnMarket)` currently renders the literal text `"null"` for a null value — must render `"N/A"` instead) — a real, specific requirement for whoever picks up that fix, not just "wire it up."

---

## Fake Data Audit (2026-09-10)

A full project-wide sweep for remaining fake/hardcoded/mock data, requested to decide priorities and real data sources item by item. Supersedes/confirms scattered earlier findings. Grouped by how actionable each item is. Items already covered above (address parsing, BACKEND-106/113/114) are not repeated here.

### External data-sourcing tasks (to be implemented in `data_ai/`, not this backend)

Seven fields identified as genuinely missing external data (not fixable by wiring or logic changes alone), confirmed by grepping the actual frontend types/mocks against `MarketIntelligence` in `schema.prisma`. **Decision:** these get sourced/ingested in `data_ai/` (the separate Python data-pipeline directory), the same way `data_ai/bronze_listings.csv` was — this Node/Prisma backend only consumes the resulting clean data once it's ready, it doesn't do the scraping/collection itself. Recorded here as task descriptions for whoever picks up `data_ai/` work; not implemented yet.

1. **Days on Market** — used by Market Insights/Suburb Explorer (`MarketIntelligence.daysOnMarket`/`daysOnMarketTrendDays`, currently `null` for every real suburb). **RESOLVED — feasibility confirmed 2026-09-10.** Originally scoped as "scrape one detail page per property" (~33k page loads, ~25x slower than the original bulk scrape — ruled out as infeasible). Real source found instead: `domain.com.au/suburb-profile/{suburb-state-postcode}` embeds a full server-rendered GraphQL data blob (`LocationProfile` typename) directly in the initial page HTML — no tab click, no extra request. Per suburb, segmented by bedroom count + property category (House/Unit), it has a real `daysOnMarket` field (e.g. Orange NSW: 36/30/45 days for 2/3/4-bed houses), plus `medianSoldPrice`, `numberSold`, `auctionClearanceRate`, `medianRentPrice`, and a 5-year `salesGrowthList`. Verified live via `data_ai/scripts/probe_domain_suburb_page.py` (built this session) — loads one page with the existing `undetected_chromedriver` setup already proven in `bronze_listing_ingest.py`, saves raw HTML + screenshot to `data_ai/probe_output/`. Confirmed working against `orange-nsw-2800`: real title, real data, not an anti-bot challenge page. Cost: **one page load per suburb** (~1,563 total for our real suburb set) — comparable to or cheaper than the original bulk scrape's ~1,343 search-result page loads, not the 25x blowup of the per-property approach.
2. **Rental Yield** — used by Market Insights/Suburb Explorer (`MarketIntelligence.rentalYieldPct`/`rentalYieldTrendPct`, currently `null`). **RESOLVED — same source as #1.** The `LocationProfile` blob's `medianRentPrice` field (confirmed present, e.g. $500/$560/$680/week for 2/3/4-bed houses in Orange) combines with the already-real `medianSoldPrice` (or our own `medianPrice`) to compute yield ourselves: `rent × 52 ÷ price`. No separate scrape needed — same page load as Days on Market.
3. **Vacancy Rate** — used by investor Market Comparison chart (`MarketComparisonSuburb.vacancyRate`) and investor dashboard's "Market Signals" panel label ("Vacancy Rate Change"); no column exists in `MarketIntelligence` at all yet. **RESOLVED — feasibility confirmed 2026-09-10, best result of all 7.** Not in the Domain `LocationProfile` blob (checked, no match). SQM Research's paid Postcode Snapshot report (`postcodesnapshot.php`) was ruled out first — confirmed via `undetected_chromedriver` (`data_ai/scripts/probe_sqm_vacancy_page.py`) to be a real paywall ($49.95 single / $99.95-per-month), not just bot-detection; the third-party blog that called it free was wrong. But that page's own "Free Property Data" sidebar links to `sqmresearch.com.au/property/vacancy-rates?postcode={postcode}`, which turned out to be genuinely free: it embeds a **complete monthly vacancy-rate time series from January 2005 through July 2026** directly in plain page JavaScript (`var data = [{"year":2005,"month":1,"listings":28,"properties":4622,"vr":"0.0061"}, ...]`), with `has_purchased_chart = false` explicitly confirming this is the free/unpurchased view and the real numbers are still fully present, not stripped out. Fields per month: `listings` (vacant listings), `properties` (total rental stock), `vr` (vacancy rate as a decimal, e.g. `0.0092` = 0.92%). Verified live for postcode 2800 (Orange NSW), raw HTML saved to `data_ai/probe_output/sqm_vacancy_rates_page_2800.html`. Same cost profile as #1/#2/#4: one page load per postcode via the existing Selenium setup, no per-property scraping.
4. **Clearance Rate** — used by investor Market Comparison chart (`MarketComparisonSuburb.clearanceRate`); no column exists yet. **RESOLVED — feasibility confirmed 2026-09-10.** Same `LocationProfile` blob as #1 (source #1). Orange NSW read `0` for every bedroom count, which was ambiguous (genuine low-auction regional market vs. an unpopulated/default field) — resolved by re-running `probe_domain_suburb_page.py` against `richmond-vic-3121`: real, varying, nonzero `auctionClearanceRate` values came back (73.4% for 2-bed houses, 59.6% for 3-bed, 40% for 4-bed), proving the field is genuinely live data and Orange's `0` was legitimately "almost no auctions happen here," not a broken field.
5. **Population Growth** — used by investor Market Comparison chart (`MarketComparisonSuburb.populationGrowth`); no column exists yet. **RESOLVED — feasibility confirmed 2026-09-10.** Source: ABS's own public ArcGIS REST API at `geo.abs.gov.au` — plain JSON over HTTP, no scraping, no anti-bot, no auth. Exact service: `Hosted/ABS_ERP_2001_2023_SA2` (queried the full `Hosted` service catalog at `geo.abs.gov.au/arcgis/rest/services/Hosted?f=json` to find it — a newer one than the `2001_2021` version originally found by search). Verified live via `data_ai/scripts/probe_abs_sa2_data.py` (built this session, stdlib-only, no new dependencies): for "Orange", returned real `erp_no_2021`/`erp_no_2022`/`erp_no_2023` population figures for 4 matching SA2 regions (e.g. "Orange": 19,110 → 19,135 → 19,118, +0.04% 2yr growth; "Orange - North": 23,055 → 23,246 → 23,524, +2.03%). Raw JSON saved to `data_ai/probe_output/abs_erp_orange.json`. **Real open problem surfaced by this test**: a suburb name doesn't map 1:1 to one SA2 — "Orange" alone matched "Orange", "Orange - North", "Orange Surrounds", and an unrelated WA "Maddington - Orange Grove - Martin", each with meaningfully different growth rates. Needs a real decision on suburb→SA2 resolution (e.g. exact-name match only, or a proper SA2 boundary/postcode crosswalk) before this becomes real ingestion logic — not just a "pick the top match" shortcut, since that risks silently picking the wrong sub-region.
6. **Supply Constraint** — used by investor Market Comparison chart (`MarketComparisonSuburb.supplyConstraint`); no column exists yet, and no single official "supply constraint score" is published anywhere. **RESOLVED as a proxy — feasibility confirmed 2026-09-10.** Same ABS ArcGIS REST pattern as #5: `Hosted/ABS_BAPS_SA2_1415_2223` (Building Approvals per SA2, financial years 2014/15–2022/23), also plain free JSON, no auth. Verified live via the same `probe_abs_sa2_data.py`: for "Orange", returned real `totdwl_dwl_*` (total dwelling units approved) figures per SA2 per year (e.g. "Orange": 42/94/39/37 dwellings approved in FY19/20 through FY22/23). Raw JSON saved to `data_ai/probe_output/abs_baps_orange.json`. Still needs: (a) the same suburb→SA2 mapping decision as #5 (same ambiguity applies here), and (b) a formula decision for what "supply constraint" actually means numerically (e.g. approvals ÷ existing dwelling stock, or ÷ population) — no standard published metric to just copy, ABS only gives the raw approval counts.
7. **Median House vs. Unit price split** — used by investor Market Comparison chart (`MarketComparisonSuburb.medianHousePrice`/`medianUnitPrice`, two separate numbers; `MarketIntelligence` currently stores one blended `medianPrice` per suburb). Not a new external source — `build-suburb-market-intelligence.ts` already has `propertyType` on every imported `Property` row, it just doesn't group by it. Fix is a `groupBy (suburb, propertyType)` change to the existing aggregation script, same underlying bronze data. (Confirmed independently, in passing: the Domain `LocationProfile` blob from #1 also already segments by `propertyCategory` House/Unit — corroborates this is a normal way to cut the data, but we don't need it externally since our own bronze data already supports it.)

**Feasibility scripts built this session (both read-only probes, no DB writes, not production ingestion code):**
- `data_ai/scripts/probe_domain_suburb_page.py` — loads one Domain suburb-profile page via `undetected_chromedriver`, saves HTML + screenshot to `data_ai/probe_output/`. Note: had to change the hardcoded `version_main=150` (copied from the older `bronze_listing_ingest.py`, now stale) to `version_main=152` to match the Chrome version actually installed on the dev machine — `bronze_listing_ingest.py` itself still has the stale `150` and will hit the same `SessionNotCreatedException` if it's ever re-run without the same fix.
- `data_ai/scripts/probe_abs_sa2_data.py` — stdlib-only (`urllib`), queries both ABS ArcGIS FeatureServer endpoints for a given SA2 name filter, saves raw JSON, prints a summary. No new Python dependencies needed for this one at all.
- `data_ai/scripts/probe_sqm_vacancy_page.py` — same `undetected_chromedriver` pattern, targets SQM Research vacancy-rate pages. First run (against `postcodesnapshot.php`) proved that page is a real paywall, not a bot-block; updated to target `/property/vacancy-rates` instead (SQM's own "Free Property Data" sidebar link) and confirmed working — full free monthly vacancy-rate time series back to Jan 2005, embedded directly in page JS.

**Result: all 7 flagged data items now have a confirmed real, free source (or an in-house fix for #7) as of 2026-09-10.** None of this is implemented as real ingestion/parsing code yet — every finding above came from a read-only feasibility probe (`probe_domain_suburb_page.py`, `probe_abs_sa2_data.py`, `probe_sqm_vacancy_page.py`), not production code. Turning these into real `MarketIntelligence` columns still needs, at minimum: a real parser for the Domain `LocationProfile` JSON blob (source for #1/#2/#4), a suburb→SA2 resolution strategy (needed by #5/#6, flagged above as a real open problem, not a rounding error), a formula decision for the Supply Constraint proxy (#6), and a bulk ingestion script for the SQM vacancy-rate time series (#3) analogous to `ingest-bronze-listings.ts`.

Neither script writes to any database or the main app — they're purely for confirming real data exists and is reachable before writing real ingestion/parsing logic.

### Production scraping scripts (2026-09-10) — real CSVs, not yet loaded into the app

Three production ingestion scripts were built and verified against a 10-suburb test batch (the highest-sale-volume real suburbs from the already-imported `Property` table), covering all 6 external items:

- `data_ai/ingestion/domain_suburb_insights_ingest.py` — Days on Market (#1), Rental Yield (#2, computed from `medianRentPrice`), Auction Clearance Rate (#4). Reuses one Chrome instance across a batch of suburbs (relaunches every `--reset-every`, default 20, not per suburb — instructed explicitly, since per-suburb relaunching is expensive). Writes `data_ai/domain_suburb_insights.csv`, one row per (suburb, property category, bedroom count) — raw granularity, not aggregated to one row per suburb. Verified: 10/10 suburbs, 70 real rows.
- `data_ai/ingestion/abs_sa2_raw_ingest.py` — Population Growth (#5), Supply Constraint raw approvals (#6). Plain REST, no Selenium. Deliberately does **not** resolve the suburb→SA2 ambiguity — writes every matched SA2 row as-is, tagged with the suburb searched for, so mapping is a separate later step over raw data (explicit instruction: "get raw and do transformation later"). Writes `data_ai/abs_population_raw.csv` + `data_ai/abs_building_approvals_raw.csv`. Verified: 10/10 suburbs, 135 + 108 real rows. Surfaced a real false-positive risk in the naive `LIKE '%name%'` match: "Austral" matched an unrelated WA suburb, "Australind - Leschenault".
- `data_ai/ingestion/sqm_vacancy_rate_ingest.py` — Vacancy Rate (#3). Same driver-reuse pattern as the Domain script. Writes `data_ai/sqm_vacancy_rate_raw.csv`, the full monthly time series per postcode (back to Jan 2005, no aggregation). Verified: 10/10 suburbs, 2,534 real rows — including a real "shorter history" case (Googong, a newer development suburb, only has data from 2009-07 onward, not 2005 like the others — genuine, not padded).
- `data_ai/ingestion/suburb_source.py` — small shared helper (`load_suburbs`, `slugify`) used by the ABS and SQM scripts, reading the real suburb+state+postcode list straight from `backend/prisma/dev.db`'s `properties` table. (`domain_suburb_insights_ingest.py` keeps its own separate copy of this logic rather than importing it — left as-is, not refactored, per instruction.)

**Known issue, deliberately left unfixed for now:** all three scripts open their output CSV in append (`"a"`) mode with no awareness of a prior full run, so re-running the same script without deleting its CSV first duplicates every row (confirmed: `domain_suburb_insights.csv` ended up with 140 rows — two identical 70-row copies — after being run twice). Left as-is per instruction ("ignore it"); needs either overwrite-mode or real resume/dedup logic before these are run at full scale.

**None of this data is in the actual app yet.** Everything above only produces CSVs in `data_ai/`. Getting it into the real `MarketIntelligence` table (used by the frontend) is a separate, not-yet-implemented task — see below.

### Next task: load into Prisma, then scale to all real suburbs

Two real design decisions were locked 2026-09-10 (via explicit user choice) to unblock this:
1. **Domain per-bedroom aggregation → one row per suburb**: sales-weighted average across all 7 (property category × bedroom count) rows, weighted by each row's `numberSold` — applies to Days on Market, Rental Yield, and Auction Clearance Rate alike. A row with `numberSold: 0` (the all-zero placeholder pattern seen for Tamworth) naturally drops out of the average since its weight is 0. Known unresolved edge case, not blocking: a row with a small but nonzero `numberSold` and a `daysOnMarket`/`auctionClearanceRate` of exactly `0` due to insufficient chart data (distinct from a genuine 0%) still gets counted at face value — no attempt made to distinguish "genuinely low" from "not enough data to compute," since there's no field that flags the difference.
2. **Suburb→SA2 mapping for Population Growth / Supply Constraint**: exact case-insensitive name match only (`sa2_name_2021` == suburb name, e.g. only "Orange" itself, not "Orange - North"/"Orange Surrounds"). A suburb with no exact match (e.g. Port Macquarie, which only matched East/South/West/Surrounds sub-regions, never plain "Port Macquarie") is skipped — left `null`, not guessed.
3. **Supply Constraint formula** (not covered by either question above, decided by necessity since no standard metric exists to copy): store it as **dwelling approvals per 1,000 residents, most recent financial year** — a plain, honest ratio using the same exact-match SA2's building-approvals and population figures — rather than inventing an arbitrary normalized 0–100 "score" with no real basis.

**Schema additions needed** (`MarketIntelligence` model) — `daysOnMarket*`/`rentalYieldPct*` already exist as nullable columns from the earlier bronze-data work and don't need new columns, just real values instead of `null`. New nullable columns needed:
- `auctionClearanceRatePct` (Float?)
- `vacancyRatePct` (Float?) — from the SQM series' latest available month
- `populationGrowthPct` (Float?) — from the ABS ERP exact-match SA2, earliest-to-latest available year in the fetched range
- `supplyConstraintDwellingApprovalsPer1000` (Float?) — the ratio described above; named explicitly so nobody mistakes it for a normalized score later

**Loader script** (not yet built) — a new script, most likely `backend/scripts/load-external-market-data.ts` (Node/TS + Prisma, same pattern as `build-suburb-market-intelligence.ts`, since `MarketIntelligence` already lives behind Prisma) that reads the four CSVs above, applies the two aggregation/mapping rules and the Supply Constraint formula, and **updates existing** `MarketIntelligence` rows only (by `suburb`+`state`) — does not create new suburb rows from external data alone, since a `MarketIntelligence` row's core fields (`medianPrice`, price trend, etc.) come from the bronze sales data, not from this. A suburb present in the CSVs but with no existing `MarketIntelligence` row is skipped, not created.

**Sequencing** (explicit instruction: insert into Prisma first, then scale the scrape):
1. Build the loader above and run it against the existing 10-suburb test CSVs — verify real values land correctly in `MarketIntelligence` for those 10 suburbs before doing anything at scale.
2. Only after that's confirmed working, re-run all three production scripts with no `--limit` (or a much higher one) against the full ~1,491-suburb list from `properties`, then re-run the loader over the resulting full CSVs.
3. Fix the append-mode duplication issue before or during step 2 — running the same script unlimited times during testing already produced one duplicated file; doing that across 1,491 suburbs unnoticed would be a much bigger mess to clean up.

**Step 2 completed 2026-09-10, via `data_ai/run_full_scrape.py`** (a single orchestrator script that counts real suburbs, clears each output CSV first — resolving the append-mode duplication issue from step 3 above by always starting fresh rather than adding real resume logic — then runs all three ingestion scripts sequentially). Real coverage achieved:
- Domain (Days on Market/Rental Yield/Clearance Rate): **1,369 of 1,491 suburbs** (92%) — the ~8% gap is suburbs where Domain's own page didn't have a populated data blob, skipped honestly rather than fabricated
- SQM (Vacancy Rate): **1,431 of 1,491** (96%)
- ABS (Population Growth/Supply Constraint): only **826 of 1,491** had any SA2 name match at all (55%) — this is the expected consequence of the suburb→SA2 naming-mismatch problem already documented above (e.g. Port Macquarie never exact-matches any SA2), not a scrape failure

`load-external-market-data.ts` was then re-run against these full-scale CSVs (previously only run against the 10-suburb test batch): **778 real suburbs updated**, 668 skipped (real external data exists for them, but no base `MarketIntelligence` row to attach it to, since they never had ≥8 sales in `build-suburb-market-intelligence.ts`'s trailing-12-month aggregation — correctly not created from external data alone, per the locked design decision). Post-run real counts in `MarketIntelligence` (815 rows total): 764 suburbs with real Days on Market, 718 with real Rental Yield, 766 with real Vacancy Rate, 764 with real Auction Clearance, 177 with real Population Growth, 177 with real Supply Constraint (the last two bottlenecked by the same SA2-matching gap as the raw ABS coverage above). BACKEND-117's Market Comparison endpoint — which requires all 7 comparison fields complete — went from **2 qualifying suburbs to 52**, live-verified via `GET /api/investor/market-comparison`.

**Side effect worth recording: `seed.ts`'s Richmond VIC row is now a mix of real and fake data, not fully fake anymore.** Richmond VIC was included in the full suburb list (it's a real row in `properties` from the original seed) and got real values written for `daysOnMarket` (22 → **36**), `rentalYieldPct` (3.4% → **4.92%**), plus newly-populated real `auctionClearanceRatePct` (**64.8%**) and `vacancyRatePct` (**1.16%**). However, `medianPrice`/`medianPriceGrowthPct`/`priceTrendJson` remain the original `seed.ts` fabrication ($1.28M, the suspiciously linear 61→103 trend) — those only ever get touched by `build-suburb-market-intelligence.ts`'s real bronze-sales aggregation, and Richmond VIC has no real bronze sales data behind it. So Richmond VIC is now **partially real** — the decision recorded earlier ("keep as labeled demo data, or source real Richmond sales") is still open for the remaining fake fields, but the scope of what's fake there just shrank on its own.

Realistic near-term candidates: #1 (DOM), #2 (rental yield), and #4 (clearance rate) are all scrapeable/publicly bulletin-published the same way the bronze sales CSV was obtained. #5 (population growth) and #6 (supply constraint) are ABS-based, free, but at coarser geography (SA2/LGA) and need a mapping/formula decision. #7 requires no new data at all, just an aggregation-script change.

### Quick wins — real backend already exists, just needs frontend wiring

- **Suburb Explorer / Market Insights, all 4 roles** — see the corrected BACKEND-103 status above. Each role's service (`agent.ts:383-437`, `valuer.ts:138-192`, `investor.ts:185-239`, `buyer.ts:207-261`) still returns a hardcoded 3-suburb dict via `Promise.resolve` instead of calling the real, working, curl-verified backend endpoint. **Updated 2026-09-10:** the backend now has real data for 815 suburbs (Richmond VIC + 814 real NSW suburbs, see "Real Data Ingestion" above) — this is now purely the frontend wiring fix, nothing else blocking it. Widening `daysOnMarket`'s type to `number | null` and rendering `"N/A"` for it is now a required part of that fix, not optional polish.
- **Dashboard "Market Signals" (investor) / "Melbourne Market" (buyer) panels** — the same market-intelligence data could genuinely back these instead of the hardcoded/mislabeled numbers described below.

### Needs a real decision + likely new work

- **Dashboard Home stats** (full detail already captured from the 2026-09-10 investigation, pending prioritization):
  - Cross-role report leakage: `loadDashboardMetrics()` (`dashboard.ts:196`) calls generic `/api/reports` instead of the role-scoped `/api/{role}/reports` endpoints BACKEND-111 already built — every stat on every role's dashboard can include reports from other roles the same account used.
  - Investor stat label/value mismatch: `statValuesForRole('investor')` (`dashboard.ts:253-254`) returns `[generatedReports, '4.3%', '6.8%']` mapped positionally onto labels `['Saved Properties', 'Generated Reports', 'Avg Investment Report Value']` — wrong number under wrong label, plus two literal fake percentages. Investor trends `'+0.2% this week'`/`'+0.4 this week'` (`dashboard.ts:278`) are also literal.
  - Buyer stats (`dashboard.ts:257-263, 281-286`) reuse agent-CRM concepts (`activeClients`, `pipeline.appraisalSent`) that don't apply to buyers; real sources already exist and are unused: `getSavedProperties()`, `getBuyerInspections()` (BACKEND-107).
  - Investor "Market Signals" panel (`dashboard-copy.ts:161-184`): real `AgentPipeline` client-status counts rendered under fake market-signal labels (`Vacancy Rate Change`, `Price Momentum`, etc.) with hardcoded suburb subtitles.
  - Buyer "Melbourne Market" panel (`dashboard-copy.ts:238-256`): fully hardcoded `values`/`trends` that override any real number via `copy.values?.[stage.key] ?? count` (`appraisal-pipeline-panel.tsx:76`) — never shows a real figure.
  - Minor: agent's 3rd stat trend `'+0 vs. last month'` (`dashboard.ts:292`) is a static placeholder; valuer's "Completed This Month" (`dashboard-copy.ts:123`) is actually an all-time count, no month filter exists.
- **Investor Market Comparison page** (`investor.ts:286-330`, `MARKET_COMPARISON_SUBURBS`) — a radar chart backed by hardcoded suburb data (median price, growth, yield, vacancy, clearance rate, population growth, supply constraint) for Richmond/Footscray/Brunswick. No backend endpoint exists at all, and some fields (clearance rate, supply constraint) aren't in the current `MarketIntelligence` schema — would need schema extension or dropping unsupported axes, not just a wiring fix.
- **AI Copilot** (`copilot-page.tsx`, `common.ts:336-344`) — entirely fake: calls `/api/copilot/conversations|suggestions|messages`, none of which exist on the backend. Independent of that, the chat UI itself has no send behavior at all — input is `readOnly`, send button has no handler — this is a static mockup, not a partially-wired feature. Header claims `"Online · GPT-4 powered"`, a false live-status claim. Would need a genuinely new AI-chat backend (could reuse the Groq integration planned for BACKEND-113) plus conversation persistence.
- **Billing/Plans page** (`plans.ts:103-104`) — `CURRENT_PLAN_ID: PlanId = 'plus'` is hardcoded for every user (the code comment admits it's a placeholder: "swap for the real user's plan once billing is wired"), shown live on Settings > Billing. No billing/subscription backend exists at all; never previously scoped in this rebuild plan.
- **Landing page hero stats** (`main-section.tsx:4-8`) — `98.5% Accuracy`, `30s Generation Time`, `10k+ Valuations` presented as live product metrics with no real telemetry behind them. Lower priority than in-app data; needs either real usage tracking or softened copy.

### Cleanup, not a functional bug

- Dead/orphaned functions with zero callers: `getSuburbOverview` (`common.ts:475-477`, points at a route that was never built), `getPropertyInputMethods` (`common.ts:373-374`, same), `valuer.ts`'s `getEvidenceListMockData`/`getEvidenceCentreMockData` (Evidence Centre page actually renders the real `ComparableSales` component instead).
- The entire `frontend/src/features/dashboard/mock/` MSW directory (~2,500 lines across `agent-handlers.ts`, `buyer-handlers.ts`, `investor-handlers.ts`, `valuer-handlers.ts`, `common-handlers.ts`, `dashboard-mock-data.ts`) plus `MOCK_API_README.md` — inert while `VITE_ENABLE_MOCKS=false`, but contains stale paths from pre-rebuild contracts (e.g. `/api/agent/clients` — the real service now calls `/api/clients` directly) and GET/POST method mismatches (ROI/affordability mocks are `GET`, real calls are `POST`) that wouldn't even work correctly if re-enabled by accident. Candidate for full deletion once every real domain above is rebuilt — no urgency while mocks stay off.

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

**Status:** Backend Done, frontend NOT wired — the original "Done" note below was wrong. Corrected 2026-09-10 during a full fake-data audit: the backend was verified for real (curl-tested `GET /api/agent/market-insights?suburb=Richmond%20VIC` just now, returns the exact real data described below), but all 4 role pages still call each service's own hardcoded `MARKET_INSIGHTS_MOCK`/`SUBURB_EXPLORER_MOCK` dictionary (`agent.ts:383-437`, `valuer.ts:138-192`, `investor.ts:185-239`, `buyer.ts:207-261` — same 3-suburb dict duplicated 4 times, `Promise.resolve(...)`, no `fetchJson` call at all) instead of the real endpoint. The frontend call sites this ticket originally claimed as "verified" (e.g. `agent.ts:432-434 → GET /api/agent/market-insights`) do not exist in the current code — only Richmond VIC has a real DB row; Fitzroy/South Yarra are mock-only fabrications with no backend counterpart. Needs a follow-up ticket: swap each service's mock function for a real `fetchJson` call, and seed Fitzroy VIC/South Yarra VIC (or drop them from each page's suggestion chips) so the "try one of these" fallback UX still works with real suburbs only.

**Raised stakes as of 2026-09-10 (later same day):** since this ticket was corrected above, `MarketIntelligence` also gained real `daysOnMarket`/`rentalYieldPct` values for 814+ suburbs (bronze data) and real `auctionClearanceRatePct`/`vacancyRatePct`/`populationGrowthPct`/`supplyConstraintDwellingApprovalsPer1000` for a 10-suburb test batch (external scrapes, see "Next task: load into Prisma..." above, and BACKEND-117). This ticket's un-fixed frontend wiring is now the single blocker keeping *all* of that real data from ever reaching the Market Insights/Suburb Explorer pages — not just a stale-mock problem anymore, but the one thing standing between a large, real, already-computed dataset and the actual app.

**Follow-up fix — Done, verified 2026-09-10.** All 4 role services (`agent.ts`, `valuer.ts`, `buyer.ts`, `investor.ts`) now call the real endpoint via `fetchJson` instead of returning a hardcoded mock (renamed `getMarketInsightsMockData`/`getSuburbExplorerMockData` → `getMarketInsights`/`getSuburbExplorer` to match reality); the dead `MARKET_INSIGHTS_MOCK`/`SUBURB_EXPLORER_MOCK` dictionaries and their `buildPriceTrend` helpers were deleted (~250 lines of fabricated data removed across 4 files). `daysOnMarket`'s type widened to `number | null` in all 4 services; all 4 pages render `'N/A'` instead of the literal string `"null"`. The Fitzroy VIC/South Yarra VIC mock-only suggestion chips were replaced with 3 real suburbs that actually have data (`Richmond VIC`, `Orange NSW`, `Box Hill NSW`). `tsc --noEmit` clean on both sides; curl-verified live for all 3 real suggestion suburbs across all 4 role paths (e.g. `GET /api/investor/suburb-explorer?suburb=Box+Hill+NSW` → real `$1.42M`, `+15.0%`, `57` days on market, `3.3%` yield).

**Original (incorrect) verification note, kept for the record:** "Done — verified 2026-09-08: `tsc --noEmit` clean; all 4 role endpoints (`agent`/`valuer` market-insights, `buyer`/`investor` suburb-explorer) return identical, correctly formatted data for Richmond VIC (`$1.28M`, `+8.2%`, `+0.68%`, `+0.12pp`, `22`, `-3 days`, `3.4%`, `+0.2%` — matching the live UI screenshot exactly) and `null` for an unknown suburb; wizard's market-intelligence-overview returns the generic array shape for a parseable address and an empty-stats fallback for an unparseable one; unauthenticated request returns 401. Seed data (Richmond VIC) added to `prisma/seed.ts`."
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

### [BACKEND-104] Refactor ComparableSale onto a shared Property table

**Status:** Done — verified 2026-09-09: `tsc --noEmit` clean; migration applied cleanly on local dev SQLite (reset + reseeded, no hand-written data migration needed); `GET /api/appraisal/comparable-sales` and `/search` (match and no-match cases) all return byte-identical shapes to pre-refactor, with real address/type/beds/baths/parking/area now sourced through the `Property` join for all 3 seeded Richmond comparables.
**Level:** 1 (schema refactor — no new user-facing feature)
**Depends on:** BACKEND-102 (Comparable Sale, Done)
**Touches a Done ticket:** this ticket's entire purpose is restructuring BACKEND-102's schema, service, controller, and seed — not a regression, a deliberate normalization ahead of BACKEND-105 (Saved Property) and the future BACKEND-108 (Report) needing the same property fields.

**Description**
`ComparableSale` currently stores `addressLine`, `suburb`, `state`, `postcode`, `propertyType`, `bedrooms`, `bathrooms`, `parking`, `areaSqm` directly. Both the upcoming Saved Property feature and the known future Report payload need the same set of columns — a real normalization case (three tables repeating the same ~8 columns), not coincidental overlap.

Resolution reached (kept here for reference): `Property` holds only high-confidence, durable-fact data — like a verified sold property. Low-confidence/placeholder data — like an honest-zero subject property from an address search, or a not-yet-built active-listing search result — never joins to it, because deduplicating by address would let a later save with real numbers silently overwrite (or be overwritten by) an unrelated placeholder for the same address. That's why Saved Property (BACKEND-105) stays a separate flat table rather than also joining here — only `ComparableSale` moves onto `Property` in this ticket.

**Schema**
```prisma
model Property {
  propertyId   String   @id @default(uuid()) @map("property_id")
  addressLine  String   @map("address_line")
  suburb       String
  state        String
  postcode     String
  propertyType String   @map("property_type")
  bedrooms     Int
  bathrooms    Int
  parking      Int
  areaSqm      Float    @map("area_sqm")
  createdAt    DateTime @default(now()) @map("created_at")

  comparableSales ComparableSale[]

  @@map("properties")
}

model ComparableSale {
  comparableId String   @id @default(uuid()) @map("comparable_id")
  propertyId   String   @map("property_id")
  property     Property @relation(fields: [propertyId], references: [propertyId])
  soldPrice    Float    @map("sold_price")
  soldDate     DateTime @map("sold_date")
  createdAt    DateTime @default(now()) @map("created_at")

  @@map("comparable_sales")
}
```
`soldPrice`/`soldDate` stay on `ComparableSale`, not `Property` — they describe a sale event, not the property itself, and the same physical property can be sold more than once over time (one-to-many: one `Property`, many `ComparableSale` rows).

**Files to change**
- `backend/prisma/schema.prisma` + migration — restructures `comparable_sales`, safe on local dev SQLite with reseedable data
- `backend/src/services/comparable-sale.service.ts` — `findComparablesInSuburb`'s `prisma.comparableSale.findMany()` adds `include: { property: true }` (Prisma's join syntax — without it, `row.property` is `undefined`); the suburb filter changes from `row.suburb` to `row.property.suburb`, since that column no longer exists directly on `ComparableSale`
- `backend/src/controllers/comparable-sale.controller.ts` — `toComparableSaleResponse` reads address/type/beds/baths/parking/areaSqm off `row.property.*` instead of `row.*`; `soldPrice`/`soldDate` keep reading straight off `row`, since those columns didn't move. The JSON shape sent to the frontend is unchanged — only where the controller reads the values from changes.
- `backend/prisma/seed.ts` — the 3 Richmond seeds each create a `Property` row first, then link the comparable sale via `propertyId`

**Acceptance Criteria**
- Given the refactor is complete, when I call `GET /api/appraisal/comparable-sales` and `/search` (BACKEND-102's endpoints), then response shapes are byte-identical to before the refactor — this ticket should be invisible from the frontend
- Given the seed data is reloaded, when I inspect the database, then each comparable sale links to its own `Property` row with the correct address/type/beds/baths/parking/area
- Given the standalone Comparable Sales page and the appraisal wizard's step 2, when I open them in the browser, then both still show real data exactly as before, with no visible change in behavior

---

### [BACKEND-105] Build Saved Property API

**Status:** Done — verified 2026-09-09: backend confirmed via curl (`tsc --noEmit` clean; GET returns `[]` then real rows across all 4 role paths; unauthenticated GET returns 401; POST creates and returns the correct shape; saving the same address twice upserts rather than duplicating; DELETE returns 204, the row is actually gone on the next GET, and deleting again 404s). All three frontend bugs fixed and confirmed by the user testing manually in the browser: Comparable Sales page's "Save Property" now persists and survives a refresh, and Saved Properties' "remove" now persists and survives a refresh. The buyer Search Properties heart-icon fix (`property-card.tsx`/`search-property.tsx`) was wired but not separately UI-tested, since its own search endpoint (`/api/buyer/properties/search`) is still unbuilt — flagged as before, not a blocker.
**Level:** 1 (independent — owned by user)
**Depends on:** BACKEND-104 (Property table exists, though `SavedProperty` itself doesn't join to it — listed for sequencing, not a data dependency)

**Description**
A single saved-property collection per user, surfaced under four page labels verified to be field-for-field identical ("Saved Properties" for agent/investor/buyer, "Saved Evidence" for valuer). Read from one shared page component (`saved-property.tsx`), written from two other pages found faking it during manual testing.

**Real bugs found during verification (this ticket fixes all three):**
1. **Remove is fake.** [saved-property.tsx:94-96](frontend/src/pages/dashboard/saved-property.tsx#L94-L96) — local state only, no API call. A "removed" item reappears on refresh.
2. **Save (from search results) doesn't exist.** [property-card.tsx:200-206](frontend/src/components/ui/property-card/property-card.tsx#L200-L206) — heart-icon button has no `onClick` at all. Confirmed the only consumer of `PropertyCard` is the buyer's Search Properties page ([search-property.tsx](frontend/src/pages/dashboard/buyer/search-property.tsx)); that page's own backend (`/api/buyer/properties/search`) doesn't exist yet either — a separate, unbuilt feature, not part of this ticket, but it means end-to-end testing of this button needs manually seeded search-result data.
3. **Save (from Comparable Sales) is fake.** [comparable-sales.tsx:141-148](frontend/src/pages/dashboard/comparable-sales.tsx#L141-L148) → `SubjectPropertyCard`'s `onSave={() => setSaved(true)}` — local state only, resets on refresh, persists nothing. The comparable-sale rows themselves have no save action at all (verified — `comparable-sale-row.tsx` has no button/icon markup); only the subject-property card above them does.

Already fixed as a prerequisite, landed separately: `searchComparableSales` was returning `subjectProperty: null` on a match, which unmounted the only card carrying bug #3's button — a successful search had no way to ever reach the save button. Fixed in [comparable-sale.controller.ts:104-110](backend/src/controllers/comparable-sale.controller.ts#L104-L110) to always return `subjectProperty`, match or not.

**Schema — flat, standalone, no relation to `Property`** (see BACKEND-104 for why — `SavedProperty` mixes verified and honest-zero/placeholder data, which is exactly what `Property` must not do)
```prisma
model SavedProperty {
  savedPropertyId String   @id @default(uuid()) @map("saved_property_id")
  ownerUserId     String   @map("owner_user_id")
  addressLine     String   @map("address_line")
  propertyType    String   @map("property_type")
  bedrooms        Int
  bathrooms       Int
  areaSqm         Float    @map("area_sqm")
  createdAt       DateTime @default(now()) @map("created_at")

  @@unique([ownerUserId, addressLine])
  @@map("saved_properties")
}
```
- `addressLine` — single display string; matches every consuming type's `address: string` field (`BuyerSavedProperty` [buyer.ts:36-44](frontend/src/services/buyer.ts#L36-L44), `InvestorSavedProperty` [investor.ts:90-98](frontend/src/services/investor.ts#L90-L98), `AgentSavedProperty` [agent.ts:315-323](frontend/src/services/agent.ts#L315-L323), `ValuerSavedEvidence` [valuer.ts:55-63](frontend/src/services/valuer.ts#L55-L63) — all four structurally identical)
- `propertyType`, `bedrooms`, `bathrooms`, `areaSqm` — same four types, same fields
- `createdAt` — computes `savedAgo` server-side, same pattern as `ComparableSale`'s `soldAgo`
- Unique on `(ownerUserId, addressLine)` — saving the same address twice is a no-op/update, not a duplicate row

**Endpoints (all require a Bearer token)**
- `GET /api/agent/properties/saved`
- `GET /api/investor/properties/saved`
- `GET /api/buyer/properties/saved`
- `GET /api/valuer/evidence/saved`

All four hit the same service/handler, scoped to the caller's `ownerUserId`, returning the identical shape — a user has one role, so this is purely a per-page URL convention, not a filtering distinction.

- `POST /api/properties/saved` — body `{ addressLine, propertyType, bedrooms, bathrooms, areaSqm }`. New; no existing frontend call site sends this today (bugs #2 and #3 currently send nothing). One shared path since both save sites create the same kind of row, not a per-role concept.
- `DELETE /api/properties/saved/:savedPropertyId` — 404 if missing or not owned by caller. Wires up bug #1's already-existing (but currently fake) remove button.

**Files to create**
- Schema addition in `backend/prisma/schema.prisma` + migration
- `backend/src/services/saved-property.service.ts`
- `backend/src/validators/saved-property.validator.ts` (create body only)
- `backend/src/controllers/saved-property.controller.ts`
- `backend/src/routes/saved-property.routes.ts`, mounted at the 4 role GET paths above + `/api/properties` for POST/DELETE

**Frontend changes needed (Step 7)**
- `saved-property.tsx`: `onRemove` calls the real `DELETE`, only updating local state after success
- `property-card.tsx`: heart button gets a real `onClick`, wired through `search-property.tsx` to the new `POST` using `PropertyCardData`'s `address`/`propertyType`/`features` fields
- `comparable-sales.tsx`: `SubjectPropertyCard`'s `onSave` calls the real `POST` using `result.subjectProperty`, only flipping to "Saved" on success
- Likely a new shared `saveProperty()` function (candidate location: `common.ts`, since the two save sites live in otherwise-unrelated role contexts)

**Acceptance Criteria**
- Given I save a property from the Comparable Sales page's subject-property card, when I refresh, then it appears in Saved Properties
- Given I save a property from the buyer Search Properties page's heart icon, when I refresh, then it appears in Saved Properties (manually seeded search-result data acceptable for this test, since that page's own search endpoint is unbuilt)
- Given I click remove on a saved property, when I refresh, then it's actually gone
- Given User A saves a property, when User B lists their saved properties, then User A's saved property does not appear
- Given I open any of the 4 role-specific saved/evidence pages while logged in, then each shows real database rows instead of an error or permanently-empty state

---

### [BACKEND-106] Build Notifications API

**Status:** Not Started
**Level:** 1 (independent — owned by user)
**Depends on:** Auth only

**Not yet verified in detail.** Believed scope: 8 endpoints (list + unread-count, × 4 roles):
- `agent.ts:243,247`, `buyer.ts:105,109`, `investor.ts:83,87`, `valuer.ts:48,52`

Need to check: the actual `InboxNotification` shape (defined in `common.ts`, shared type per earlier grep), whether notifications are ever created/marked-read from the UI (write endpoints) or purely read-only, and which page(s)/components render them (`notification.tsx`, `view-notifcation.tsx` were seen in the frontend file listing but not yet opened).

---

### [BACKEND-107] Build Inspections API

**Status:** In Progress — backend done and verified 2026-09-09 via curl (`tsc --noEmit` clean; unauthenticated GET returns 401; empty list; POST creates the 10-item default checklist correctly; list reflects it; PUT persists an edited checklist item and notes, confirmed on the next GET; PUT to a nonexistent id returns 404). Frontend wired (`createInspection()` in `buyer.ts`, "Add Inspection" modal in `inspections.tsx` following the Add Client modal's exact pattern) and `tsc --noEmit` clean, but not yet manually tested in the browser — do that before marking Done.
**Level:** 1 (independent — owned by user, buyer-specific)
**Depends on:** Auth only

**Description**
Buyer-specific, owned by user. List, create, and full-checklist update for property inspections. `inspections.tsx` is already unusually well-built for a not-yet-backed feature — it's honest about failure today, showing "Couldn't reach the server — changes kept locally" rather than faking success ([inspections.tsx:393-407](frontend/src/pages/dashboard/buyer/inspections.tsx#L393-L407)). One real bug found: "Add Inspection" ([inspections.tsx:421-424](frontend/src/pages/dashboard/buyer/inspections.tsx#L421-L424)) has no `onClick` at all — no create flow exists anywhere in the UI, so this ticket builds one from scratch rather than just wiring an existing fake.

**Schema**
```prisma
model Inspection {
  inspectionId   String   @id @default(uuid()) @map("inspection_id")
  ownerUserId    String   @map("owner_user_id")
  addressLine    String   @map("address_line")
  suburb         String
  inspectionDate DateTime @map("inspection_date")
  agentsJson     String   @map("agents_json")     // JSON-encoded string[]
  overallNotes   String   @default("") @map("overall_notes")
  checklistJson  String   @map("checklist_json")  // JSON-encoded InspectionChecklistItem[]
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  owner User @relation(fields: [ownerUserId], references: [userId], onDelete: Cascade)

  @@map("inspections")
}
```
`agents`/`checklist` stored as JSON, same precedent as `MarketIntelligence.priceTrendJson` — nothing needs to query into individual checklist items, only read/write the whole thing per inspection.

**Default checklist template (used by `POST` only)** — a real 10-item template already existed in the old MSW mock data ([buyer-handlers.ts:282-344](frontend/src/features/dashboard/mock/buyer-handlers.ts#L282-L344)): Exterior & Facade, Roof Condition, Moisture & Damp, Kitchen, Bathrooms, Electrical, Noise & Soundproofing, Natural Light, Storage, Renovation/Repair Needs. A new inspection starts with all 10 at `status: 'not_checked'`, empty `description`, no `estimatedCost` — the buyer fills them in during the actual walkthrough via the existing `ChecklistRow` UI.

**Endpoints (Bearer token required)**
- `GET /api/buyer/inspections` — list, scoped to `ownerUserId`, ordered by `inspectionDate`
- `POST /api/buyer/inspections` — body `{ addressLine, suburb, inspectionDate, agents: string[] }`; server attaches the default checklist and empty notes. New — wires up the dead "Add Inspection" button.
- `PUT /api/buyer/inspections/:id` — full replace, body matches `BuyerInspection` (address/suburb/inspectionDate/agents/overallNotes/checklist); 404 if not owned. Matches `saveBuyerInspection` exactly ([buyer.ts:77-83](frontend/src/services/buyer.ts#L77-L83)).

**Files to create**
- Schema addition in `backend/prisma/schema.prisma` + migration
- `backend/src/services/inspection.service.ts`
- `backend/src/validators/inspection.validator.ts`
- `backend/src/controllers/inspection.controller.ts`
- `backend/src/routes/inspection.routes.ts`, mounted at `/api/buyer/inspections`

**Frontend changes**
- `buyer.ts`: new `createInspection(input)` calling the `POST`
- `inspections.tsx`: "Add Inspection" button gets a small modal (address, suburb, inspection date+time, one agent name — a single agent field, not a multi-agent picker, to keep the form small) wired to `createInspection`; on success, prepend to the list and select it. Reuses existing patterns only — the Add Client modal's `createPortal`-to-`document.body` structure (needed to escape the Lenis smooth-scroll `position: fixed` bug fixed in BACKEND-101), the existing `<Button>`/`<Card>` components, and this same file's existing input styling (e.g. the Overall Notes textarea's classes at [inspections.tsx:539](frontend/src/pages/dashboard/buyer/inspections.tsx#L539)) and color tokens (`relaive-primary`/`relaive-navy`/`relaive-gray`, the page's existing `#5DA7AC`/`#4E969B` teal). No new visual style introduced.

**Acceptance Criteria**
- Given I click "Add Inspection" and submit valid details, when it succeeds, then a new inspection appears with the 10-item default checklist, all "Not Checked"
- Given I edit checklist items and click "Save Checklist," when I refresh, then my edits are still there
- Given User A creates an inspection, when User B lists theirs, then User A's doesn't appear
- Given the backend is running, when I open the Inspections page in the browser, then it shows real data instead of the "Couldn't reach the server" fallback

---

## Report — design background (applies to BACKEND-108 through BACKEND-112)

Before any of these five tickets could be drafted, the entire wizard's actual data flow had to be traced — it doesn't compose the way it visually appears to. Findings and decisions, kept here once rather than repeated in each ticket:

- Steps 1 (Comparable Sales) and 2 (Market Intelligence) show real data but historically fed nothing into the final report — the final numbers came from fully independent mock formulas. **Fixed going forward:** the final report's `estimatedValue` is a real function of Steps 1+2's data.
- **`estimatedValue` formula (locked):** average of the comparable sales found for the subject's suburb (capped set, top-N by similarity — confirmed nothing in the UI ever supported selecting individual comparables, so all of the capped set is used, not a subset). Must be flagged in code as a placeholder for a future ML-based prediction model — not the final approach.
- **No comparable snapshot** — `estimatedValue` is stored, but which specific comparables contributed isn't recorded; comparable data is stable reference data, recomputable on demand.
- **Report templates are locked per role**, not freely chosen by the user: agent→Vendor Appraisal, valuer→Bank Valuation, buyer→Buyer's Report, investor→Investment Report. Only Vendor Appraisal had real content ([common-handlers.ts:212-227](frontend/src/features/dashboard/mock/common-handlers.ts#L212-L227)); the other 3 need new content. Step 4 stays in the wizard as a read-only confirmation of the locked template, not removed from the stepper. The two `includes` checklist entries that would reference unbuilt Step 3 data ("Affordability Snapshot," "Rental Yield & ROI Snapshot") are dropped from the buyer/investor templates for now.
- **The wording was found to be 100% static fictional demo text** — a specific invented South Yarra property with fabricated heritage overlays, school catchments, laneway access, etc., completely disconnected from whatever address a user actually enters. Resolved per-section:
  - `narrativeText` (the field that's actually persisted) and `executiveSummary` → real templated sentences using actual address/estimatedValue/comparable count & range/market growth.
  - `agentRecommendations` and `appraisalDisclaimer` → kept as generic content — not factual claims about a specific property, don't need real data to be honest.
  - `propertySpecificFactors` → **dropped entirely**, same treatment as the existing Demand Signals Known Issue. No data source exists anywhere in the schema for qualitative property features (orientation, renovation state, heritage listings, school zones) — there's no real value to put there.
- **Valuer Cases:** saving a report as a valuer sets `caseStatus: 'draft'` automatically (inferred from the creator's role, no extra input); every other role leaves `caseStatus: null`. `purpose` and `hasWarning` are removed from `CaseItem` entirely — no real data source, not worth carrying dead fields. `confidence` stays, always `null` for now (future BACKEND-113/AI-narrative territory). Status changes only via an explicit action — the existing Valuation Cases status dropdown and inline address edit, both found to be fake/local-state-only ([valuation-cases.tsx:247-257](frontend/src/pages/dashboard/property-valuer/valuation-cases.tsx#L247-L257)), become real.
- **Client linking (already scoped in BACKEND-101, landing here):** if `clientName`/`clientEmail` are sent with a report, look up an existing `Client` by `(ownerUserId, email)`; if none, create one; link `clientId`.

**Schema — `Report` model**
```prisma
model Report {
  reportId            String   @id @default(uuid()) @map("report_id")
  ownerUserId         String   @map("owner_user_id")
  clientId            String?  @map("client_id")
  clientName          String?  @map("client_name")
  clientEmail         String?  @map("client_email")
  propertyAddressLine String   @map("property_address_line")
  propertySuburb      String   @map("property_suburb")
  propertyState       String   @map("property_state")
  propertyPostcode    String   @map("property_postcode")
  propertyType        String   @map("property_type")
  bedrooms            Int
  bathrooms           Int
  parking             Int
  landSizeSqm         Float    @map("land_size_sqm")
  reportTemplateId    String   @map("report_template_id")
  estimatedValue      Float    @map("estimated_value")
  narrativeText       String   @map("narrative_text")
  pdfStoragePath      String?  @map("pdf_storage_path")
  caseStatus          String?  @map("case_status")
  confidence          Float?
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  owner  User    @relation(fields: [ownerUserId], references: [userId], onDelete: Cascade)
  client Client? @relation(fields: [clientId], references: [clientId])

  @@map("reports")
}
```
`caseStatus` values, stored as plain strings (Prisma/SQLite has no native enum): `draft | evidence_collection | valuer_review | reviewer_approval | returned_for_revision | approved | exported`.

---

### [BACKEND-108] Report schema + core persistence

**Status:** Done — verified 2026-09-09: `tsc --noEmit` clean on both backend and frontend; `POST /api/reports` confirmed via curl for both branches of client matching (existing client matched by email even with a different name typed → linked via `clientId`; no match → `clientId` stays `null`, `clientName`/`clientEmail` kept as free text, no client fabricated); `caseStatus` confirmed `'draft'` for a `role: valuer` report and `null` for `role: agent`; invalid `role` correctly 400s; `GET /api/reports` (list) and `GET /api/reports/:reportId` (single, 404 if missing) both verified; unauthenticated request 401s. Frontend gaps found and fixed as part of this ticket: `persistGeneratedReport` wasn't sending `role` at all (added, with a `toReportRole` safe-fallback since the backend has no concept of dashboard roles — see the finding below); the dead `selectedComparable*`/`market*` fields were removed from the request body entirely; the fragile `narrativeText`-prefix hack for recovering a reopened report's template id was replaced with a real `reportTemplateId` column, now read directly via `PersistedReport`.

**Real finding during implementation, not anticipated when this ticket was drafted:** the backend has no concept of agent/valuer/buyer/investor at all — `Role` only ever contains `user`/`admin` ([seed.ts](backend/prisma/seed.ts)), and every JWT's `roles` claim is always `['user']`. `/dashboard/:role/...` is purely a frontend routing choice with zero backend enforcement. This meant `caseStatus`'s "is this a valuer" check could never come from auth — the frontend now sends `role` explicitly in the `POST /api/reports` body, and the backend just trusts it (`createReportSchema`'s `role` enum, `report.validator.ts`).

**Level:** 2 (composite — depends on Client, Comparable Sale, both done)
**Depends on:** BACKEND-101 (Client, done), BACKEND-102/104 (Comparable Sale + Property, done)

**Description**
The `Report` model (above) + migration, and the actual save/read endpoints. `estimatedValue` is accepted as a plain input field for now — BACKEND-109 replaces that with the real computed value once it exists. This ticket alone unblocks `GET /api/reports`, already relied upon by BACKEND-101's `getClientListMockData` (currently tolerated via `Promise.allSettled`) and the dashboard stats.

**Endpoints**
- `POST /api/reports` — body matches `persistGeneratedReport`'s payload ([common.ts:128-136](frontend/src/services/common.ts#L128-L136)): `role`, `clientName?`, `clientEmail?`, property fields, `reportTemplateId`, `estimatedValue`, `narrativeText`. Client matching runs here: looks up an existing client by name OR email (case-insensitive) — if found, links `clientId`; if not, no client is created, `clientName`/`clientEmail` are just kept as free text on the report. `caseStatus` set to `'draft'` if `role === 'valuer'`, else `null`.
- `GET /api/reports` — raw list, owner-scoped, `{ success, data }` envelope (matches `StoredReportRow`/`StoredReportResponse` usage in `agent.ts`/`dashboard.ts`)
- `GET /api/reports/:reportId` — single, same envelope (matches `PersistedReport`/`getPersistedReport`, [common.ts:103-127](frontend/src/services/common.ts#L103-L127)), used to hydrate the wizard when reopening a saved report

**Files to create**
- Schema addition + migration
- `backend/src/services/report.service.ts`
- `backend/src/validators/report.validator.ts`
- `backend/src/controllers/report.controller.ts`
- `backend/src/routes/report.routes.ts`, mounted at `/api/reports`

**Acceptance Criteria**
- Given I save a report with a client name/email, when I check Clients, then a matching client exists (created or matched by email) and is linked via `clientId`
- Given I save a report as a valuer, when I inspect the row, then `caseStatus` is `'draft'`; as any other role, then it's `null`
- Given I reopen a saved report via its `reportId`, when the wizard loads, then it hydrates with the saved property details

---

### [BACKEND-109] Real appraisal-summary computation

**Status:** Done — verified 2026-09-09: `tsc --noEmit` clean on both sides; `GET /api/appraisal/appraisal-summary` confirmed via curl for a real Richmond match (midpoint $1,096,667 = average of the 3 seeded comparables, range $620,000–$1,420,000, real `days-on-mkt`/`annual-growth` pulled from `MarketIntelligence`), an unknown suburb (honest `$0`/`N/A`, not fabricated), and an unparseable address (same honest-empty fallback); unauthenticated request 401s. **No frontend code changes were needed** — `getAppraisalSummary()` in `common.ts` was already calling this exact URL with the exact query params (`withAppraisalContext` already appends `address`/`propertyType`/`bedrooms`/`bathrooms`/`parking`/`landSizeSqm`), so the wizard picked up the real computation automatically once the endpoint existed. Dropped the old mock's fabricated `clearance-rate` stat (no data source anywhere in the schema) rather than carrying it forward as fake.
**Level:** 2
**Depends on:** BACKEND-108 (Report persistence, for `estimatedValue` to eventually feed into), BACKEND-102/104 (Comparable Sale), BACKEND-103 (Market Intelligence)

**Description**
Replaces the independent mock `appraisal-summary` formula with a real one: fetch the same comparable set Step 1 already computes, average their prices per the locked formula, and derive `priceRange`/`midpoint` from the same set.

**Endpoint**
- `GET /api/appraisal/appraisal-summary?address=&propertyType=&bedrooms=&bathrooms=&parking=` — returns `{ priceRange, midpointEstimate, street, suburbLine, featuresLine, stats }` matching `AppraisalSummary` ([common.ts:424-434](frontend/src/services/common.ts#L424-L434)). `priceRange` = min–max of the comparable set, `midpointEstimate` = the average (same number as `estimatedValue`).

**Files to create**
- `backend/src/controllers/appraisal-summary.controller.ts` (reuses `comparable-sale.service.ts`'s `findComparablesInSuburb` and `market-intelligence.service.ts`'s lookup — no new service needed)
- `backend/src/routes/appraisal-summary.routes.ts`, mounted at `/api/appraisal`

**Frontend changes**
- `generated-report-container.tsx`: `estimatedValue` passed to `persistGeneratedReport` now comes from this real endpoint's `midpointEstimate`, not a hardcoded parse of mock data (mechanically the same `parseCurrency(appraisalSummary.midpointEstimate)` call, just now backed by real data)

**Acceptance Criteria**
- Given comparable sales exist for a suburb, when I call this endpoint, then `midpointEstimate` equals the average of those comparable prices, and `priceRange` spans their min–max

---

### [BACKEND-110] Report templates + real wording

**Status:** Done — verified 2026-09-09: `tsc --noEmit` clean on both sides; all 5 endpoints confirmed via curl (`report-templates` returns the correct locked object per role, 400 without a valid role; `executive-summary`/`narrative-preview` build real sentences from real comparable+market data, including a genuinely-derived "primary comparable" observation using the best-matched real comparable sale — not a fabricated one; `agent-recommendations`/`appraisal-disclaimer` return static generic content); a full pipeline check (template → narrative-preview → appraisal-summary → `POST /api/reports`) confirmed all four calls agree on the same numbers end-to-end.

**Real deviations from the original draft, found during implementation:**
- `getReportTemplates()` in the frontend took no `role` and returned an **array** — inconsistent with "locked per role." Changed to `getReportTemplate(role)` returning a single object; both call sites (`report-configuration-panel.tsx`, `generated-report-container.tsx`) updated accordingly.
- Report templates ended up as static in-code data (`REPORT_TEMPLATES` record in `report-content.service.ts`), not a seeded DB table as originally drafted — consistent with the same pattern just used for `appraisal/steps` and `/property-types` (BACKEND-108's follow-up fix); there's no per-user variation to justify persistence.
- `report-configuration-panel.tsx` was rewritten from a multi-option `OptionCardGroup` selector into a read-only confirmation of the one locked template — the selection UI no longer made sense with nothing to choose between. `generate-report.tsx`'s now-pointless `selectedTemplateId` state (and its narrativeText-prefix-based hydration logic) was removed along with it, now that `reportTemplateId` is a real column read directly.
- `GeneratedReportPanel`'s `twoColumnSection` prop made optional and its rendering conditionally guarded, since nothing built it anymore once `propertySpecificFactors` was dropped.
- `ExecutiveSummary`'s `observationMessage` — previously a fabricated reference to a specific fictional comparable sale — is now real: it names whichever real comparable sale ranks highest by similarity (`findComparablesInSuburb` already sorts best-match-first), not an invented one.

**Level:** 2
**Depends on:** BACKEND-109 (real appraisal-summary data to build wording from)

**Description**
Locked-per-role templates (4 total, 3 newly written) and real templated wording for `narrativeText`/`executiveSummary`, replacing 100% fictional static content. `agentRecommendations`/`appraisalDisclaimer` stay generic. `propertySpecificFactors` is dropped entirely, not rebuilt.

**New template content (Bank Valuation, Buyer's Report, Investment Report — Vendor Appraisal already exists)**
```
bank-valuation:    "Bank Valuation" — lending/mortgage security purposes
                   includes: Estimated Value Range, Market Analysis, Property Description,
                   Comparable Sales Evidence, Risk & Compliance Assessment, Valuer Certification
buyer-report:      "Buyer's Report" — assessing fair market value before an offer
                   includes: Estimated Value Range, Market Analysis, Property Description,
                   Comparable Sales Evidence, Negotiation Guidance
investment-report: "Investment Report" — yield/growth analysis for investors
                   includes: Estimated Value Range, Market Analysis, Property Description,
                   Comparable Sales Evidence, Growth Outlook
```

**Endpoints**
- `GET /api/appraisal/report-templates?role=` — returns the one locked template object for that role; 400 if role missing/unrecognized
- `GET /api/appraisal/executive-summary?address=...` — real templated paragraph from the same comparable/market data as BACKEND-109
- `GET /api/appraisal/narrative-preview?address=&reportType=` — real templated sections, same underlying data
- `GET /api/appraisal/agent-recommendations` — static generic content
- `GET /api/appraisal/appraisal-disclaimer` — static legal text

**Files to create**
- `backend/src/services/report-content.service.ts` (the templated-wording logic, kept separate from persistence)
- `backend/src/controllers/report-content.controller.ts`
- `backend/src/routes/report-content.routes.ts`, mounted at `/api/appraisal`
- Seed: 4 report templates

**Frontend changes**
- `generated-report-container.tsx`: remove `getPropertySpecificFactors` and the `twoColumnSection` it builds, entirely
- `report-configuration-panel.tsx`: fetches the role-locked template (passing role) instead of a selectable list

**Acceptance Criteria**
- Given a real address with real comparables, when I view the generated report, then the narrative text describes the actual address, comparable count/range, and market stats — not the old fictional South Yarra content
- Given I open Step 4 for any role, then it shows only that role's locked template
- Given the generated report renders, then no Property-Specific Factors section appears anywhere

---

### [BACKEND-111] Per-role report/case list views

**Status:** Done — verified 2026-09-09: `tsc --noEmit` clean; created one report per role via curl, confirmed each role's list endpoint returns exactly its own report and none of the others (agent/buyer/investor: 1 row each; valuer/cases: 1 row, `status: "draft"`); summary endpoints and unauthenticated 401 both confirmed.

**Real schema gap found and fixed during implementation, not anticipated in the original draft:** `Report` had no `role` column — BACKEND-108 only ever used `role` transiently (from the request body) to decide `caseStatus`, then discarded it. Since the backend has no auth-level concept of dashboard roles (established in BACKEND-108), `listReportsByOwner(ownerUserId)` returned *every* report that account had ever saved regardless of role — meaning `GET /api/agent/reports`, `/api/buyer/reports`, and `/api/investor/reports` would all have returned the identical list, and an early version of the valuer cases handler (using `row.caseStatus ?? 'draft'` as a display fallback) leaked non-valuer reports into the case list mislabeled as drafts. Fixed by adding a required `role` column to `Report` (migration `add_report_role`; dev DB reset first since it only held disposable test rows), persisting it on create, and adding `listReportsByOwnerAndRole(ownerUserId, role)` — every list endpoint now filters by its own exact role.

**Level:** 2
**Depends on:** BACKEND-108 (Report table)

**Description**
Read-only reshaping of `Report` rows into each role's existing list-page shape — same duplication pattern as Market Intelligence, verified: `AgentClientReport`/`BuyerReportListItem`/`InvestorReportListItem` are field-for-field identical; `CaseItem` (valuer) has its own shape (`purpose`/`hasWarning` removed per the design decisions above).

**Endpoints**
- `GET /api/agent/reports`, `GET /api/buyer/reports`, `GET /api/investor/reports` — identical shape: `{ id, address, suburb, clientName, status: 'generated'|'shared', estimatedValue, beds, baths, areaSqm, updatedAt }`
- `GET /api/investor/reports/summary` — `{ totalReports, draftCount, sharedCount }`
- `GET /api/valuer/cases` — `{ id, address, suburb, clientName, status: CaseStatus, confidence: number|null, updatedAt }`
- `GET /api/valuer/cases/summary` — `{ totalCases, returnedForRevision }`

**Files to create**
- `backend/src/controllers/report-list.controller.ts` (one handler reused across agent/buyer/investor routes, given identical shape; a separate handler for valuer's cases)
- `backend/src/routes/report-list.routes.ts`, mounted at each role's exact path

**Acceptance Criteria**
- Given reports exist, when I open each of the 4 role list pages, then each shows real data in its existing expected shape
- Given a report has no client attached, then `clientName` reflects that honestly (not a fabricated placeholder)

---

### [BACKEND-112] Valuer case-status wiring

**Status:** Done — verified 2026-09-09: `tsc --noEmit` clean on both sides; `PATCH /api/valuer/cases/:reportId` confirmed via curl for status update, address update (both persisted, confirmed on the next GET), invalid status 400s with the full enum listed, and a nonexistent id 404s. Scoped to `role: 'valuer'` in addition to `ownerUserId` (via `updateValuerCase` in `report.service.ts`), consistent with BACKEND-111's role-filtering fix — a case update can't accidentally touch a non-valuer report even if the id were guessed. `CaseItem`'s `clientName` also corrected to `string | null` (was incorrectly typed as always-`string`) to match what the backend actually returns.
**Level:** 2
**Depends on:** BACKEND-111 (case list view)

**Description**
Fixes the two fake/local-state-only actions on the Valuation Cases page found during design discussion: address edit and status change.

**Endpoint**
- `PATCH /api/valuer/cases/:reportId` — body `{ addressLine?, status? }`, partial; 404 if not owned. Address edit updates `propertyAddressLine` only (not suburb/state/postcode — avoids re-triggering the known address-parsing fragility already flagged in Known Issues).

**Files to create**
- `backend/src/controllers/case-status.controller.ts`
- `backend/src/routes/case-status.routes.ts`, mounted at `/api/valuer/cases`

**Frontend changes**
- `valuation-cases.tsx`: `handleAddressChange`/`handleStatusChange` ([valuation-cases.tsx:247-257](frontend/src/pages/dashboard/property-valuer/valuation-cases.tsx#L247-L257)) call the real `PATCH`, only updating local state after success
- Drop `purpose`/`hasWarning` from `CaseItem` and their rendering in `ValuationCaseCard` ([valuation-cases.tsx:178-184](frontend/src/pages/dashboard/property-valuer/valuation-cases.tsx#L178-L184), [187-199](frontend/src/pages/dashboard/property-valuer/valuation-cases.tsx#L187-L199))

**Acceptance Criteria**
- Given I change a case's status via the dropdown, when I refresh, then the change persisted
- Given I edit a case's address inline, when I refresh, then the change persisted

---

### [BACKEND-113] Re-wire AI Narrative Generation

**Status:** Not Started
**Level:** 3 (depends on Report having real data)
**Depends on:** BACKEND-108 through 110 (Done — Report, real appraisal computation, real wording all exist)

**Findings from investigation:** A full Groq pipeline existed before the clean-foundation reset and is recoverable near-verbatim via `git show 643b1ec:<path>`:
- `backend/src/services/groq.service.ts` — thin `fetch` wrapper around Groq's OpenAI-compatible `/chat/completions`, throws `GroqConfigError` (no key) / `GroqRequestError` (request failed). No SDK dependency needed.
- `backend/src/services/narrative-prompts.ts` — one system prompt per report type (`vendor-appraisal`, `bank-valuation`, `buyer-advisory`, `investment-report`), each with audience/tone/rules and a `buildUserMessage(context)`. **Report type ids must be updated**: current locked templates ([report-content.service.ts:21-80](backend/src/services/report-content.service.ts#L21-L80)) use `buyer-report`, not `buyer-advisory` — rename that key when restoring.
- `backend/src/services/narrative.service.ts` — `generateNarrative(reportType, context)`, ties the two together.
- `backend/src/config/env.ts` already exposes `env.groq.{apiKey,model,baseUrl,temperature,maxTokens}`; `backend/.env` already has a real `GROQ_API_KEY` set (model `openai/gpt-oss-120b`); `.env.example` documents all vars. No new config plumbing needed.
- README/backend README already document the intended contract: **graceful fallback** — if `GROQ_API_KEY` is unset or the Groq call fails, fall back to static placeholder text (never error the endpoint), logging `Groq narrative generation failed...`.

**Scope decision:** only `buildNarrativePreview` becomes AI-generated (it's what gets concatenated client-side into `Report.narrativeText` on save — the actual persisted narrative). `buildExecutiveSummary` stays deterministic — it's a numbers-driven summary block (range/midpoint/growth stat), not prose, and keeping it formula-based avoids a second LLM call per page load and guarantees the figures shown can't drift from the real computed values.

**Design**
- Restore `groq.service.ts` and `narrative.service.ts` as-is (or near enough); restore `narrative-prompts.ts` with the `buyer-report` id fix, and update `NarrativeContext` to match what `buildRealEvidence()` in `report-content.service.ts` already computes (comparables, price range, midpoint, growth/days stats) rather than re-deriving it.
- `buildNarrativePreview(subject, templateTitle)` in `report-content.service.ts`: after computing `evidence` via `buildRealEvidence`, call `generateNarrative(reportType, context)` instead of hand-building the two template strings. Needs the `reportType` id passed down from the controller (already available as `req.query.reportType` in `getNarrativePreview` — just needs threading into the service call, currently only `templateTitle` is passed).
- On `GroqConfigError`/`GroqRequestError` (or any thrown error), catch and fall back to today's existing deterministic two-section text (don't delete it — repurpose as the fallback path) plus a server log line `Groq narrative generation failed: <message>`.
- Split the single returned narrative text into the existing `sections: [{heading, body}]` shape the frontend expects — either ask Groq for the two labeled sections directly (adjust prompts' "no headings" rule to instead request an "Executive Summary:" / "Market Analysis:" split), or keep one `sections[0]` with the full prose and drop the second heading. Prefer the labeled-two-section approach to avoid a frontend shape change.

**Files to change**
- Restore: `backend/src/services/groq.service.ts`, `backend/src/services/narrative-prompts.ts` (id fix), `backend/src/services/narrative.service.ts`
- Edit: `backend/src/services/report-content.service.ts` (`buildNarrativePreview`), `backend/src/controllers/report-content.controller.ts` (thread `reportType` through)
- No frontend changes expected — response shape (`{title, sections, disclaimer}`) stays the same.

**Acceptance Criteria**
- Given `GROQ_API_KEY` is set and valid, when I view Step 4 or the Generated Report step, then the narrative text is genuinely AI-generated prose (not the old hand-templated sentences) and grounded only in real comparable/market data already computed for that subject property
- Given the Groq call fails (bad key, network error, rate limit), when I view the same steps, then the page still renders using the deterministic fallback text — no 500, no blank state
- Given two different roles/report types for the same property, then the generated narrative's tone/content differs according to that role's prompt (vendor vs. bank vs. buyer vs. investor)

---

### [BACKEND-114] Content & Navigation (lower priority)

**Status:** Not Started
**Level:** unclear — not yet investigated
**Depends on:** unclear

**Not yet drafted.** Whatever the old, deleted `content.controller.ts`/`navigation.controller.ts` served. Lower priority — the app still renders without it. Needs its own investigation pass before drafting: what did the frontend actually call, and does anything still reference those endpoints today.

---

### [BACKEND-115] ROI & Cash Flow Calculator (investor)

**Status:** Done — verified 2026-09-09/10: `tsc --noEmit` clean on both sides. `POST /api/investor/roi-calculation` curl-tested with realistic inputs (internally consistent numbers, unlike the old mock data) and edge cases (`deposit: 0` → `cashOnCashReturnPct: null`/`N/A` shown in neutral tone, not fabricated `Infinity`; invalid body → 400). Verified `POST /api/reports` persists all 4 ROI columns for `role: investor` and leaves them `null` for `role: agent` by fetching both back via `GET /api/reports/:id`. Both surfaces (`roi-analysis-panel.tsx` wizard step and standalone `ROI-calculation.tsx`) wired to real state and the real endpoint, mock data function removed. Purchase Price pre-fills from the real `estimatedValue` in the wizard panel only (standalone page has no subject-property context, as scoped). "Growth Outlook" bullet removed from the investor template per the resolved design gap (see decision #3 below) — no generated-report UI surfaces the ROI numbers yet, deferred to a future ticket if needed.

**Real bug found and fixed post-implementation:** both ROI surfaces rendered blank/stuck-on-"Loading…" in the actual browser. Root cause was pre-existing, not something this ticket introduced: `getRoiDisclaimerNotification()`/`getAffordabilityDisclaimerNotification()` (`common.ts`) fetched `/api/notifications/roi-disclaimer` and `/api/notifications/affordability-disclaimer` — routes that never existed on the real backend (the Notifications domain, BACKEND-106, is still deferred). Both panels gate all rendering on that call resolving, so it silently stalled forever once mocks were off; nobody had noticed because Step 3 was skipped all session until now. Fixed by making both functions return their static disclaimer text directly (`Promise.resolve(...)`, wording taken from the old mock minus the "MOCK ONLY!" prefix) instead of a network call — this is static compliance copy, not real notification data, so it never needed the Notifications backend at all. Also added missing `.catch` handling on both panels' calculation effects (was previously an unhandled rejection that would've caused the identical stuck-loading symptom on any calculation failure, not just this one).

**Follow-up (2026-09-10): Growth Outlook actually built.** After the above shipped, the decision to drop the "Growth Outlook" checklist bullet was revisited — added back as a real section instead. New `GET /api/appraisal/growth-outlook` (query params `roiGrossYieldPct`/`roiNetYieldPct`/`roiMonthlyCashFlow`/`roiCashOnCashReturnPct`, all optional) backed by `buildGrowthOutlook()` in `report-content.service.ts`: quotes the real numbers in prose when present, or an honest "Run the ROI Analysis step..." message when absent — never a fabricated figure. `common.ts` gained `getGrowthOutlook()` and the 4 ROI columns on `PersistedReport`. `generated-report-container.tsx` adds a "Growth Outlook" section (investor role only) to the report's `sections` array, sourced via `resolveRoiForDisplay()`: a **reopened** saved report uses its own persisted ROI columns (Step 3 is skipped entirely when jumping straight to the last step via `?ready=1`, so the local ROI store would be stale/empty), while a **freshly-generated** report uses the just-computed Step 3 result from local storage. `persistGeneratedReport` now accepts an optional `roi` override so re-saving a reopened report keeps its original values rather than being overwritten by an unrelated session's local storage. "Growth Outlook" bullet restored to the investor template's `includes` array since it's now true. Curl-verified all 3 cases: no params (fallback message), full params (real prose with correct singular/plural framing), params with null cash-on-cash (grammatically correct "could not be calculated" sentence, fixed after first draft read awkwardly).
**Level:** 2 (purchase-price default reads the real comparable-derived `estimatedValue`; results persist onto Report)
**Depends on:** BACKEND-108/109 (Report, real appraisal-summary estimate)

**Design decisions (locked):**
1. Backend owns the math — a stateless endpoint, not client-side arithmetic.
2. The Purchase Price field defaults to the subject property's real `estimatedValue` (via the existing `GET /api/appraisal/appraisal-summary`, already fed by the localStorage appraisal context) — editable, not locked.
3. Results persist onto `Report` (new nullable columns) for future use. **Revised after investigation:** there is no existing "Growth Outlook" section anywhere in the generated report UI — it was only a checklist bullet on the Report Configuration step's "Report will include" list, promising content that was never built. That bullet has been removed from the investor template's `includes` array rather than building a section to match it (honest-checklist principle, same as dropped `propertySpecificFactors`/Demand Signals). No generated-report display of these numbers for now — may be revisited as its own ticket later.

**Formulas** (standard investment-property mortgage math):
- `loanAmount = purchasePrice − deposit`
- `monthlyRepayment` = standard amortization on `loanAmount` at `interestRate/12` over `loanTermYears × 12` months (handle `interestRate === 0` as a straight-line special case)
- `grossAnnualRent = weeklyRent × 52`; `effectiveAnnualRent = grossAnnualRent × (1 − vacancyAllowance%)`
- `managementFees = effectiveAnnualRent × managementFee%`
- `annualOperatingExpenses = councilRates + landlordInsurance + maintenance + landTax`
- `netAnnualCashFlow = effectiveAnnualRent − managementFees − annualOperatingExpenses − (monthlyRepayment × 12)`
- `grossYield% = grossAnnualRent / purchasePrice × 100`
- `netYield% = (effectiveAnnualRent − managementFees − annualOperatingExpenses) / purchasePrice × 100` (excludes financing — standard net yield definition)
- `cashOnCashReturn% = netAnnualCashFlow / deposit × 100` (null/undefined if `deposit` is 0)
- `breakEvenWeeklyRent` = the weekly rent at which `netAnnualCashFlow = 0`, solved algebraically from the same relations above

**Endpoint**
- `POST /api/investor/roi-calculation` — stateless; body = all form inputs (`purchasePrice, deposit, interestRate, loanTermYears, weeklyRent, vacancyAllowance, managementFee, councilRates, landlordInsurance, maintenance, landTax`); returns the existing `RoiCalculationMock` shape (`annualSummary`, `metrics`, `investmentReturns`) computed for real. No persistence at this endpoint itself — shared by both surfaces below.

**Frontend changes**
- `roi-analysis-panel.tsx` (wizard Step 3, investor-only via `getExtraStepForRole`) and `pages/dashboard/investor/ROI-calculation.tsx` (standalone): wire the existing input fields to real state, call the new endpoint (on submit or per-change — implementer's call), replace `getRoiCalculationMockData()`.
- Purchase Price field pre-fills from `getAppraisalSummary()`'s `estimatedValue` (wizard panel only — the standalone page has no subject-property context, leave its default blank/0).
- New small localStorage-backed store (mirroring `AppraisalInputContext`'s pattern in `common.ts`) holding the last-computed ROI result, set whenever the wizard panel's calculation last runs. `generated-report-container.tsx`'s `persistGeneratedReport` call reads it and includes the 4 metrics in the `createReport` body when `role === 'investor'`.
- Remove the "Growth Outlook" bullet from the investor template's `includes` array (`report-content.service.ts`) — no section exists to back that promise.

**Schema**
- Add 4 nullable `Float?` columns to `Report`: `roiGrossYieldPct`, `roiNetYieldPct`, `roiMonthlyCashFlow`, `roiCashOnCashReturnPct` (only ever populated for `role: 'investor'`).

**Backend plumbing into report creation** (the actual save path — not just the schema):
- `backend/src/validators/report.validator.ts`: add the 4 fields to `createReportSchema` as optional nullable numbers.
- `backend/src/services/report.service.ts`: `createReport` writes them to the new columns when present in `input`, otherwise `null` — no other role should ever send them, but the service doesn't need to enforce that (validator + frontend already scope it to investor).
- `backend/src/services/dashboard.ts`'s `StoredReportRow`/report-list types don't need these fields unless a future ticket surfaces ROI numbers on a list view — out of scope here.

**Acceptance Criteria**
- Given I open Step 3 as an investor, then Purchase Price is pre-filled with the real estimated value for the subject property
- Given I enter ROI inputs and the calculation runs, when I check the network tab, then the numbers come from `POST /api/investor/roi-calculation`, not static mock data, and change when I change an input
- Given I complete a report as an investor after running the ROI calculator, then the report row saved in the database has the 4 ROI columns populated with the real computed numbers, and the Generated Report view shows a real "Growth Outlook" section quoting them
- Given I skip or never touch Step 3 (or use the standalone calculator page, unrelated to any report), then the report's ROI columns are `null` and the Growth Outlook section shows an honest "run the ROI step" message, not a fabricated figure
- Given I reopen a previously saved investor report (which skips Step 3 entirely), then the Growth Outlook section shows that report's own saved ROI numbers, not stale data from local storage
- Given I view Step 4 (Report Type) as an investor, then the checklist's "Growth Outlook" bullet is genuinely backed by real content
- Given `deposit` is 0, then `cashOnCashReturn%` is `null`, not `Infinity`/`NaN`

---

### [BACKEND-116] Affordability Calculator (buyer)

**Status:** Done — verified 2026-09-10: `tsc --noEmit` clean on both sides. `POST /api/buyer/affordability-calculation` curl-tested across 4 cases (healthy income, moderately obligated, heavily obligated, all-zero) plus invalid-body 400. `GET /api/appraisal/affordability-outlook` curl-tested (no-params fallback, real params). Full report round trip verified: buyer report saves the 3 real columns, agent report gets `null`s, reopened report returns its own saved values.

**Findings from investigation:** same shape of problem as BACKEND-115. Two surfaces share one dead mock call (`getAffordabilityCalculationMockData()` in `buyer.ts`, `/api/buyer/affordability-calculation` never existed for real): the wizard's Step 3 `affordability-panel.tsx` (buyer-only, via `getExtraStepForRole`) and standalone `pages/dashboard/buyer/affortability-calculation.tsx`. Both have built input forms with a no-op `Calculate` button; displayed numbers were static regardless of input.

**Real inconsistency found and fixed:** the wizard panel's "Loan Details" section actually had **Interest Rate + Loan Term** fields, while the standalone page had **Council Rates + Landlord Insurance** there instead — the two surfaces never collected the same fields despite sharing an identical output shape. Flagged to the user mid-implementation; resolved by unifying both on Council Rates + Landlord Insurance (matching the standalone page and the already-built backend), removing Interest Rate/Loan Term from the wizard panel entirely.

**Design decisions (locked):**
1. Backend owns the math — stateless endpoint, not client-side arithmetic (same as BACKEND-115).
2. Assumed constants, since no rate/term input exists on the unified form: **6.5% p.a. interest rate, 30-year term** — disclosed via the existing disclaimer ("estimates only, confirm borrowing capacity with your lender").
3. Results persist onto `Report` (buyer-only nullable columns) and feed a real "Affordability" section in the Generated Report — same pattern as investor's Growth Outlook: honest fallback message if the buyer skipped Step 3 or reopens a report that never had it, real numbers otherwise. A reopened report uses its own persisted columns; a fresh generation uses the just-computed Step 3 result (`resolveAffordabilityForDisplay`, mirrors `resolveRoiForDisplay`).

**Formulas (revised after a real bug found in testing):** the first version capped nothing, so a high-income/low-expense buyer got a nonsensical result — 80% "repayment-to-income" flagged as `'Stretched'` with a $2M+ borrowing capacity, because "leftover after expenses" was amortized directly with no ceiling, and the banding treated a *high* leftover ratio as bad when it's actually good. Real lenders cap the assessable repayment at a fixed ceiling (~30% of gross income) regardless of how much is technically left over — fixed to:
- `grossMonthlyIncome = (yourAnnualIncome + partnerAnnualIncome) / 12`
- `monthlyObligations = existingMonthlyDebt + monthlyLivingExpenses + (councilRates + landlordInsurance) / 12`
- `availableMonthlyRepayment = max(0, grossMonthlyIncome − monthlyObligations)` (the true leftover, uncapped — used only for banding, not for the loan-amount conversion)
- `idealCeiling = grossMonthlyIncome × 0.30`
- `assessedMonthlyRepayment = min(availableMonthlyRepayment, idealCeiling)` — this is what actually gets amortized into a loan amount, so borrowing capacity is never inflated past what a real lender would assess
- `maxLoanAmount` = reverse-amortized from `assessedMonthlyRepayment` at 6.5%/30yr (invert the same amortization formula `roi-calculation.service.ts` uses for `monthlyLoanRepayment`, solved for principal)
- `estimatedBorrowingCapacity = maxLoanAmount + availableDeposit`
- `repaymentToIncomePct = grossMonthlyIncome > 0 ? (assessedMonthlyRepayment / grossMonthlyIncome) × 100 : 0` (always ≤30% by construction — a display of how close to the ideal ceiling they can reach, not a risk signal on its own)
- Affordability banding compares the **uncapped** `availableMonthlyRepayment` against `idealCeiling` (the actual risk signal — how much room existing obligations leave, not the capped display ratio): `≥ idealCeiling` → `'Comfortable'` (green); `≥ idealCeiling × 0.5` → `'Moderate'` (orange); else `'Stretched'` (red); `grossMonthlyIncome === 0` → `'N/A'` (navy)

**Endpoint**
- `POST /api/buyer/affordability-calculation` — stateless; body = the 7 form inputs; returns the existing `AffordabilityCalculationMock` shape (`summary`, `metrics`) computed for real, plus raw figures for persistence (`estimatedBorrowingCapacity`, `maxLoanAmount`, `repaymentToIncomePct`).

**Frontend changes**
- `affordability-panel.tsx` and `affortability-calculation.tsx`: wire inputs to real state, call the new endpoint, remove `getAffordabilityCalculationMockData()`.
- No purchase-price-style prefill needed (affordability isn't tied to one property's price the way ROI's purchase price is).
- New localStorage-backed store (mirroring `RoiPersistResult`/`setRoiResult` in `common.ts`) holding the last-computed affordability result; `persistGeneratedReport` includes it in the `createReport` body when `role === 'buyer'`, with the same explicit-override parameter as `roi` so a reopened report keeps its own saved values on re-save.
- New `GET /api/appraisal/affordability-outlook`-style content endpoint (mirroring `growth-outlook`) for the Generated Report section text; add to buyer template's `includes` list once real.

**Schema**
- Add 3 nullable `Float?` columns to `Report`: `affordabilityEstimatedBorrowingCapacity`, `affordabilityMaxLoanAmount`, `affordabilityRepaymentToIncomePct` (buyer-only).

**Backend plumbing into report creation**
- `report.validator.ts`: add the 3 fields as optional nullable numbers.
- `report.service.ts`: `createReport` writes them when present, else `null`.

**Acceptance Criteria**
- Given I enter income/expense inputs, when the calculation runs, then the numbers come from `POST /api/buyer/affordability-calculation` and change when I change an input
- Given all incomes/expenses are 0, then `repaymentToIncomePct` is 0 and the banding is `'N/A'`, not `NaN`/a crash
- Given I complete a report as a buyer after running the calculator, then the saved report has the 3 affordability columns populated and the Generated Report shows a real "Affordability" section quoting them
- Given I skip Step 3 or reopen a report that never had it, then the columns are `null` and the section shows an honest fallback message

---

### [BACKEND-117] Build Investor Market Comparison API + wire up 4 real fields

**Status:** Done — verified 2026-09-10. Backend: `tsc --noEmit` clean; curl-tested `GET /api/investor/market-comparison` with a real Bearer token, returned exactly the 2 suburbs (Orange, Goulburn) with complete real data out of the 10-suburb test batch — all 8 fields real, no fabrication, no crash on the 8 incomplete suburbs (correctly omitted instead of included with nulls). Frontend: `tsc --noEmit` clean; `investor.ts` now calls the real endpoint; `market-comparision.tsx`'s Supply Constraint column relabeled from a fabricated "/100 score" format to its real unit ("New Supply (per 1,000 residents)"), since the field is a plain ratio now, not a normalized score.

**Implementation decision (deviates from the original ticket draft above):** rather than redesign the radar chart/table's normalization and formatting logic to tolerate a per-field mix of real values and `null` (a much larger UI change), the endpoint only returns suburbs with a **complete** real value for every field — an incomplete suburb is omitted entirely, not included with nulls. Same "honest gap over a fabricated number" principle, just applied at the suburb level instead of the field level. Coverage will grow as more suburbs get scraped (see the "scale to all suburbs" step, not yet done).

**Why now:** `MarketIntelligence` just got 4 new real, populated columns (2026-09-10, verified against a 10-suburb test batch — see "Next task: load into Prisma..." above) via `data_ai/ingestion`'s Domain/ABS/SQM scripts + `backend/scripts/load-external-market-data.ts`: `auctionClearanceRatePct`, `vacancyRatePct`, `populationGrowthPct`, `supplyConstraintDwellingApprovalsPer1000`. **None of it is reachable from the app right now** — confirmed by grep: `backend/src` has zero routes/controllers/services matching `market-comparison`, and `frontend/src/services/investor.ts:328`'s `getMarketComparisonSuburbs()` still just returns the hardcoded `MARKET_COMPARISON_SUBURBS` array via `Promise.resolve`. This ticket is what actually makes that real data visible.

**Endpoint to build**
- `GET /api/investor/market-comparison?suburbs=Richmond+VIC,Fitzroy+VIC,...` (or similar) — new route/controller/service reading `MarketIntelligence` rows for the requested suburbs and shaping them into the existing `MarketComparisonSuburb` frontend type (`investor.ts:251-259`): `medianHousePrice`, `medianUnitPrice`, `growth12m`, `rentalYield`, `vacancyRate`, `clearanceRate`, `populationGrowth`, `supplyConstraint`.

**Field mapping (4 of 6 numeric fields are real as of this ticket; 2 are blocked on BACKEND-118 below)**
- `growth12m` ← `medianPriceGrowthPct` (already real, existing column)
- `rentalYield` ← `rentalYieldPct` (already real for suburbs the Domain scrape has covered)
- `vacancyRate` ← `vacancyRatePct` (new, real)
- `clearanceRate` ← `auctionClearanceRatePct` (new, real)
- `populationGrowth` ← `populationGrowthPct` (new, real where an exact-match SA2 existed — `null` otherwise, e.g. Port Macquarie; the endpoint must return `null`/omit rather than substitute a fake number)
- `supplyConstraint` ← `supplyConstraintDwellingApprovalsPer1000` (new, real where available — same null-handling as population growth; note this is a plain ratio, not a normalized 0-100 "score" the way the old mock data implied, so the frontend's chart-axis normalization logic may need to change how it treats this field, not just its data source)
- `medianHousePrice` / `medianUnitPrice` ← **blocked**, see BACKEND-118

**Frontend changes**
- `investor.ts`: replace `getMarketComparisonSuburbs()`'s `Promise.resolve(MARKET_COMPARISON_SUBURBS)` with a real `fetchJson` call; remove the now-dead `MARKET_COMPARISON_SUBURBS` constant.
- `market-comparision.tsx`: confirm it renders correctly with real (and possibly `null`) values instead of the always-populated mock — the radar chart likely needs a defined behavior for a `null` axis value (omit the suburb from that axis, or show a gap) rather than crashing or silently defaulting to 0.

**Acceptance Criteria**
- Given real `MarketIntelligence` rows exist for the requested suburbs, when the frontend calls the new endpoint, then it returns real values for `growth12m`/`rentalYield`/`vacancyRate`/`clearanceRate`, and real-or-null for `populationGrowth`/`supplyConstraint`
- Given a requested suburb has no `MarketIntelligence` row at all, then it's omitted from the response (or clearly flagged), not fabricated
- Given the Investor Market Comparison page is open in the browser, when it loads, then the chart reflects real backend data, not the hardcoded 3-suburb mock

---

### [BACKEND-118] Median House vs. Unit price split for MarketIntelligence

**Status:** Done — verified 2026-09-10. Migration applied; `build-suburb-market-intelligence.ts` updated to also group by a House/Unit category and re-run against all 814 real suburbs. Verified: Orange got distinct real values (`medianHousePrice: $757,500`, `medianUnitPrice: $540,000`); Box Hill and Googong correctly got `medianUnitPrice: null` (no unit sales in their trailing 12-month window) rather than a fabricated or copied value. **Real bug caught and fixed during implementation:** the script's `update` branch was unconditionally resetting `daysOnMarket`/`rentalYieldPct` to `null` on every re-run — harmless before BACKEND-117 existed (nothing else ever wrote real values there), but would have silently wiped out `load-external-market-data.ts`'s work the moment this script was ever re-run afterward. Fixed by omitting those two fields from the `update` payload entirely (still set to `null` on `create`, for a genuinely new row) — verified by re-running this script after the loader and confirming the loader's values survived untouched.

**Description:** Item #7 from the 2026-09-10 external-data-sourcing audit (see above) — the one item that needed no new external source, just a change to logic that already exists. `MarketIntelligence` currently stores one blended `medianPrice` per suburb; `build-suburb-market-intelligence.ts` already has `propertyType` on every `Property` row it aggregates from, it just doesn't group by it.

**Schema:** add `medianHousePrice` (Float?) and `medianUnitPrice` (Float?) to `MarketIntelligence` (nullable — a suburb might have real sales of only one type in the trailing 12-month window).

**Implementation:** in `build-suburb-market-intelligence.ts`, change the per-suburb aggregation to also group by a normalized House/Unit category (reuse or mirror the categorization already done in `ingest-bronze-listings.ts`'s `normalizePropertyType()`), and compute a separate median for each group alongside the existing blended one. Re-run the script to backfill existing suburbs.

**Blocks:** BACKEND-117's `medianHousePrice`/`medianUnitPrice` fields — that ticket's endpoint should return `null` for both until this is done, not a copy of the blended `medianPrice`.

**Acceptance Criteria**
- Given a suburb with both House and Unit sales in the trailing 12-month window, when `build-suburb-market-intelligence.ts` runs, then `medianHousePrice` and `medianUnitPrice` are both populated with distinct, real values
- Given a suburb with sales of only one type, then the other field is `null`, not a fabricated or copied value

---

### [BACKEND-119] Fix Agent Dashboard Home cross-role data leakage

**Status:** Done — verified 2026-09-10. `tsc --noEmit` clean on both sides. Live-verified against the real test account (`postman.user@example.com`): `GET /api/agent/reports` correctly returns 1 report vs. the old unscoped `GET /api/reports`'s 4 (which included "99 New Street," a valuer-role report, and duplicate "12 Seaview Street" rows from buyer/investor). **Correction to this ticket's own draft numbers above:** the "10 reports, 3 agent" example was wrong — it accidentally merged two different user accounts in the dev DB (`fe13bfdd-...` and `52c9392a-...`). The real test account has only 4 reports total (1 per role), not 10. The underlying bug and fix are unaffected by this correction — same root cause, same fix, just smaller real numbers than first described.

**Scope note:** Dashboard Home is broken the same general way for all 4 roles (see "Dashboard Home stats" in the Fake Data Audit above), but being fixed one role at a time rather than as one big ticket. This covers **Agent only** — Valuer/Investor/Buyer get their own tickets once each is analyzed the same way.

**Root cause:** `loadDashboardMetrics()` (`frontend/src/services/dashboard.ts:196-200`) calls the unscoped `GET /api/reports`, which returns every report the logged-in user has ever generated **under any role** — not just Agent's. Confirmed against real data in the dev DB: the test account (`postman.user@example.com`, which holds all 4 roles) has exactly 10 reports — 3 agent, 2 buyer, 3 investor, 2 valuer. `/api/clients` (also called here) is correctly agent-scoped already — that part isn't broken.

**Concretely, what's wrong on the Agent dashboard today** (verified against real DB rows, not hypothetical):
- **Generated Reports** stat shows `10` instead of the real `3` (233% inflated)
- **Avg Appraisal** stat averages all 10 reports' values (`$1,032,410`) instead of just the 3 agent ones (`$989,572`)
- **Avg Appraisal trend** is hardcoded to `'+0 vs. last month'` (`dashboard.ts:292`) — never real, regardless of role
- **Welcome subtitle**'s "pending client reports" count is the same unscoped number
- **Recent Reports panel** — not just a wrong count, the wrong report *objects* appear: a real agent's dashboard would show "99 New Street," a report that was actually generated under the *valuer* role and has no agent-role counterpart
- **This Week panel**'s "Reports Generated" / "Appraisals Sent" progress metrics — same unscoped source

**Confirmed NOT broken, don't touch:** "Active Clients" stat + trend, and the "Appraisal Pipeline" panel — both come from `/api/clients` only, which is genuinely agent-scoped.

**Why this isn't a one-line URL swap:** the real role-scoped endpoint, `GET /api/agent/reports` (already built, BACKEND-111), returns a different shape than what `dashboard.ts` currently consumes:
- Role-scoped returns: `{ id, address, suburb, clientName, status: 'shared'|'generated', estimatedValue, beds, baths, areaSqm, updatedAt }` (`backend/src/controllers/report-list.controller.ts`'s `toRoleReportItem`)
- `dashboard.ts` needs: `{ reportId, propertyAddressLine, propertyType, estimatedValue, clientName, clientEmail, pdfStoragePath, createdAt, updatedAt }`

Notably missing from the role-scoped shape: `createdAt` (breaks every "this week" count) and `pdfStoragePath` (breaks the pending-vs-sent split — `status` already captures the same idea: `'shared'` means it has a client attached, matching today's `pdfStoragePath`-based check closely enough to reuse).

**Fix**
1. `backend/src/controllers/report-list.controller.ts`: add `createdAt: row.createdAt` to `toRoleReportItem()` — small, safe, the underlying `Report` row already has it.
2. `frontend/src/services/dashboard.ts`: for the agent path, call `/api/agent/reports` instead of `/api/reports`; update the local row type and every field reference (`propertyAddressLine` → `address`, `pdfStoragePath` presence → `status === 'shared'`); keep `/api/clients` as-is.
3. Replace the hardcoded `'+0 vs. last month'` Avg Appraisal trend — either compute a real month-over-month comparison, or drop the trend entirely for that stat if there's no honest way to compute it yet (prefer dropping over fabricating).

**Acceptance Criteria**
- Given the test account's real data (3 agent / 2 buyer / 3 investor / 2 valuer reports), when the Agent dashboard loads, then Generated Reports shows `3`, not `10`
- Given the same data, then Avg Appraisal is computed from only the 3 agent reports
- Given the same data, then the Recent Reports panel shows only the 3 real agent reports — no "99 New Street," no Seaview Street duplicates from other roles
- Given the Avg Appraisal trend can't be honestly computed yet, then it's either a real computed value or absent — never a hardcoded placeholder
- Given a fresh account with zero reports of any role, then Generated Reports/Avg Appraisal/Recent Reports all show an honest empty state, not an error

---

### [BACKEND-120] Fix Valuer Dashboard Home — wrong completion concept + mismatched pipeline data

**Status:** Done — verified 2026-09-10. `tsc --noEmit` clean on both sides. Live-verified against the real test account: `GET /api/valuer/cases` now returns real `estimatedValue`/`createdAt` (added this ticket) alongside the existing `status: 'valuer_review'` for the one real valuer case ("99 New Street," $1,096,667) — correctly counted as NOT completed, producing "Completed This Month: 0" with a consistent "+0 this week" trend (no more self-contradiction — see below), Avg Valuation Value "$1.1m", and a Value Distribution panel showing 1 real case in the `$800K–$1.2M` bucket instead of an unrelated client-status count.

**Two distinct bugs found, both fixed, on top of Agent's same root-cause leakage:**

1. **Cross-role leakage** — same as BACKEND-119. Fixed the same way: a dedicated `loadValuerDashboardMetrics()` calling the real `GET /api/valuer/cases` (already built, BACKEND-112) instead of unscoped `/api/reports`.

2. **"Completed This Month" measured the wrong concept entirely — not just contaminated, structurally broken.** It read `pdfStoragePath !== null`, an agent/buyer-style "PDF sent to client" flag. Valuer's real workflow uses `caseStatus` (`draft → evidence_collection → valuer_review → reviewer_approval → approved/exported`, or `returned_for_revision`) — an entirely different, already-real field. Worse: `pdf_storage_path` is `NULL` for every report in the entire database, because no current backend path ever writes to it (PDF export was never implemented) — meaning this stat was **guaranteed to always read 0, forever, for every valuer**, regardless of real progress. The old trend compounded this into a visibly self-contradictory display: `generatedThisWeek` (any report, any role, created recently) was shown as the trend under "Completed This Month," producing real observed output like **"Completed This Month: 0" / "+4 this week"** — a stat claiming completions increased while showing zero completed. Fixed: "Completed This Month" now counts real cases with `caseStatus ∈ {'approved','exported'}` whose `updatedAt` falls in the current calendar month; its trend is the same count restricted to the last 7 days — always internally consistent by construction.

3. **"Value Distribution" panel plotted a completely unrelated data source.** The 4 labeled buckets (`< $800K`, `$800K–$1.2M`, `$1.2M–$2M`, `> $2M`) were filled with `countPipeline(clients)` — real *client-status* counts (prospecting/appraisal_sent/listing/sold), a category with no relationship to valuation price ranges at all. Fixed by bucketing the valuer's own real cases by `estimatedValue` into those same 4 (already correctly labeled) ranges — no copy/label changes needed, `dashboard-copy.ts`'s valuer pipeline labels were already right, only the underlying numbers were wrong.

**Backend change:** `report-list.controller.ts`'s `toCaseItem()` — added `estimatedValue` and `createdAt` (previously missing; needed for the value-distribution bucketing and the "this week" completion trend). Additive change, doesn't break the existing Valuation Cases page that also consumes this endpoint.

**Frontend changes (`dashboard.ts`):**
- New `loadValuerDashboardMetrics()`, a dedicated branch (not forced through the generic/legacy path) — valuer's real "completed" concept and value distribution have no equivalent there.
- `DashboardMetrics` gained `completedThisMonth`/`completedThisWeek` (0 for every other role).
- New `bucketCasesByValue()`, reusing `AgentPipeline`'s 4-slot shape the same generic way the panel component already treats it (confirmed by reading `appraisal-pipeline-panel.tsx`'s `'legend'` layout — it just renders `copy[key]` + `data[key]` per slot, no semantic assumption baked in).
- Fixed a subtlety caught during implementation: "In Progress" must mean "not completed, ever" (`cases.filter(c => !COMPLETED_CASE_STATUSES.has(c.status))`), not "not completed this month" — a case approved last month is done, not in progress, even though it won't count toward *this* month's completed total.
- `statValuesForRole`/`statTrendsForRole`/the `thisWeek` panel block all special-cased for `'valuer'` to read the new real fields instead of the generic ones.

**Acceptance Criteria**
- Given a valuer case with `caseStatus: 'approved'` or `'exported'` updated this calendar month, when the dashboard loads, then it counts toward "Completed This Month"
- Given a case approved in a previous month, then it counts as done (not "In Progress") but does NOT count toward this month's total
- Given no valuer cases have ever been completed, then "Completed This Month" shows `0` and its trend shows `+0 this week` — never a nonzero trend under a zero value
- Given real cases with varying `estimatedValue`, when the Value Distribution panel renders, then each bucket count reflects real cases in that real price range, not client pipeline-stage counts
- Given the Avg Valuation Value trend can't be honestly computed yet, then it's absent, never a hardcoded placeholder

---

### [BACKEND-121] Fix Investor Dashboard Home — scrambled stats + fake Market Signals

**Status:** Done — verified 2026-09-10. `tsc --noEmit` clean on both sides. Live-verified against the real test account: `GET /api/investor/reports` → 1 real report ($1,096,667), `GET /api/investor/properties/saved` → real empty array (`0`), `GET /api/investor/market-comparison` → real Orange NSW data (growth `-5%`, yield `4.24%`, vacancy `0.66%`, clearance `0%`). Dashboard now shows Saved Properties `0`, Generated Reports `1`, Avg Investment Report Value `$1.1m`, and a Market Signals panel with 4 real, correctly-labeled, single-suburb metrics — replacing what were, respectively, a wrong count, two hardcoded percentages, and 4 fake client-status numbers under fabricated suburb names.

**This role's bugs were worse than Agent/Valuer's — not just contaminated by cross-role leakage, but structurally scrambled onto the wrong labels regardless of data source:**

1. **Stat values were mapped positionally onto the wrong labels, not just wrong numbers.** `statValuesForRole('investor')` returned `[generatedReports, '4.3%', '6.8%']` against labels `['Saved Properties', 'Generated Reports', 'Avg Investment Report Value']`. With real data this rendered **"Saved Properties: 4"** (that's the report count), **"Generated Reports: 4.3%"** (a hardcoded percentage under a count label), **"Avg Investment Report Value: 6.8%"** (a hardcoded percentage under a dollar-value label) — nonsensical regardless of whose data fed it, since a percentage can never correctly answer either of the last two labels.

2. **Real, already-built endpoints existed and were simply never called.** `GET /api/investor/properties/saved` (real) would have answered "Saved Properties" correctly; nothing in the dashboard code called it.

3. **Same cross-role leakage as Agent/Valuer**, layered on top of bug 1.

4. **"Market Signals" panel plotted `countPipeline(clients)`** — real *client-status* counts — under 4 fabricated market-signal labels with 4 different hardcoded fake suburb subtitles (Richmond/Brunswick/Footscray/Fitzroy VIC). Worse than Valuer's equivalent bug: investor has no real "clients" concept at all — `Client` has no role column in the schema, so this was literally reading the agent's CRM data cross-wired into an unrelated panel.

**Design decision locked (confirmed with user before implementing):** relabel the 4 "Market Signals" slots to match what we can actually back with real data, using **Orange NSW** (one of only 2 suburbs — the other is Goulburn NSW — with every `MarketIntelligence` field populated, same set BACKEND-117's Market Comparison already uses):
- "Vacancy Rate Change" → **"Price Momentum"** (real `medianPriceGrowthPct`)
- "Price Momentum" → **"Rental Yield"** (real `rentalYieldPct`)
- "Rental Yield Trend" → **"Vacancy Rate"** (real `vacancyRatePct`)
- "Inventory Movement" → **"Auction Clearance"** (real `auctionClearanceRatePct`) — no real inventory/listing-count metric exists at all, so this slot was fully replaced, not just re-sourced
- "Trend"/"Change" dropped from labels throughout — only current values are real, not real trends, for any of these 4 metrics
- Richmond VIC was considered and rejected as the default suburb: it lacks auction clearance data, and its existing trend columns (`rentalYieldTrendPct: +0.2%`, `daysOnMarketTrendDays: -3`) are the fabricated `seed.ts` demo values flagged elsewhere in this doc — using them would have reintroduced fake data through the back door

**Backend change:** `saved-property.controller.ts`'s `toSavedPropertyResponse()` — added `createdAt` (previously only a pre-formatted `savedAgo` string existed, not enough to compute a real "this week" count).

**Frontend changes (`dashboard.ts`):**
- New `loadInvestorDashboardMetrics()` — dedicated branch, calling `/api/investor/reports`, `/api/investor/properties/saved`, and a new `loadInvestorMarketSignals()` (queries `/api/investor/market-comparison`, finds the Orange NSW entry, rounds values to 1 decimal, falls back to an honest all-zero state rather than crashing if even Orange isn't in the response yet).
- `DashboardMetrics` gained `savedPropertiesCount`/`savedPropertiesThisWeek`/`reportsThisMonth` (0 for every other role).
- `statValuesForRole`/`statTrendsForRole`/the `thisWeek` panel block all special-cased for `'investor'`.
- `dashboard-copy.ts`'s investor pipeline labels/subtitles updated to match; `appraisal-pipeline-panel.tsx`'s `'sold'` slot unit changed from `' listings'` to `'%'` (investor is the only real consumer of the `'signals'` layout, so this was safe to change directly).

**Acceptance Criteria**
- Given the real test account (1 investor report, 0 saved properties), when the dashboard loads, then Saved Properties shows `0`, Generated Reports shows `1`, Avg Investment Report Value shows a real dollar figure — never a percentage
- Given real `MarketIntelligence` data exists for Orange NSW, then all 4 Market Signals values are real numbers under correctly-matched labels, all showing "Orange NSW" as the subtitle
- Given Orange NSW's data were ever missing, then the panel shows an honest zero state, not a crash or fabricated fallback
- Given the Avg Investment Report Value trend can't be honestly computed yet, then it's absent, never a hardcoded placeholder

---

### [BACKEND-122] Fix Buyer Dashboard Home — inspections showing reports + fully hardcoded market panel

**Status:** Done — verified 2026-09-10. `tsc --noEmit` clean on both sides. No backend changes needed at all — every real endpoint this fix needed (`/api/buyer/reports`, `/api/buyer/properties/saved`, `/api/buyer/inspections`, `/api/buyer/suburb-explorer`) already existed and was simply never called. Live-verified against the real test account: 1 real buyer report ($1,096,667), 0 saved properties, 0 inspections, and real Orange NSW data from Suburb Explorer (`$750K`, `-5.0%` trend, `39` days on market, `4.2%` yield, both trend fields honestly `N/A`).

**The worst two bugs of all four roles — not contamination or scrambled labels, but showing the wrong kind of object entirely, and a panel that was never connected to any API at all:**

1. **"Upcoming Inspections" panel displayed report objects, not inspections.** Confirmed directly in `role-dashboard-view.tsx:67-85` (before this fix): both the "Recent Reports" panel and the "Upcoming Inspections" panel were passed the exact same `data.reports` array. A real `getBuyerInspections()` / `GET /api/buyer/inspections` (BACKEND-107) exists and was never called from Dashboard Home. This wasn't a wrong count — a buyer would see property addresses and dollar values in a list meant to show inspection appointments (date, agent, checklist).

2. **"Melbourne Market" panel was 100% hardcoded — worse than every other role's market panel, which at least plotted *some* real (if mislabeled) number.** `dashboard-copy.ts`'s `pipeline.values`/`pipeline.trends` were static strings (`"$1.28M"`, `"22 days"`, `"3.4%"`) that the `'metrics'` layout in `appraisal-pipeline-panel.tsx` reads in preference to any real data (`copy.values?.[stage.key] ?? count` — since `copy.values` was always defined, the real `count` argument was never reachable). This never touched any API, ever, regardless of what real data existed.

3. **"Saved Properties" and "Upcoming Inspections" stats read the wrong source, only coincidentally landing on the right number** (both happened to show `0` on the real test account only because it has 0 clients — not because the underlying logic was correct): they read `activeClients` (agent-CRM client count) and `pipeline.appraisalSent` (client-status count) respectively. Real `getSavedProperties()`/inspections endpoints existed and were unused.

4. **Same cross-role leakage as every other role.**

**Design decisions locked (confirmed with user before implementing):**
- Reused **Orange NSW** (same suburb as Investor's Market Signals fix, BACKEND-121) as the default suburb for buyer's market panel, via the real `GET /api/buyer/suburb-explorer` endpoint — a better fit than Investor's Market Comparison endpoint since its response shape already matches exactly the 3 fields buyer needs (median price, days on market, rental yield), no relabeling required.
- Renamed the panel from **"Melbourne Market"** to **"Market Snapshot"** — the old title was factually wrong for a non-Melbourne suburb, and a generic title stays accurate regardless of which suburb is shown later.

**Frontend changes (`dashboard.ts`):**
- New `loadBuyerDashboardMetrics()` — dedicated branch calling the 3 real buyer endpoints (reports, saved properties, inspections) instead of unscoped `/api/reports` and agent-CRM client data.
- New `getUpcomingTimeLabel()` — the existing `getRelativeTimeLabel()` only handles the past ("X days ago"); a future inspection date needed its own "Tomorrow" / "In 3 days" / "In 2 weeks" logic.
- New `loadBuyerMarketSnapshot()` — queries Suburb Explorer for Orange NSW, maps its response directly onto the panel's existing 3 slots.
- `DashboardMockPayload` gained an `inspections?: RecentReport[]` field, separate from `reports` — `role-dashboard-view.tsx`'s "Upcoming Inspections" panel now reads `data.inspections ?? []` instead of reusing `data.reports`.
- `getRoleDashboardPayload()` merges the real market-snapshot values/trends into `pipelineCopy` at request time for buyer only — `dashboard-copy.ts` no longer hardcodes any values/trends for this panel, so a stale fallback can never silently reappear if the real fetch is ever skipped.

**Acceptance Criteria**
- Given the real test account (1 buyer report, 0 saved properties, 0 inspections), when the dashboard loads, then Saved Properties shows `0`, Upcoming Inspections shows `0`, Generated Reports shows `1`
- Given a future-dated inspection exists, when the Upcoming Inspections panel renders, then it shows that real inspection (address, suburb, a real "In N days"-style label) — never a report object
- Given real Orange NSW `MarketIntelligence` data, then the Market Snapshot panel shows real median price/days-on-market/rental-yield values, with `N/A` for the 2 trend fields no real trend exists for yet
- Given the panel's suburb ever changes, then the title ("Market Snapshot") never needs to change to stay accurate
- Given I reopen a previously saved buyer report, then the Affordability section shows that report's own saved numbers, not stale local storage
