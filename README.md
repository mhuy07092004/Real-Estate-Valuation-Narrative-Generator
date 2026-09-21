# CSIT321 — Relaive Web Project

A full-stack web application for AI-powered property appraisal (Relaive).

## 🚀 Tech Stack

**Frontend:** Vite, React, TypeScript, Tailwind CSS, React Router DOM, GSAP, Recharts.

**Backend:** Node.js + Express, TypeScript, Prisma ORM (PostgreSQL on Cloud SQL), bcryptjs, jsonwebtoken, Vitest.

See [`backend/README.md`](backend/README.md) for backend-specific versions and detail.

## Prerequisites

- Node.js 22+, npm
- For the backend: access to the project's Cloud SQL Postgres instance — see [`infra/terraform/README.md`](infra/terraform/README.md#connecting-from-your-local-machine) to get your IP allowlisted. There is no local-only database fallback.

## 🏃 Quick Start

```bash
# Frontend (repo root)
npm install
npm run dev          # http://localhost:5173
```

The frontend calls the real backend for everything (auth, reports, comparable sales, etc.) — sign-in and every data-backed page will fail with a network error until the backend is also running. See [`backend/README.md`](backend/README.md) for full backend setup (env vars, database access, seeding).

Run both together in two terminals:

| Terminal | Directory | Command | URL |
|----------|-----------|---------|-----|
| Frontend | repo root | `npm run dev` | http://localhost:5173 |
| Backend | `backend/` | `npm run dev` | http://localhost:4000 |

## 📁 Project Structure

| Path | What's there | Docs |
|---|---|---|
| `frontend/` | React/Vite app | [`frontend/src/features/auth/README.md`](frontend/src/features/auth/README.md) covers the auth feature; no top-level frontend README yet |
| `backend/` | Express/Prisma API | [`backend/README.md`](backend/README.md) |
| `data_ai/` | Data scraping, dataset building, and Gemma fine-tuning for AI narrative generation, plus the FastAPI price-prediction service | [`data_ai/readme.md`](data_ai/readme.md) |
| `infra/terraform/` | GCP infrastructure as code (Cloud SQL, Cloud Run) | [`infra/terraform/README.md`](infra/terraform/README.md) |
| `.github/workflows/` | CI + Docker build/push automation | see "CI" below |

## ☁️ Deployment

| What | Where | Details |
|---|---|---|
| Frontend | Vercel | See "Deploy frontend on Vercel" below |
| Backend | Render (Docker image); Cloud Run migration in progress | [`backend/README.md`](backend/README.md#docker--deployment) |
| AI price-prediction service | Render (Docker image) | [`backend/README.md`](backend/README.md#docker--deployment) |
| AI narrative model (Vertex AI) | GCP, deployed on demand | [`data_ai/readme.md`](data_ai/readme.md) |
| Cloud SQL Postgres | GCP | [`infra/terraform/README.md`](infra/terraform/README.md) |

### Deploy frontend on Vercel

The repo root [`vercel.json`](vercel.json) builds the Vite app and publishes **`frontend/dist`** only (the `backend/` folder is not deployed). Root Directory on Vercel should stay at the repo root (not `frontend`).

| Setting | Value |
|---------|--------|
| Build Command | `npm run build` |
| Output Directory | `frontend/dist` |

The deployed frontend needs to know where the backend lives:

1. In the Vercel project → **Settings → Environment Variables**, add `VITE_API_BASE_URL` set to the deployed backend's origin (e.g. `https://relaive-backend-060826-latest.onrender.com`), for the Production environment (and Preview too, if preview deployments should also hit the live backend).
2. Redeploy so the build picks up the value.

Without `VITE_API_BASE_URL` set, the deployed frontend falls back to relative `/api/...` calls (fine for local dev, where Vite's dev proxy in [`vite.config.ts`](vite.config.ts) forwards those to `localhost:4000`) — but there's no equivalent proxy on Vercel, so those calls would 404 in production. See [`api-client.ts`](frontend/src/services/api-client.ts) for the fetch wrapper that reads this variable.

## ✅ CI

Every pull request into `main` or `dev` runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml): lint + typecheck + build for the frontend, and build + test for the backend.

Docker images build and push to Docker Hub automatically on push to `main` (not auto-deployed — see [`backend/README.md`](backend/README.md#docker--deployment)):
- [`.github/workflows/docker-deploy.yml`](.github/workflows/docker-deploy.yml) — backend, on changes to `backend/**` or `data_ai/*.csv`
- [`.github/workflows/docker-deploy-ai.yml`](.github/workflows/docker-deploy-ai.yml) — AI price-prediction service, on changes to `data_ai/service/**`, `data_ai/model/**`, or `data_ai/*.csv`

## Where to Look Next

- **Backend setup, API routes, deployment detail:** [`backend/README.md`](backend/README.md)
- **Auth flow (sign-up/sign-in/sessions/roles):** [`frontend/src/features/auth/README.md`](frontend/src/features/auth/README.md)
- **AI/ML pipeline (scraping, fine-tuning, price prediction):** [`data_ai/readme.md`](data_ai/readme.md)
- **GCP infrastructure (Cloud SQL, Cloud Run):** [`infra/terraform/README.md`](infra/terraform/README.md)
