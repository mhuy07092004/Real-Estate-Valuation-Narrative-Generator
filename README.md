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

```bash
# 1. Install dependencies (from the root directory)
npm install

# 2. Enable MSW mock API (required for sign-in without the backend)
#    frontend/.env.development is not in Git (.gitignore). Create it locally:
cat > frontend/.env.development << 'EOF'
# Enable MSW mock API in development.
# Mock login: admin@relaive.com / admin
VITE_ENABLE_MOCKS=true
EOF

# 3. Start the development server (restart if it was already running)
npm run dev
```

After the dev server starts, open the browser console — you should see `[MSW] Mocking enabled`. Without `frontend/.env.development`, login calls the real API and will fail if the backend is not running.

### Backend

*(To be updated)*
