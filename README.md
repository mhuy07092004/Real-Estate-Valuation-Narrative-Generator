# CSIT321 — Relaive Web Project

A full-stack web application for AI-powered property appraisal (Relaive).

## 🚀 Technologies & Frameworks

### Frontend
- **Vite:** ^8.0.10
- **React:** ^19.2.5
- **TypeScript:** ~6.0.2
- **Tailwind CSS:** ^4.2.4
- **React Router DOM:** ^7.18.1
- **GSAP:** ^3.15.0 (with `@gsap/react` ^2.1.2)
- **MSW (Mock Service Worker):** ^2.15.0

### Backend
- **Node.js**
- **Express:** ^4.21.1
- **TypeScript:** ^5.7.2
- **Prisma ORM:** ^5.22.0 (SQLite for local dev)
- **bcrypt:** ^5.1.1
- **jsonwebtoken:** ^9.0.2
- **Vitest:** ^2.1.8

---

## 🏃‍♂️ How to Run

### Frontend (Port 5173)

The frontend development server runs on **http://localhost:5173** by default.

The frontend uses **MSW** to fake auth APIs in development. That only turns on when `VITE_ENABLE_MOCKS=true` is set in a local env file. The file **`frontend/.env.development`** is listed in `.gitignore`, so it is **not** in the repo — you must create it on your machine after clone.

**Option A — terminal (from the repo root, same folder as `package.json`):**

```bash
# 1. Install dependencies
npm install

# 2. Create frontend/.env.development (one-time per machine)
cat > frontend/.env.development << 'EOF'
# Enable MSW mock API in development.
# Mock login: admin@relaive.com / admin
VITE_ENABLE_MOCKS=true
EOF

# 3. Start Vite (if dev was already running, stop it and run again)
npm run dev
```

**Option B — create the file in your editor:**

1. In the project, open or create **`frontend/.env.development`** (inside the `frontend` folder, not the repo root).
2. Paste exactly this (no quotes around the whole file):

   ```env
   # Enable MSW mock API in development.
   # Mock login: admin@relaive.com / admin
   VITE_ENABLE_MOCKS=true
   ```

3. Save the file, then from the repo root run `npm install` (if you have not yet) and `npm run dev`.

**Check that mocks are on:** open http://localhost:5173, open the browser **Developer Tools → Console**. You should see `[MSW] Mocking enabled`. If you see mocking disabled or login fails with a network error, the env file is missing, in the wrong folder, or the dev server was not restarted after creating the file.

**Demo sign-in (mock only):** email `admin@relaive.com`, password `admin`.

Without `frontend/.env.development`, sign-in calls the real backend (`/api/auth/login`) and will fail until the backend is running and wired up.

### Deploy frontend on Vercel

The repo root [`vercel.json`](vercel.json) builds the Vite app and publishes **`frontend/dist`** only (the `backend/` folder is not deployed). Root Directory on Vercel should stay at the repo root (not `frontend`).

| Setting | Value |
|---------|--------|
| Build Command | `npm run build` |
| Output Directory | `frontend/dist` |

[`frontend/.env.production`](frontend/.env.production) currently has `VITE_ENABLE_MOCKS=false` — the deployed frontend calls the real backend, not MSW mocks. For that to work it needs to know where the backend lives:

1. In the Vercel project → **Settings → Environment Variables**, add `VITE_API_BASE_URL` set to the deployed backend's origin (e.g. `https://relaive-backend-060826-latest.onrender.com`), for the Production environment (and Preview too, if preview deployments should also hit the live backend).
2. Redeploy so the build picks up the value.

Without `VITE_API_BASE_URL` set, the deployed frontend falls back to relative `/api/...` calls (fine for local dev, where Vite's dev proxy in [`vite.config.ts`](vite.config.ts) forwards those to `localhost:4000`) — but there's no equivalent proxy on Vercel, so those calls would 404 in production. See [`api-client.ts`](frontend/src/services/api-client.ts) for the fetch wrapper that reads this variable.

If you want a mocks-only demo (no live backend at all), set `VITE_ENABLE_MOCKS=true` instead — see the "Frontend" section above for what that enables.

---

### Backend (Port 4000)

The backend runs as a separate Node.js/Express server on **http://localhost:4000**.
It uses **Prisma ORM** with a local **SQLite** database for development.
All commands below must be run from the **`backend/`** folder.

#### 1. Install dependencies

```bash
cd backend
npm install
```

#### 2. Set up the environment file

Copy the example env file (the defaults work out-of-the-box for local development):

```bash
cp .env.example .env
```

The `.env` file looks like this (see [`backend/.env.example`](backend/.env.example) for the full, current version including Groq/AI config):

```env
PORT=4000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=file:./dev.db

JWT_ACCESS_SECRET=dev-access-secret-change-me
JWT_REFRESH_SECRET=dev-refresh-secret-change-me
JWT_ACCESS_EXPIRES_IN_SECONDS=3600
JWT_REFRESH_EXPIRES_IN=7d

GROQ_API_KEY=
```

> **Note:** The default values are safe for local development only. Do **not** use these secrets in a production environment. No quotes around `DATABASE_URL` — `docker run --env-file` passes values through literally (including quote characters), unlike `dotenv`, which strips them.
>
> `GROQ_API_KEY` is required for AI-generated report narratives to work — see "AI narrative generation" below. Without it, narrative endpoints fall back to static placeholder text.

#### 3. Set up the database

Run the following commands **in order** to initialize the SQLite database, apply migrations, and seed initial data:

```bash
# Generate the Prisma client (must run after any schema change)
npm run prisma:generate

# Apply the database schema (creates the SQLite file if it doesn't exist)
npm run prisma:migrate

# Seed the database with initial roles and a demo user
npm run prisma:seed
```

> **Note:** `prisma/dev.db` is gitignored, not committed — it does **not** ship with the repo. On a fresh clone you must run both `prisma:migrate` and `prisma:seed` before starting the server. (If you already have a local `dev.db` from a previous run, you can skip straight to step 4.)

#### 4. Start the backend dev server

```bash
npm run dev
```

The server starts on **http://localhost:4000** with hot-reload via `tsx watch`. You should see:

```
Server running on http://localhost:4000
```

#### 5. Running frontend and backend together

Open **two separate terminals**:

| Terminal | Directory | Command | URL |
|----------|-----------|---------|-----|
| Terminal 1 — Frontend | repo root | `npm run dev` | http://localhost:5173 |
| Terminal 2 — Backend | `backend/` | `npm run dev` | http://localhost:4000 |

When the real backend is running, set `VITE_ENABLE_MOCKS=false` in `frontend/.env.development` so the frontend calls the real API instead of MSW.

#### Backend scripts reference

| Script | Command | Description |
|--------|---------|-------------|
| Start dev server | `npm run dev` | Hot-reload Express server via `tsx watch` |
| Build | `npm run build` | Compile TypeScript to `dist/` |
| Start production | `npm run start` | Run compiled `dist/server.js` |
| Run tests | `npm run test` | Run Vitest test suite |
| Generate Prisma client | `npm run prisma:generate` | Re-generate Prisma client after schema changes |
| Apply DB migration | `npm run prisma:migrate` | Apply schema changes to the local SQLite database |
| Seed database | `npm run prisma:seed` | Insert initial roles and demo user data |

---

## 🤖 AI narrative generation (Groq)

Report narratives are generated by calling [Groq's](https://console.groq.com/keys) chat completions API, with a distinct prompt per report type (vendor appraisal, bank valuation, buyer advisory, investment report) — see [`backend/src/services/narrative-prompts.ts`](backend/src/services/narrative-prompts.ts) and [`backend/src/services/groq.service.ts`](backend/src/services/groq.service.ts).

Required env var (local `.env` or Render): `GROQ_API_KEY` (get one at https://console.groq.com/keys). Optional: `GROQ_MODEL` (default `openai/gpt-oss-120b`), `GROQ_BASE_URL`, `GROQ_TEMPERATURE`, `GROQ_MAX_TOKENS` — see [`backend/.env.example`](backend/.env.example). Groq periodically retires models (e.g. `llama-3.3-70b-versatile`, decommissioned 2026-08-16) — check https://console.groq.com/docs/models if narratives suddenly start failing.

Endpoint: `GET /api/appraisal/narrative-preview?...&reportType=<vendor-appraisal|bank-valuation|buyer-advisory|investment-report>` (property fields as query params — see [`backend/src/routes/mock.routes.ts`](backend/src/routes/mock.routes.ts)). If `GROQ_API_KEY` is missing or the Groq call fails, this endpoint falls back to static placeholder text rather than erroring — check the server logs for a `Groq narrative generation failed...` warning if the response doesn't look AI-generated.

---

## ☁️ Deploy backend (Docker → Docker Hub → Render)

The backend ships as a Docker image (see [`backend/Dockerfile`](backend/Dockerfile)) built and pushed by hand — there's no CI automation for this yet.

**1. Build and push the image:**

```bash
docker login
docker build -t <your-dockerhub-username>/relaive-backend:latest ./backend
docker push <your-dockerhub-username>/relaive-backend:latest
```

**2. Create the Render service** (dashboard → New Web Service → "Existing Image", not "connect a repo"):

| Setting | Value |
|---|---|
| Image URL | `docker.io/<your-dockerhub-username>/relaive-backend:latest` |
| Health Check Path | `/api/health` |

**3. Environment variables to set on Render:**

| Variable | Notes |
|---|---|
| `DATABASE_URL` | `file:./dev.db` — see the SQLite caveat below |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | **Generate real random values** (e.g. `openssl rand -hex 32`) — do not reuse the checked-in dev defaults |
| `CORS_ORIGIN` | The deployed frontend's origin, e.g. `https://real-estate-valuation-narrative-gen.vercel.app` (comma-separate multiple, e.g. to also allow a Vercel preview URL) |
| `GROQ_API_KEY` | See "AI narrative generation" above |
| `PORT` | Supplied automatically by Render — don't set it |

**4. Redeploying after a change:** push a new `:latest` to Docker Hub, then trigger "Manual Deploy" in the Render dashboard to pull it — this is a manual step since there's no CI wired up.

**SQLite caveat:** the container runs `prisma migrate deploy` on every boot against a local SQLite file inside the container's ephemeral filesystem. That means **all data (users, clients, reports) resets on every redeploy or restart** — an accepted trade-off for now to avoid standing up Postgres. If this needs to hold real data long-term, migrate `schema.prisma`'s datasource to Postgres and use a managed Render Postgres instance instead.
