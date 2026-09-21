# Backend

Express + TypeScript API for the Relaive real-estate appraisal app. Designed to be tested directly with Postman even when the frontend is incomplete.

**Tech stack:** Node.js + Express, TypeScript, Prisma ORM, PostgreSQL (Cloud SQL), JWT bearer auth, bcryptjs, SendGrid (email), Vitest.

## Folder Map

Start here if you just cloned the repo — this is what each part of `src/` actually does:

| Path | What's there |
| --- | --- |
| `src/server.ts` | Process entrypoint — starts the HTTP server. |
| `src/app.ts` | Express app wiring: middleware, CORS, mounting `apiRouter`. |
| `src/routes/` | One file per domain (auth, clients, reports, comparable sales, geocode, places, ROI calc, ...), plus `index.ts` which mounts them all onto `/api/...`. See the route table below for the real, current paths. |
| `src/controllers/` | HTTP handlers — parse the request, call a service, shape the response. One file per domain, matching `routes/`. |
| `src/services/` | Business logic. Talks to Prisma / does calculations / calls external APIs. This is where to look for "how does X actually work." |
| `src/validators/` | Zod schemas for request payload validation. |
| `src/middleware/` | Cross-cutting request handling — `require-auth.ts` (bearer-token guard) and `require-role.ts` (per-role access control) run on almost every route. |
| `src/config/` | Environment/config loading. |
| `src/lib/` | Shared low-level utilities (e.g. the Prisma client instance). |
| `src/types/` | Shared TypeScript types. |
| `prisma/schema.prisma` | The data model. Datasource is PostgreSQL (Cloud SQL) — see `infra/terraform/README.md` for the instance. |
| `prisma/seed.ts` | Fast, repeatable dev seed data (roles + one demo user) — **not** real property data. |
| `scripts/` | One-off data-import scripts, run manually with `npx tsx`, not part of normal `npm run dev` — see "Data Import" below. |

## Prerequisites

- Node.js 22+, npm
- Access to the project's Cloud SQL Postgres instance — see [`../infra/terraform/README.md`](../infra/terraform/README.md#connecting-from-your-local-machine) for how to get your IP allowlisted. There is no local-only fallback database anymore (this used to be SQLite; that changed — see "Database" below).

## First-Time Setup

1. `npm install`
2. Copy the env file: `copy .env.example .env` (Windows) or `cp .env.example .env`
3. Fill in `DATABASE_URL` in `.env` with the Cloud SQL connection string (see Prerequisites above) — the checked-in example won't work as-is.
4. Generate the Prisma client: `npm run prisma:generate`
5. Start the dev server: `npm run dev`

Server runs on `http://localhost:4000` by default.

Seeded test login (already present in the shared dev database — no need to re-seed unless you're pointed at a fresh instance):
- email: `postman.user@example.com`
- password: `Password123`

If you *are* setting up a brand-new database, also run `npm run prisma:seed` once after step 4.

## Database

Postgres on Cloud SQL, not SQLite. This changed partway through the project — see [`../infra/terraform/README.md`](../infra/terraform/README.md) for the full migration story and how to connect locally. In short:

- `schema.prisma`'s datasource is `postgresql`, reading `DATABASE_URL` from `.env`.
- Migrations run against the shared Cloud SQL instance, not a local file — `npm run prisma:migrate` (which runs `prisma migrate dev`) affects the database everyone else is using too. Coordinate before running it.
- The production Docker image runs `prisma migrate deploy` automatically at container boot (see "Docker / Deployment" below) — you don't need to do that manually for a deploy, only for local schema changes during development.

## Data Import

Seeding (above) only gives you fast dev data (roles + one demo user) — no real properties. Real reference data (33k+ properties/comparable sales, 800+ suburb market-intelligence rows) is already loaded into the shared Cloud SQL instance. You only need to re-run these if you're setting up a fresh database:

1. `npx tsx scripts/ingest-bronze-listings.ts` — reads `data_ai/bronze_listings.csv` (real scraped NSW sold listings) and inserts them as `Property` + `ComparableSale` rows. Skips any row it can't confidently clean rather than guessing a value.
2. `npx tsx scripts/build-suburb-market-intelligence.ts` — computes real per-suburb `MarketIntelligence` rows (median price, growth, trend) from the `ComparableSale` data step 1 just inserted.
3. `npx tsx scripts/load-external-market-data.ts` — enriches those same `MarketIntelligence` rows with real `daysOnMarket`/`rentalYieldPct`/etc. from `data_ai/ingestion`'s scraped Domain/ABS/SQM CSVs. Must run **after** step 2 — it only updates existing rows, never creates new ones.

`scripts/export-narrative-training-inputs.ts` is unrelated to importing data — it's an export script for building the AI fine-tuning dataset (see `data_ai/readme.md`).

## Auth Model

- Auth endpoints (`/api/auth/*`) are unauthenticated.
- Every other domain route is protected by `requireAuth` (validates the JWT, populates `res.locals.userId`/`res.locals.roles`).
- Role-prefixed routes (`/api/agent/*`, `/api/buyer/*`, `/api/investor/*`, `/api/valuer/*`) additionally require `requireRole(...)` — a 403 if the caller's JWT doesn't carry the matching role. See `src/middleware/require-role.ts`.
- User-owned resources (clients, reports, saved properties) are scoped to the owning user — you can only see/modify your own.
- Public share links (`/api/public/reports/:token`) are the one deliberate exception — see "Report Sharing & Email" below.

## API Routes

Base URL: `http://localhost:4000`

| Mount | Routes |
| --- | --- |
| `GET /api/health` | Liveness check, `{ status: "ok" }` — used as the deployment platform's health check. |
| `/api/auth` | `POST /register`, `POST /login`, `POST /forgot-password` (prototype stub, always a generic ack), `GET /me`, `PATCH /me` (auth required), `POST /refresh-token` |
| `/api/geocode` | `GET /?address=...` — server-side Google Geocoding proxy (see "Geocoding & Places" below) |
| `/api/places` | `GET /nearby?lat=&lng=&radiusMeters=` — server-side Google Places nearby-search proxy |
| `/api/clients` | `GET /`, `GET /:clientId`, `POST /`, `PATCH /:clientId`, `DELETE /:clientId` |
| `/api/appraisal` | `GET /comparable-sales`, `GET /comparable-sales/search`, `GET /market-intelligence-overview`, `GET /steps`, `GET /property-types`, `GET /appraisal-summary`, `GET /report-templates`, `GET /executive-summary`, `GET /narrative-preview`, `GET /agent-recommendations`, `GET /growth-outlook`, `GET /affordability-outlook`, `GET /appraisal-disclaimer` |
| `/api/agent/reports`, `/api/buyer/reports`, `/api/investor/reports` (role-gated) | `GET /` (investor also has `GET /summary`) |
| `/api/valuer/cases` (role-gated) | `GET /`, `GET /summary`, `PATCH /:reportId` |
| `/api/investor/roi-calculation` (role-gated) | `POST /` |
| `/api/investor/market-comparison` (role-gated) | `GET /` |
| `/api/buyer/affordability-calculation` (role-gated) | `POST /` |
| `/api/agent/market-insights`, `/api/valuer/market-insights`, `/api/buyer/suburb-explorer`, `/api/investor/suburb-explorer` (role-gated) | `GET /` — same shared handler, mounted per role's expected path |
| `/api/agent/properties/saved`, `/api/investor/properties/saved`, `/api/buyer/properties/saved`, `/api/valuer/evidence/saved` (role-gated) | `GET /` — shared read handler |
| `/api/properties/saved` | `POST /`, `DELETE /:savedPropertyId` — shared write handler (not role-prefixed) |
| `/api/buyer/inspections` (role-gated) | `GET /`, `POST /`, `PUT /:inspectionId` |
| `/api/reports` | `GET /`, `GET /:reportId`, `POST /`, `POST /:reportId/share-link`, `POST /:reportId/send-email` |
| `/api/public/reports` | `GET /:token` — **unauthenticated**, see "Report Sharing & Email" below |

## Report Sharing & Email

Agents can generate a public, read-only link for a report (`POST /api/reports/:reportId/share-link`) and/or email that link directly to a client (`POST /api/reports/:reportId/send-email`). Both reuse the same `getOrCreateShareToken` (`src/services/report.service.ts`) — a high-entropy random token, deliberately decoupled from the internal `reportId`, stored on the `Report` row.

- The public view (`GET /api/public/reports/:token`, no auth) reads a **snapshot** persisted at save time (`priceRangeLow/High`, `sectionsJson`, `comparablesJson`, `strategyCardsJson` on the `Report` model) — not a live re-fetch. This is deliberate: a legal/financial document a client is looking at shouldn't silently change because the underlying comparable sales data changed later. Its response is explicitly shaped (never a raw Prisma row) so `ownerUserId`, `shareToken`, and `clientEmail` never leak.
- Email sending goes through SendGrid (`src/services/email.service.ts`), via its HTTP API — not SMTP. This matters: an earlier attempt using Gmail SMTP worked locally but hung indefinitely on Render, because Render blocks outbound SMTP ports. SendGrid's Single Sender Verification lets sending from a plain Gmail address without owning a domain.
- Required env vars: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` (must be a verified sender in SendGrid), `PUBLIC_APP_URL` (the deployed frontend origin — used to build the `/shared-report/:token` link).

## Geocoding & Places

The homepage's Property Intelligence Map calls two backend-proxied Google APIs — proxied specifically because Google rejects referrer-restricted keys for server-to-server Geocoding/Places calls, while the browser-side Maps JavaScript API key needs referrer restriction. Two separate keys:

- `GOOGLE_MAPS_SERVER_KEY` (backend, this service) — unrestricted or IP-restricted, scoped to Geocoding API + Places API (New).
- `VITE_GOOGLE_MAPS_API_KEY` (frontend, not this service) — referrer-restricted to the deployed domain.

See `src/services/geocode.service.ts` and `src/services/places.service.ts` for the actual Google API calls.

## ML Price Prediction

`report-content.service.ts`'s `buildRealEvidence` calls `src/services/price-prediction.service.ts`, which hits a separately-deployed FastAPI model (see `data_ai/readme.md` and `data_ai/service/`) via `ML_PRICE_PREDICTION_URL`. Falls back to the comparable-sales average automatically if the env var is unset or the call fails — this is the normal, expected state until that service is actually deployed and configured.

## AI Narrative Generation

`buildExecutiveSummary` (in `report-content.service.ts`) is the only place AI-generated text is attempted. It first tries `src/services/vertex-narrative.service.ts`, which calls a Vertex AI endpoint hosting a Gemma 2 model (base or fine-tuned, depending what's deployed at the time — see `data_ai/readme.md`), and falls back to the existing templated content (built from real comparable sales + market data) on **any** failure — timeout, auth issue, endpoint not deployed, unexpected response shape.

This is experimental and not continuously running: the Vertex endpoint isn't left deployed by default (it costs GPU-hours per hour while up), so most of the time this silently falls back. Check backend logs for a `[vertex-narrative]` warning to see whether a given request actually hit the model or fell back. To make it actually call the model, redeploy the endpoint first — steps are in `data_ai/readme.md`, not duplicated here.

## Docker / Deployment

Two-stage `Dockerfile` (`node:22-slim`). The database is **not** baked into the image — `DATABASE_URL` is a real runtime env var, pointing at Cloud SQL. The container's `CMD` runs `npx prisma migrate deploy` (idempotent — a no-op if nothing's pending) before starting the server, so pending schema migrations apply automatically on every deploy. This replaced an earlier design that baked a fully-migrated-and-seeded SQLite file into the image at build time; that approach meant a rebuild was needed for any data change and nothing written after boot survived a redeploy — neither limitation applies anymore.

**Currently deployed on Render** (Docker image → Docker Hub → Render "Existing Image"):

Build/push is automated via [`../.github/workflows/docker-deploy.yml`](../.github/workflows/docker-deploy.yml) on every push to `main` touching `backend/**` or `data_ai/*.csv`. Manual build, if needed (must run from the **repo root**, since the Dockerfile reads `data_ai/*.csv`):

```bash
docker build -f backend/Dockerfile -t <dockerhub-username>/relaive-backend:latest .
docker push <dockerhub-username>/relaive-backend:latest
```

Render service settings: Image URL `docker.io/<dockerhub-username>/relaive-backend:latest`, Health Check Path `/api/health`. Render doesn't auto-pull — a new image on Docker Hub requires triggering "Manual Deploy" in the Render dashboard.

**Environment variables required on Render:**

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Cloud SQL connection string. **Not yet configured on Render as of this writing** — see `infra/terraform/README.md`'s "Next steps" for what's still needed (a real value here, plus adding Render's outbound IPs to the Cloud SQL allowlist) before a redeploy with the current image is safe. |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Generate real random values (`openssl rand -hex 32`) — never reuse the checked-in dev defaults. |
| `CORS_ORIGIN` | The deployed frontend's origin (comma-separate multiple, e.g. to also allow a Vercel preview URL). |
| `TURNSTILE_SECRET_KEY` | Optional — only demanded on risky login/register attempts. |
| `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` | See "Report Sharing & Email" above. |
| `PUBLIC_APP_URL` | The deployed frontend origin — used to build share-report links. |
| `GOOGLE_MAPS_SERVER_KEY` | See "Geocoding & Places" above. |
| `ML_PRICE_PREDICTION_URL`, `ML_PRICE_PREDICTION_API_KEY` | See "ML Price Prediction" above — leave blank if that service isn't deployed. |
| `TRUST_PROXY` | `1` — Render sits in front as a proxy; without this, `req.ip` in the adaptive-captcha risk scoring sees Render's proxy IP for every visitor. |
| `PORT` | Supplied automatically — don't set it. |

**Cloud Run migration in progress** — Terraform config for a Cloud Run deployment of this same image, wired to the same Cloud SQL instance via its built-in connector, lives in [`../infra/terraform/`](../infra/terraform/README.md). Not yet cut over from Render; see that doc's "Status" and "Next steps" for where things stand.

**AI price-prediction service** (`data_ai/service/`) deploys the same way — its own Docker image/Docker Hub repo/Render service, automated via [`../.github/workflows/docker-deploy-ai.yml`](../.github/workflows/docker-deploy-ai.yml). See `data_ai/readme.md` for details; the only thing this backend needs is that service's URL in `ML_PRICE_PREDICTION_URL` once it's live.

## Postman Smoke Test

1. **Login** — `POST http://localhost:4000/api/auth/login`, body:
   ```json
   { "email": "postman.user@example.com", "password": "Password123" }
   ```
2. Copy `accessToken` from the response.
3. Call a protected endpoint with header `Authorization: Bearer <accessToken>` — e.g. `GET http://localhost:4000/api/clients`.

## Testing

```bash
npm run build   # tsc -p tsconfig.json
npm test        # vitest run --passWithNoTests
```

## Notes for Contributors

- Keep responses consistent: success → `{ success: true, data | message }`; failure → `{ success: false, message, errors? }`.
- Validate request payloads with a Zod schema in `src/validators/`.
- Filter user-owned resources by `ownerUserId`.
- Schema change → run `npm run prisma:migrate` against the shared Cloud SQL instance (coordinate with the team first) and regenerate the Prisma client.
- A public, unauthenticated endpoint (like `/api/public/reports/:token`) should always explicitly shape its response — never spread a raw Prisma row — so nothing beyond what's intended ever leaks.
