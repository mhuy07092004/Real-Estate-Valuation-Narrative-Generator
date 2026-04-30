# CSIT321 — Web project

Full-stack web app (React frontend + Node-style backend layout). This README explains **where to add or edit files** so the team keeps a predictable structure instead of scattering code.

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

The backend folder does not yet ship with its own `package.json`. When you bootstrap the API (Express, Fastify, etc.), keep source and run scripts **inside** `backend/` and extend the [Backend API](#backend-api) section below accordingly.

---

## Repository layout

```text
Project/
├── public/              # Static assets copied as-is (favicon, icons.svg, …)
├── src/                 # Frontend application code
├── backend/             # API (folder scaffold; runtime not required yet)
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

Intended layout for a REST-style Node service (adapt to your framework as needed):

| Folder | Contents |
|--------|----------|
| **`src/config/`** | Environment variables, database connection, server settings. |
| **`src/routes/`** | Route definitions wired to controllers. |
| **`src/controllers/`** | Request/response handling; delegate to services. |
| **`src/services/`** | Business logic. |
| **`src/models/`** | Data access / ORM models / repositories. |
| **`src/middleware/`** | Auth, logging, error handling, etc. |
| **`src/validators/`** | Request validation schemas (Zod, Joi, …). |
| **`src/utils/`** | Pure helper functions. |
| **`src/types/`** | Server-side TypeScript types. |
| **`tests/unit/`** | Unit tests. |
| **`tests/integration/`** | API or database integration tests. |

**Rule of thumb:** keep controllers thin; heavy work belongs in `services/`. Do not scatter SQL or external API logic outside `models/` and `services/`.

---

## References

- [Vite + React](https://vite.dev/guide/)
- [Tailwind CSS v4 with Vite](https://tailwindcss.com/docs/installation/using-vite)
- [GSAP React — useGSAP](https://greensock.com/docs/v3/React)

---

## Contributing

Before merging: run `npm run build` and `npm run lint`. Place new files according to the tables above; if something is unclear, open an issue or PR and **update this README** together with any structural change.
