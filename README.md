# Relaive

A full-stack web app for AI-assisted property appraisal. Agents, valuers, buyers and investors each get their own dashboard: comparable-sales analysis, market intelligence, ROI / affordability calculators, AI-written appraisal reports, and shareable client reports.

This README explains **what is in the codebase and how the pieces fit together**. Each large folder has its own README with the numbered steps (commands) to reproduce its part — locally and deployed. Start there when you need to *do* something.

## How it fits together

```
 Browser
   │  React single-page app                         (Vercel)
   ▼
 Backend API — Node / Express / Prisma              (Render today · Cloud Run ready)
   ├── Cloud SQL Postgres (Sydney)                  users, clients, reports, comparable sales, market data
   ├── AI price service — FastAPI + scikit-learn    (Render)   estimated value
   ├── Vertex AI endpoint — fine-tuned Gemma 2 2B   (GCP us-central1, deployed on demand)   report narrative
   ├── SendGrid                                     sign-up codes, report emails
   └── Google Maps Geocoding + Places               address lookup, nearby amenities
 Browser also loads the Google Maps JavaScript API directly (separate, referrer-restricted key).
```

Two things worth knowing up front:
- **The AI narrative can only be produced from Cloud Run or a developer machine.** Vertex AI needs Google credentials, Render has none, and the organisation forbids service-account keys. Everywhere else the backend silently falls back to templated report text.
- **The database is shared.** There is no local database: local development connects to the same Cloud SQL instance the deployed backends use (your IP has to be allow-listed).

## Tech stack

| Layer | Technology | Runs on |
|---|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7, Recharts, GSAP, `@vis.gl/react-google-maps` | Vercel · `localhost:5173` |
| Backend | Node.js 22, Express 4, TypeScript, Zod, JWT (`jsonwebtoken`), `bcryptjs`, Vitest | Render (Docker) · Cloud Run (Docker) · `localhost:4000` |
| Database | PostgreSQL 16 on Cloud SQL, Prisma 5 (ORM and migrations) | GCP `australia-southeast1` |
| Price model | Python 3.11, pandas, scikit-learn (RandomForest), FastAPI, uvicorn | Render (Docker) · `localhost:8000` |
| Narrative model | Gemma 2 2B-it + LoRA (Hugging Face `transformers`, `peft`, `trl`), vLLM serving | Vertex AI (train: Sydney, serve: `us-central1` L4) |
| Data collection | Python, pandas, undetected-chromedriver (scrapers for listings, Domain, ABS, SQM) | local machine |
| Infrastructure as code | Terraform ≥ 1.5 (`google` + `random` providers) | local machine → GCP |
| CI/CD | GitHub Actions (lint/typecheck/test; Docker build and push) | GitHub |
| Hosting | Vercel (frontend), Render (backend + price service), Cloud Run, Docker Hub (images) | — |
| Third-party services | SendGrid (email), Google Maps Platform (Maps JS, Geocoding, Places New), Cloudflare Turnstile (captcha), Hugging Face (Gemma weights) | — |

## Repository map

| Folder | What it is | README |
|---|---|---|
| [`frontend/`](frontend/) | The React app: landing site, auth, and the four role dashboards | [`frontend/README.md`](frontend/README.md) · [`frontend/src/features/auth/README.md`](frontend/src/features/auth/README.md) |
| [`backend/`](backend/) | The Express API, Prisma schema and migrations, data-import scripts, Dockerfile | [`backend/README.md`](backend/README.md) |
| [`data_ai/`](data_ai/) | Scrapers and datasets, the price-prediction model and service, and the narrative-model fine-tuning / serving pipeline | [`data_ai/readme.md`](data_ai/readme.md) |
| [`infra/terraform/`](infra/terraform/) | GCP infrastructure as code: Cloud SQL, Cloud Run, IAM | [`infra/terraform/README.md`](infra/terraform/README.md) |
| [`.github/workflows/`](.github/workflows/) | `ci.yml` (frontend lint/typecheck/build, backend build/test), `docker-deploy.yml` (backend image), `docker-deploy-ai.yml` (price-service image) | — |

## Environments

| | Local | Deployed today | Target after cut-over |
|---|---|---|---|
| Frontend | `npm run dev` on 5173, `/api` proxied to `localhost:4000` | Vercel, calls the Render backend | Vercel, calls the Cloud Run backend |
| Backend | `npm run dev` on 4000 → Cloud SQL public IP | Render, Docker image from Docker Hub | Cloud Run, same image, Cloud SQL socket |
| Price model | optional, `uvicorn` on 8000 | Render (its own image) | unchanged |
| Narrative model | works via your `gcloud` login | not available on Render | Cloud Run service account |
| Database | shared Cloud SQL | shared Cloud SQL | shared Cloud SQL |

## CI/CD

- **Every push and pull request** to `main` or `dev` runs `ci.yml`: frontend `lint` + typecheck + build, backend `prisma generate` + build + tests.
- **Pushes to `main`** that touch `backend/**` (or `data_ai/*.csv`) build and push `relaive-backend:latest` to Docker Hub; changes under `data_ai/service|model` build `relaive-ai-service:latest`.
- **Nothing deploys automatically from those images.** Render needs a manual deploy, and Cloud Run needs a new revision (commands in [`backend/README.md`](backend/README.md#deployed-cloud-run-target)). Vercel deploys the frontend from Git on its own.

## Older files you may run into

These predate the current design and are kept only for history: `integration-plan.md` (SQLite-era plan), `frontend/mapSetupREADME.md` (superseded by the frontend README), `VERCEL_ENV_VARIABLE.txt` (actually old pull-request notes, not environment variables), and `data_ai/Relaive_AI_Data_Service_Backlog.md`. Don't follow instructions found in them.
