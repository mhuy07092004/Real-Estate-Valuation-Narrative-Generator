# Backend

Express + TypeScript API for the Relaive real-estate appraisal app. Designed to be tested directly with Postman even when the frontend is incomplete.

**Tech stack:** Node.js + Express, TypeScript, Prisma ORM, SQLite (local dev), JWT bearer auth.

## Folder map

Start here if you just cloned the repo — this is what each part of `src/` actually does:

| Path | What's there |
| --- | --- |
| `src/server.ts` | Process entrypoint — starts the HTTP server. |
| `src/app.ts` | Express app wiring: middleware, CORS, mounting `apiRouter`. |
| `src/routes/` | One file per domain (clients, reports, comparable sales, ROI calc, ...), plus `index.ts` which mounts them all onto `/api/...`. See the route table below for the real, current paths. |
| `src/controllers/` | HTTP handlers — parse the request, call a service, shape the response. One file per domain, matching `routes/`. |
| `src/services/` | Business logic. Talks to Prisma / does calculations / calls external APIs. This is where to look for "how does X actually work." |
| `src/validators/` | Zod schemas for request payload validation. |
| `src/middleware/` | Cross-cutting request handling — `require-auth.ts` is the bearer-token guard used on almost every route. |
| `src/config/` | Environment/config loading. |
| `src/lib/` | Shared low-level utilities (e.g. the Prisma client instance). |
| `src/types/` | Shared TypeScript types. |
| `prisma/schema.prisma` | The data model. |
| `prisma/seed.ts` | Fast, repeatable dev seed data (roles + one demo user) — **not** real property data. |
| `scripts/` | One-off data-import scripts, run manually with `npx tsx`, not part of normal `npm run dev` — see "Data import" below. |

## First-time setup

1. `npm install`
2. Copy the env file: `copy .env.example .env` (Windows) or `cp .env.example .env`
3. Apply the schema: `npm run prisma:migrate`
4. Seed reference/demo data: `npm run prisma:seed`
5. Start the dev server: `npm run dev`

Server runs on `http://localhost:4000` by default.

Seeded test login (created by step 4):
- email: `postman.user@example.com`
- password: `Password123`

## Data import

Step 4 above only gives you fast dev-seed data (roles + one demo user) — no real properties. To get real data into the DB, run these **manually, in order**, after migrating (they're one-off scripts, not part of the normal dev loop):

1. `npx tsx scripts/ingest-bronze-listings.ts` — reads `data_ai/bronze_listings.csv` (real scraped NSW sold listings) and inserts them as `Property` + `ComparableSale` rows. Skips any row it can't confidently clean rather than guessing a value. Re-run after any `prisma migrate reset`.
2. `npx tsx scripts/build-suburb-market-intelligence.ts` — computes real per-suburb `MarketIntelligence` rows (median price, growth, trend) from the `ComparableSale` data step 1 just inserted.
3. `npx tsx scripts/load-external-market-data.ts` — enriches those same `MarketIntelligence` rows with real `daysOnMarket`/`rentalYieldPct`/etc. from `data_ai/ingestion`'s scraped Domain/ABS/SQM CSVs. Only updates existing rows from step 2, never creates new ones.

`scripts/export-narrative-training-inputs.ts` is unrelated to importing data — it's an export script for building the AI fine-tuning dataset (see `data_ai/`).

## Auth model

- Auth endpoints (`/api/auth/*`) are unauthenticated.
- Every other domain route is protected by the `requireAuth` bearer-token middleware.
- User-owned resources (clients, reports, saved properties) are scoped to the owning user — you can only see/modify your own.

## API routes

Base URL: `http://localhost:4000`

| Mount | Routes |
| --- | --- |
| `GET /api/health` | Liveness check, `{ status: "ok" }` — used as Render's health check. |
| `/api/auth` | `POST /register`, `POST /login`, `POST /forgot-password` (prototype stub, always a generic ack), `GET /me`, `POST /refresh-token` |
| `/api/clients` | `GET /`, `GET /:clientId`, `POST /`, `PATCH /:clientId`, `DELETE /:clientId` |
| `/api/appraisal` | `GET /comparable-sales`, `GET /comparable-sales/search`, `GET /market-intelligence-overview`, `GET /steps`, `GET /property-types`, `GET /appraisal-summary`, `GET /report-templates`, `GET /executive-summary`, `GET /narrative-preview`, `GET /agent-recommendations`, `GET /growth-outlook`, `GET /affordability-outlook`, `GET /appraisal-disclaimer` |
| `/api/agent/reports`, `/api/buyer/reports`, `/api/investor/reports` | `GET /` (investor also has `GET /summary`) |
| `/api/valuer/cases` | `GET /`, `GET /summary`, `PATCH /:reportId` |
| `/api/investor/roi-calculation` | `POST /` |
| `/api/investor/market-comparison` | `GET /` |
| `/api/buyer/affordability-calculation` | `POST /` |
| `/api/agent/market-insights`, `/api/valuer/market-insights`, `/api/buyer/suburb-explorer`, `/api/investor/suburb-explorer` | `GET /` — same shared handler, mounted per role's expected path |
| `/api/agent/properties/saved`, `/api/investor/properties/saved`, `/api/buyer/properties/saved`, `/api/valuer/evidence/saved` | `GET /` — shared read handler |
| `/api/properties/saved` | `POST /`, `DELETE /:savedPropertyId` — shared write handler (not role-prefixed) |
| `/api/buyer/inspections` | `GET /`, `POST /`, `PUT /:inspectionId` |
| `/api/reports` | `GET /`, `GET /:reportId`, `POST /` |

## AI narrative generation

`buildExecutiveSummary` (in `report-content.service.ts`) is the only place AI-generated text is attempted. It first tries `src/services/vertex-narrative.service.ts`, which calls a Vertex AI endpoint hosting a Gemma 2 model (base or fine-tuned, depending what's deployed at the time — see `data_ai/README.md`), and falls back to the existing templated content (built from real comparable sales + market data) on **any** failure — timeout, auth issue, endpoint not deployed, unexpected response shape.

This is experimental and not continuously running: the Vertex endpoint isn't left deployed by default (it costs GPU-hours per hour while up), so most of the time this silently falls back. Check backend logs for a `[vertex-narrative]` warning to see whether a given request actually hit the model or fell back. To make it actually call the model, redeploy the endpoint first — steps are in `data_ai/README.md`, not duplicated here.

## Docker / deployment

Production image built from `Dockerfile` (two-stage, `node:22-slim` — not alpine, since `bcrypt` is a native addon without reliable musl prebuilts). The database is baked in at **build time**: the builder stage runs `prisma migrate deploy`, `prisma/seed.ts`, and the CSV ingestion scripts (see "Data import" above) against a SQLite file that ships inside the final image already populated with real reference data. The container's `CMD` just starts the server — no migrate/seed step at boot. A schema change or CSV update requires a rebuild, not just a restart; data written after boot (new users, clients, reports) still doesn't survive a redeploy, since only the build-time-baked file persists. Build/push/Render setup steps are documented in the repo root [README.md](../README.md) under "Deploy backend (Docker → Docker Hub → Render)."

## Postman smoke test

1. **Login** — `POST http://localhost:4000/api/auth/login`, body:
   ```json
   { "email": "postman.user@example.com", "password": "Password123" }
   ```
2. Copy `accessToken` from the response.
3. Call a protected endpoint with header `Authorization: Bearer <accessToken>` — e.g. `GET http://localhost:4000/api/clients`.

## Notes for contributors

- Keep responses consistent: success → `{ success: true, data | message }`; failure → `{ success: false, message, errors? }`.
- Validate request payloads with a Zod schema in `src/validators/`.
- Filter user-owned resources by `ownerUserId`.
- Schema change → run a migration and regenerate the Prisma client.

## Build and test

```bash
npm run build   # tsc -p tsconfig.json
npm test        # vitest run --passWithNoTests
```
