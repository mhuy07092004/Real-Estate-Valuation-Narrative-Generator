# Auth

Sign-up, sign-in, session persistence, and route protection — all against
the real backend (`backend/src/routes/registration.routes.ts`). The old
MSW-based mock handlers in `mock/` are unmaintained and no longer part of
the supported dev flow; ignore that folder.

## Folder Map

| Path | Purpose |
|---|---|
| `components/sign-in-form.tsx` | Login form |
| `components/sign-up-form.tsx` | Registration form (role select, captcha gate) |
| `components/forgot-pass-form.tsx` | Forgot-password request form |
| `components/protected-route.tsx` | Redirects to `/signin` if not authenticated |
| `components/auth-layout.tsx` | Shared page chrome for the three auth pages |
| `hooks/use-auth.tsx` | `AuthProvider` + `useAuth()` — the actual auth state |
| `hooks/use-captcha-gate.ts` | Wires Cloudflare Turnstile in when the backend demands it |
| `mock/` | Legacy MSW handlers — unmaintained, not used |

## Auth Flow

**Sign up** — `sign-up-form.tsx` collects full name, email, password, and a
required role (`agent` / `valuer` / `investor` / `buyer`). The email must be
verified first: **Send OTP** calls `sendOtp()` (`POST /api/auth/send-otp`),
which emails a 6-digit code and starts a 60-second resend countdown; the code
is typed into the OTP field. Submitting then calls `register()` from `useAuth`
with the `otp` included. The backend's `registrationSchema`
(`backend/src/validators/registration.validator.ts`) enforces the real
rules: 8+ char password with a letter and a number, role required, 6-digit
code. (Locally, without SendGrid, the code is printed in the backend terminal.)

**Sign in** — `sign-in-form.tsx` calls `login(credentials, { rememberMe })`.
On success, the backend returns a JWT access token + refresh token; `useAuth`
stores the whole session and updates `user` state.

**Session persistence ("Remember me")** — `services/auth.ts` persists the
session under the `relaive_auth` key. The sign-in form's "Remember me"
checkbox (checked by default) picks where:

- checked → `localStorage` (survives closing the browser)
- unchecked → `sessionStorage` (cleared when the tab/browser closes)

`persistSession` writes to the chosen storage and removes the key from the
other, so a session never lives in both. `getStoredSession()` checks
`localStorage` first, then `sessionStorage`, and drops any stored session
whose access token has expired. `AuthProvider` reads it once on mount so a
page refresh doesn't log you out. Sign-up always persists to `localStorage`.
There's no separate "am I still logged in" server check on load — an expired
token is only discovered the next time an API call actually fails.

**Protected routes** — `protected-route.tsx` wraps any route that requires
auth; redirects to `/signin` (preserving the attempted location in router
state) if `isAuthenticated` is false.

**Role-based access** — the session's `user.roles` array drives what a
signed-in user can see; see the dashboard feature's `RoleGate` for how
that's enforced on the frontend, and `backend/src/middleware/require-role.ts`
for the backend equivalent.

## The `useAuth` Hook

Exposes: `user`, `isAuthenticated`, `isLoading`, `login`, `register`,
`updateProfile`, `logout`. `login(credentials, options?)` takes an optional
`{ rememberMe }` (defaults to `true`). Must be called from inside `<AuthProvider>`
(mounted once, near the app root) — throws otherwise.

```tsx
const { user, isAuthenticated, login } = useAuth()
```

## Backend Contract

| Endpoint | Used by |
|---|---|
| `POST /api/auth/send-otp` | `sendOtp()` (sign-up form's Send OTP button) |
| `POST /api/auth/register` | `register()` |
| `POST /api/auth/login` | `login()` |
| `GET /api/auth/me` | — (not currently called on load; session comes from localStorage) |
| `PATCH /api/auth/me` | `updateProfile()` |
| `POST /api/auth/forgot-password` | `forgot-pass-form.tsx` |
| `POST /api/auth/refresh-token` | — (not yet wired into an auto-refresh flow) |

See `backend/README.md`'s Auth Model section for the JWT/role details on
the backend side — not duplicated here.
