# Frontend

React + TypeScript single-page app (Vite, Tailwind CSS 4). It has a public landing site, sign-in / sign-up (with an emailed code), and one dashboard per role — agent, valuer, buyer, investor. It has no server of its own: every `/api/...` call goes to the backend.

Auth flow details are in [`src/features/auth/README.md`](src/features/auth/README.md).

## Local

**Prerequisites:** Node.js 22+, npm, and the backend running (see [`../backend/README.md`](../backend/README.md)) — without it, sign-in and every data page fail with a network error.

1. Install:
   ```bash
   cd frontend
   npm install
   ```
2. Create the env file (it's gitignored) and fill in the Maps key if you want the map:
   ```bash
   copy .env.example .env.development     # Windows;  cp .env.example .env.development  elsewhere
   ```
3. Start it:
   ```bash
   npm run dev          # http://localhost:5173
   ```
   In dev, Vite forwards every `/api/...` request to `http://localhost:4000` (see `vite.config.ts`), so `VITE_API_BASE_URL` must stay **empty** locally.
4. Checks (the same ones CI runs):
   ```bash
   npm run lint
   npm run build        # tsc -b && vite build
   ```

**Verify:** the landing page loads; signing in with `postman.user@example.com` / `Password123` reaches `/dashboard`.

## Environment variables

Vite bakes these into the build, so changing one on Vercel needs a **redeploy**. Everything prefixed `VITE_` is public in the built site — never put a secret in one.

| Variable | Local | Deployed (Vercel) | What it does |
|---|---|---|---|
| `VITE_API_BASE_URL` | leave empty (dev proxy) | **required** — backend origin, e.g. `https://relaive-backend-qj4inxugxa-ts.a.run.app`, no trailing slash and no `/api` | Prefix for every API call. Without it, production calls hit Vercel itself and 404. |
| `VITE_GOOGLE_MAPS_API_KEY` | optional | set to enable the landing-page map | Browser key for the **Maps JavaScript API**, restricted to `http://localhost:5173/*` and the production URL. Without it the map shows "Map unavailable". |
| `VITE_TURNSTILE_SITE_KEY` | optional | optional | Cloudflare Turnstile site key for the captcha, shown only when the backend asks for it. |
| `VITE_ENABLE_MOCKS`, `VITE_MOCK_ADMIN_*` | leave unset | leave unset | The old mock-service-worker setup. Unmaintained — ignore. |

## Deployed (Vercel)

The Vercel project builds from Git; `vercel.json` in this folder sets the build command (`npm run build`), the output directory (`dist`) and the single-page-app rewrite, so set **Root Directory** to `frontend` in Settings → General.

1. **Settings → Environment Variables** → add or edit for **Production**:
   - `VITE_API_BASE_URL` = the backend's origin.
   - `VITE_GOOGLE_MAPS_API_KEY` = the browser Maps key.
   - `VITE_TURNSTILE_SITE_KEY`, if you use the captcha.
2. **Deployments** → the latest deployment → **Redeploy** (this rebuilds with the new values).
3. **Verify:** open the site, sign in, open a dashboard page that loads data, and check the landing-page map.

**Switching the backend (for example Render → Cloud Run):** change `VITE_API_BASE_URL` and redeploy. Rolling back is the same two steps with the old URL. Users are signed out once, because each backend signs tokens with its own secrets. The backend must list the site in its `CORS_ORIGIN` — it allows only the origins named there, so Vercel preview URLs are blocked unless added.

## If it fails

| Symptom | Likely cause |
|---|---|
| Every page shows a network error locally | Backend not running on port 4000 |
| Works locally, `404` on `/api/...` in production | `VITE_API_BASE_URL` not set on Vercel, or the site wasn't redeployed after setting it |
| Browser console shows a CORS error | The site's origin isn't in the backend's `CORS_ORIGIN` |
| Landing map says "Map unavailable" | `VITE_GOOGLE_MAPS_API_KEY` missing, or the key's referrer list doesn't include this site |
| Address search says "Geocoding is not configured" | That's the **backend** key (`GOOGLE_MAPS_SERVER_KEY`) — see the backend README |

## Folder map (`src/`)

| Path | What's there |
|---|---|
| `main.tsx`, `App.tsx`, `routes/` | Entry point and the route table |
| `pages/` | One component per route: landing, sign-in/up, shared report, and `pages/dashboard/<role>/` |
| `features/auth/` | Sign-in/up forms, `useAuth`, protected routes |
| `features/dashboard/` | Dashboard components, including the report wizard (`generate-report/`) |
| `components/` | Shared UI: landing sections, navbar, cards, tables, buttons |
| `services/` | All HTTP calls (`api-client.ts` is the shared fetch wrapper), grouped by domain |
| `types/`, `hooks/`, `lib/`, `store/`, `layouts/`, `styles/` | Shared types, hooks, helpers, state, layouts, styling |
