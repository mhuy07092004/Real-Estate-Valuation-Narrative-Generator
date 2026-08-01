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

### Backend

*(To be updated)*
