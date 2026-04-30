# CSIT321 — Web project

Full-stack web app (React frontend + **Python** backend). This README explains **where to add or edit files** so the team keeps a predictable structure instead of scattering code.

## Frontend stack

| Tool | Role |
|------|------|
| [Vite](https://vite.dev/) | Dev server & production build |
| [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | UI layer |
| [Tailwind CSS v4](https://tailwindcss.com/) | Utility classes (`className`), integrated via Vite (`@tailwindcss/vite`) |
| [GSAP](https://greensock.com/gsap/) + [@gsap/react](https://github.com/greensock/react) | Animation; plugin registration and exports live in [`src/lib/gsap.ts`](src/lib/gsap.ts). Prefer `useGSAP` with a `scope`/ref and respect `prefers-reduced-motion` |

Discussion in issues or chats can be in any language; **file names, folder names, and code** should stay in English for consistency.

---

## Scripts

```bash
npm install
npm run dev      # http://localhost:5173 (Vite default port)
npm run build    # production build check
npm run lint
npm run preview  # serve the production build locally
```

**Backend (Python)** is scaffolded under `backend/` without a toolchain committed yet. When you bootstrap it (e.g. [FastAPI](https://fastapi.tiangolo.com/), [Flask](https://flask.palletsprojects.com/), [Django](https://www.djangoproject.com/) REST), keep all API code **inside** `backend/` (`pyproject.toml` / `requirements.txt`, optional `venv/`, `.env` — see `.gitignore`). Extend the [Backend API](#backend-api) section when you finalize layout and scripts (e.g. `uvicorn`, `pytest`).

---

## Repository layout

```text
Project/
├── public/              # Static assets copied as-is (favicon, icons.svg, …)
├── src/                 # Frontend application code
├── backend/             # Python API (folder scaffold; add venv/pyproject/requirements locally)
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig*.json
```

---

## Frontend — `src/`

| Folder / file | Purpose |
|----------------|---------|
| **`app/`** | App shell: providers (theme, query client), root layout when split out from `App.tsx`. |
| **`assets/`** | Images, fonts, and files imported into the bundle (SVG, PNG, …). |
| **`components/ui/`** | Shared, presentational building blocks (buttons, inputs, modals) **without** feature-specific business rules. |
| **`features/`** | Feature-based modules (e.g. `features/auth/`, `features/dashboard/`). Each feature may contain nested `components`, `hooks`, `api` — **put domain logic here** instead of growing `App.tsx` indefinitely. |
| **`pages/`** | Route-level views or top-level screens. Usually composed from `features/` and `layouts/`. |
| **`layouts/`** | Shared page chrome: header, sidebar, footer. |
| **`routes/`** | Router configuration (React Router or similar). |
| **`hooks/`** | Reusable hooks used **across** the app, not owned by a single feature. |
| **`lib/`** | Third-party wiring (HTTP client setup, GSAP registration, etc.). |
| **`services/`** | API / `fetch` layer; keep URLs and response mapping out of components. |
| **`store/`** | Global client state (Zustand, Redux, …) when needed. |
| **`types/`** | Shared TypeScript types. |
| **`styles/`** | Extra CSS/SCSS beyond Tailwind when you need separate files. |
| **`App.tsx` / `App.css`** | Root component and co-located styles (can migrate toward `pages/` + Tailwind over time). |
| **`main.tsx`** | React mount; import order: GSAP registration → `index.css` → `App`. |
| **`index.css`** | `@import 'tailwindcss'` plus global CSS variables / base rules. |

### Frontend conventions

1. **Reusable UI** → `components/ui/`. **A specific screen or feature** → `features/<name>/` or `pages/`.
2. **HTTP calls** → `services/`. Avoid sprinkling raw `fetch` across many components (tiny prototypes excepted).
3. **Hook used only inside one feature** → `features/<name>/hooks/`. **App-wide hook** → `src/hooks/`.
4. **Do not** add new top-level folders under `src/` on a whim — agree as a team and update this README if you introduce a new concept.
5. Prefer Tailwind `className` for styling; keep `App.css` / `index.css` for layout or legacy tokens until you finish migrating.

---

## Backend API

Intended layout for a **REST-style Python** service. Names map cleanly to stacks like FastAPI or Flask (with blueprints); adjust naming if Django’s `apps/` layout fits your course brief better.

| Folder | Contents |
|--------|----------|
| **`src/config/`** | Settings from env vars (`DATABASE_URL`, secrets), DB engine/session factory, optional `settings.py` / Pydantic `BaseSettings`. |
| **`src/routes/`** | URL routing: mount APIRouter / blueprints, path prefixes. |
| **`src/controllers/`** | Thin HTTP layer: parse input, call services, return responses (often small functions or router endpoint bodies). |
| **`src/services/`** | Domain and application logic — keep it framework-agnostic where possible. |
| **`src/models/`** | ORM entities (SQLAlchemy, Tortoise, etc.) or repository-style DB access. |
| **`src/middleware/`** | Cross-cutting behaviour: auth, logging, CORS setup hooks, exception handlers (as your framework exposes them). |
| **`src/validators/`** | Request/response shapes: **Pydantic** models, Marshmallow schemas, etc. (rename to `schemas/` if the team prefers that convention). |
| **`src/utils/`** | Pure helpers (formatting, small algorithms) with no I/O hidden inside. |
| **`src/types/`** | Shared `typing` aliases, protocols, enums — not duplicate Pydantic models unless you need internals-only types. |
| **`tests/unit/`** | Tests for services, validators, utilities (e.g. `pytest`). |
| **`tests/integration/`** | Tests hitting the HTTP app or DB (e.g. `TestClient`, real or test containers). |

**Rule of thumb:** keep `controllers/` (or router handlers) thin; heavy logic lives in `services/`. Avoid raw SQL or third-party HTTP calls scattered outside `models/` and `services/`.

---

## References

- [Vite + React](https://vite.dev/guide/)
- [Tailwind CSS v4 with Vite](https://tailwindcss.com/docs/installation/using-vite)
- [GSAP React — useGSAP](https://greensock.com/docs/v3/React)
- [FastAPI](https://fastapi.tiangolo.com/) / [Python packaging](https://packaging.python.org/)

---

## Contributing

Before merging: run `npm run build` and `npm run lint` for the frontend. When the Python API is wired up, add and document checks (e.g. `pytest`, `ruff`, `mypy`) here. Place new files according to the tables above; if something is unclear, open an issue or PR and **update this README** together with any structural change.
