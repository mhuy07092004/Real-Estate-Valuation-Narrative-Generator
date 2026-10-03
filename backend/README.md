# Backend

Express + TypeScript API for Relaive. **Stack:** Node.js 22, Express, Prisma + PostgreSQL (Cloud SQL), Zod, JWT bearer auth, `bcryptjs`, SendGrid, Vitest. It can be exercised directly with Postman or `curl` even when the frontend isn't running.

## Folder map

| Path | What's there |
| --- | --- |
| `src/server.ts`, `src/app.ts` | Process entrypoint; Express wiring (CORS, JSON, `apiRouter`) |
| `src/routes/` | One file per domain; `index.ts` mounts them all under `/api/...` |
| `src/controllers/` | HTTP handlers: parse the request, call a service, shape the response |
| `src/services/` | Business logic and external calls (database, SendGrid, Google Maps, Vertex AI, price model) |
| `src/validators/` | Zod schemas for request bodies |
| `src/middleware/` | `require-auth.ts` (JWT guard), `require-role.ts` (per-role access), error handling |
| `src/config/env.ts` | Loads `.env` (`dotenv`) and exposes the settings |
| `prisma/schema.prisma`, `prisma/migrations/` | The data model and its migrations (PostgreSQL) |
| `prisma/seed.ts` | Roles + one demo user — **not** real property data |
| `scripts/` | Manual data-import scripts (`npx tsx scripts/<name>.ts`) |
| `Dockerfile` | Two-stage image; runs `prisma migrate deploy` then the server |

## Local

**Prerequisites**
- Node.js 22+ and npm.
- Your public IPv4 address allow-listed on the Cloud SQL instance — there is **no local database**. Steps are in [`../infra/terraform/README.md`](../infra/terraform/README.md#connecting-from-your-local-machine).
- The Cloud SQL connection string (ask the team, or `terraform output -raw database_url` from `infra/terraform`).
- Optional: `gcloud auth application-default login`, so the backend can call the Vertex AI narrative model.

**Steps**
1. Install and create your env file (gitignored):
   ```bash
   cd backend
   npm install
   copy .env.example .env          # Windows;  cp .env.example .env  elsewhere
   ```
2. Edit `.env`: set `DATABASE_URL` (no quotes), and any optional keys from the table below.
3. Generate the Prisma client and start the server:
   ```bash
   npm run prisma:generate
   npm run dev                      # http://localhost:4000 (restarts on code changes)
   ```
   `.env` is read only at startup, and `npm run dev` does **not** restart when it changes — stop and restart after editing it.
4. **Verify:**
   ```bash
   curl http://localhost:4000/api/health          # {"status":"ok"}
   curl -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" \
        -d "{\"email\":\"postman.user@example.com\",\"password\":\"Password123\"}"
   ```
   The seeded demo account (`postman.user@example.com` / `Password123`) already exists in the shared database and has every role.
5. Tests and build (the same ones CI runs):
   ```bash
   npm run build          # tsc
   npm test               # vitest
   ```

### Database steps

Only needed for a **brand-new database** — the shared instance already has everything.
```bash
npx prisma migrate deploy                       # create the schema
npm run prisma:seed                             # roles + demo user
npx tsx scripts/ingest-bronze-listings.ts       # data_ai/bronze_listings.csv → properties + comparable sales
npx tsx scripts/build-suburb-market-intelligence.ts   # per-suburb market rows from those sales
npx tsx scripts/load-external-market-data.ts    # enrich market rows (must run after the previous step)
```
Changing the schema: `npm run prisma:migrate` runs `prisma migrate dev` against the **shared** instance, so coordinate first. `scripts/export-narrative-training-inputs.ts` is unrelated to importing — it exports data for the AI fine-tuning dataset (see `data_ai/readme.md`).

## Environment variables

| Variable | Needed for | Notes |
| --- | --- | --- |
| `DATABASE_URL` | everything | Cloud SQL connection string. Local/Render: public IP form `postgresql://user:pass@host:5432/relaive`. Cloud Run: Terraform builds the `/cloudsql` socket form itself. |
| `PORT` | — | Default 4000; Render and Cloud Run set it. |
| `CORS_ORIGIN` | browser access | Comma-separated allowed origins. Local `http://localhost:5173`; deployed = the Vercel site. Any other origin gets a CORS error. |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | auth | Use long random values (`openssl rand -hex 32`) anywhere real. The checked-in defaults are dev-only. The access secret also keys the sign-up code hashes. |
| `JWT_ACCESS_EXPIRES_IN_SECONDS`, `JWT_REFRESH_EXPIRES_IN` | auth | Defaults 3600 and `7d`. |
| `TRUST_PROXY` | deployed | `1` behind Render or Cloud Run, `0` locally — otherwise every visitor shares the proxy's IP in the risk scoring. |
| `TURNSTILE_SECRET_KEY` | captcha | Optional. Adaptive captcha is currently switched off in code. |
| `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` | sign-up codes, report emails | The from-address must be a verified SendGrid sender. Locally, without them, sign-up still works because the code is printed in the terminal (see below). |
| `PUBLIC_APP_URL` | share links | The frontend origin; used to build `/shared-report/:token` links. |
| `GOOGLE_MAPS_SERVER_KEY` | address search, amenities | **Server** key for Geocoding API + Places API (New), no referrer restriction. Without it: "Geocoding is not configured on the server". The browser key is a frontend variable. |
| `ML_PRICE_PREDICTION_URL`, `ML_PRICE_PREDICTION_API_KEY` | price model | URL of the price service (called exactly as given — `/` and `/predict` both work). Blank → falls back to the comparable-sales average. |
| `VERTEX_PROJECT_ID`, `VERTEX_REGION`, `VERTEX_ENDPOINT_ID` | narrative model | Project **number** `393439107077`, `us-central1`, and the endpoint ID. Blank/unreachable → templated text. |
| `NODE_ENV` | — | The Docker image sets `production`, which turns off the terminal code print. |

`GROQ_*` variables still exist in `config/env.ts` but nothing reads them — ignore them.

## Features

### Auth and roles
- `/api/auth/*` is public; everything else requires a valid JWT (`requireAuth`).
- Role-prefixed routes (`/api/agent/*`, `/api/buyer/*`, `/api/investor/*`, `/api/valuer/*`) also need `requireRole(...)` → `403` otherwise.
- User-owned data (clients, reports, saved properties) is always filtered by the owner.
- `GET /api/public/reports/:token` is the one deliberate exception (see report sharing).

### Sign-up with an emailed code
`POST /api/auth/send-otp` `{ email }` emails a 6-digit code; `POST /api/auth/register` then requires it as `otp`.
- Only an HMAC-SHA256 hash is stored (`email_otps` table), the code expires after 10 minutes, and it's consumed only after the account is created.
- Limits: 60 s between sends per email, 5 sends per hour, 5 wrong guesses per code. An already-registered email gets `409`.
- **Local testing without SendGrid:** when `NODE_ENV` isn't `production`, the code is also printed in the terminal as `[dev] OTP for <email>: <code>`.

### Clients and reports
- A report belongs to **zero or one client**, linked by an explicit `clientId` (checked against the owner). Names and emails are never guessed.
- Link at creation (`POST /api/reports` with `clientId`), or at share time: `POST /api/reports/:id/share-link` and `/send-email` accept an optional `clientId`, name and email that get attached to the saved report.
- Emailing a report moves the client forward from `prospecting`/`active` to `appraisal_sent` (never backwards). Copying a link doesn't.
- `GET /api/clients` returns a real `reportCount`; `GET /api/clients/:id/reports` lists a client's reports.
- A report's list status is `shared` once a share link exists.

### Report sharing and email
`getOrCreateShareToken` (`report.service.ts`) issues a random token, separate from the internal `reportId`. The public page reads a **snapshot** saved with the report (price range, sections, comparables, strategy cards), so a client's copy doesn't change when market data does; its response is shaped explicitly and never leaks `ownerUserId`, `shareToken` or `clientEmail`. Email goes through SendGrid's **HTTP API** — SMTP hangs on Render, which blocks those ports.

### Geocoding and places
`/api/geocode` and `/api/places/nearby` proxy Google server-side, because Google rejects referrer-restricted keys for those APIs. Two separate keys: `GOOGLE_MAPS_SERVER_KEY` (here) and `VITE_GOOGLE_MAPS_API_KEY` (frontend).

### Price prediction
`report-content.service.ts` calls `price-prediction.service.ts`, which POSTs to the FastAPI price service (`data_ai/`). Any failure falls back to the comparable-sales average.

### AI narrative (Vertex AI)
`buildExecutiveSummary` first tries `vertex-narrative.service.ts` (the fine-tuned Gemma 2 2B on Vertex AI, `us-central1`) and falls back to templated text on **any** failure — timeout (10 s), missing credentials, no model deployed, unexpected reply. **The fallback is silent**: check the logs for `[vertex-narrative]` warnings to see whether a request really used the model.
- **Works on:** your machine (via `gcloud auth application-default login`) and **Cloud Run** (its service account has `roles/aiplatform.user`). **Not on Render** — no Google credentials, and the organisation blocks service-account keys.
- The endpoint is deployed only when wanted (it bills per GPU-hour). Deploy and undeploy steps are in [`../data_ai/readme.md`](../data_ai/readme.md).
- Known gap: the prompt sent here is short and generic, while the model was trained on longer role-specific prompts, so live quality is below the evaluation score.

## API routes

Base URL `http://localhost:4000`.

| Mount | Routes |
| --- | --- |
| `GET /api/health` | `{ "status": "ok" }` — platform health check |
| `/api/auth` | `POST /send-otp`, `POST /register` (needs `otp`), `POST /login`, `POST /forgot-password` (stub), `GET /me`, `PATCH /me`, `POST /refresh-token` |
| `/api/geocode`, `/api/places` | `GET /?address=…`, `GET /nearby?lat=&lng=&radiusMeters=` |
| `/api/clients` | `GET /`, `GET /:clientId`, `GET /:clientId/reports`, `POST /`, `PATCH /:clientId`, `DELETE /:clientId` |
| `/api/appraisal` | `GET` comparable-sales (+`/search`), market-intelligence-overview, steps, property-types, appraisal-summary, report-templates, executive-summary, narrative-preview, agent-recommendations, growth-outlook, affordability-outlook, appraisal-disclaimer |
| `/api/reports` | `GET /`, `GET /:reportId`, `POST /`, `POST /:reportId/share-link`, `POST /:reportId/send-email` |
| `/api/public/reports` | `GET /:token` — **no auth** |
| `/api/agent/reports`, `/api/buyer/reports`, `/api/investor/reports` (role-gated) | `GET /` (investor also `GET /summary`) |
| `/api/valuer/cases` (role-gated) | `GET /`, `GET /summary`, `PATCH /:reportId` |
| `/api/investor/roi-calculation`, `/api/buyer/affordability-calculation` (role-gated) | `POST /` |
| `/api/investor/market-comparison` (role-gated) | `GET /` |
| `/api/agent|valuer/market-insights`, `/api/buyer|investor/suburb-explorer` (role-gated) | `GET /` |
| `…/properties/saved`, `/api/valuer/evidence/saved` (role-gated read); `/api/properties/saved` (write) | `GET /`; `POST /`, `DELETE /:savedPropertyId` |
| `/api/buyer/inspections` (role-gated) | `GET /`, `POST /`, `PUT /:inspectionId` |

## Deployed

The image is built from the **repo root** (the Dockerfile copies `backend/` and `data_ai/*.csv`). It does not contain a database — `DATABASE_URL` is a runtime variable — and its `CMD` runs `npx prisma migrate deploy` (a no-op when nothing is pending) before starting the server. Seeding and data import are deliberately **not** part of startup.

### Build and push the image
CI does this on every push to `main` touching `backend/**` (`.github/workflows/docker-deploy.yml`). Manually, from the repo root:
```bash
docker build -f backend/Dockerfile -t <dockerhub-user>/relaive-backend:latest .
docker push <dockerhub-user>/relaive-backend:latest
```
Nothing deploys automatically from the pushed image.

### Deployed: Cloud Run (target)
Infrastructure and settings live in Terraform — see [`../infra/terraform/README.md`](../infra/terraform/README.md) (permissions, `terraform apply`, secrets). The service reaches Cloud SQL over the built-in socket and needs no IP allow-list.
1. **Deploy a new image** (Cloud Run doesn't re-pull `:latest` on its own):
   ```bash
   gcloud run services update relaive-backend --region australia-southeast1 --image docker.io/<dockerhub-user>/relaive-backend:latest
   ```
2. **Verify:**
   ```bash
   curl <cloud_run_url>/api/health            # terraform output cloud_run_url
   gcloud run services logs read relaive-backend --region australia-southeast1 --limit 50
   ```
3. **Change settings or secrets:** edit `infra/terraform/variables.tf` (non-secret `backend_env`) or `terraform.tfvars` (`backend_secrets`), then `terraform apply`.

### Deployed: Render (current live backend)
Docker image from Docker Hub as an "Existing Image" web service: image `docker.io/<dockerhub-user>/relaive-backend:latest`, health check path `/api/health`. Render doesn't auto-pull — use **Manual Deploy** after each push. Set these variables in Render → Environment: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`, `TRUST_PROXY=1`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `PUBLIC_APP_URL`, `GOOGLE_MAPS_SERVER_KEY`, `ML_PRICE_PREDICTION_URL`, optionally `TURNSTILE_SECRET_KEY`. Don't set `PORT`. Render reaches Cloud SQL over its public IP, so Render's outbound ranges must be in the instance's `authorized_ips`. It **cannot** use the Vertex narrative model.

## Postman / curl smoke test
1. `POST /api/auth/login` with `{ "email": "postman.user@example.com", "password": "Password123" }`.
2. Copy `accessToken` from the response.
3. Send `Authorization: Bearer <accessToken>` on a protected call, e.g. `GET /api/clients`.

## Contributing
- Responses: success → `{ success: true, data | message }`; failure → `{ success: false, message, errors? }`.
- Validate bodies with a Zod schema in `src/validators/`; filter user-owned rows by `ownerUserId`.
- A public endpoint must shape its response explicitly — never return a raw Prisma row.
- Schema change → `npm run prisma:migrate` against the shared instance (coordinate first), commit the new migration folder, and regenerate the client.
