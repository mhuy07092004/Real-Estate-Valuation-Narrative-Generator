# Frontend-Backend Prototype Integration Plan (Auth via User Table, Everything Else Mocked)

## 1. Goal

Integrate frontend and backend end-to-end with this boundary:

1. **Real auth persistence** using existing backend SQLite + Prisma user/role tables.
2. **All non-auth feature data mocked by backend responses** (no extra DB tables for role features).
3. Frontend consumes backend APIs directly (MSW optional/off in integration mode).

---

## 2. Confirmed Constraints

1. Keep only backend local DB (SQLite) for auth persistence.
2. Do not introduce additional databases/services.
3. After login, role dashboards and feature pages should load from backend mock endpoints.
4. No hallucinated endpoints/contracts; align to existing frontend service paths.

---

## 3. Current State Snapshot

### Backend already available

1. `POST /api/auth/register`
2. `GET /api/content/homepage`
3. `GET /api/navigation/config`
4. `POST /api/navigation/demo/start`
5. `GET /api/navigation/demo/:sessionId`
6. `GET /api/reports/:reportId/status`

### Frontend currently expects many additional endpoints

Auth:
1. `POST /api/auth/login`
2. `POST /api/auth/register`
3. `POST /api/auth/forgot-password`
4. `GET /api/auth/me`
5. `POST /api/auth/refresh-token`

Role and shared data:
1. `/api/dashboard/:role`
2. `/api/agent/*`
3. `/api/investor/*`
4. `/api/buyer/*`
5. `/api/valuer/*`
6. `/api/notifications/*`
7. `/api/copilot/*`
8. `/api/appraisal/*`

---

## 4. Architecture Decision

### 4.1 Auth (real, DB-backed)

Use existing Prisma user/role schema for:
1. Register
2. Login
3. Session/user retrieval (`/me`)
4. Token refresh

### 4.2 Non-auth features (mock, backend-served)

Implement backend services/routes that return static/in-memory JSON payloads matching frontend contracts.

No DB reads/writes for:
1. Dashboard data
2. Agent/Investor/Buyer/Valuer feature data
3. Notifications
4. Copilot
5. Appraisal steps/inputs/analysis/templates

---

## 5. Implementation Phases

## Phase A - Auth Completion (DB-backed)

1. Add auth endpoints in backend:
   1. `POST /api/auth/login`
   2. `POST /api/auth/forgot-password` (mock success for now)
   3. `GET /api/auth/me`
   4. `POST /api/auth/refresh-token`
2. Reuse/extend existing auth types so frontend receives expected response shape:
   1. `success`
   2. `message`
   3. `data.user`
   4. `accessToken`
   5. `refreshToken`
   6. `expiresIn`
3. Keep validation and error statuses consistent:
   1. `400` validation
   2. `401` invalid credentials/token
   3. `404` user missing
   4. `409` duplicate email

## Phase B - Backend Mock API Surface (all non-auth)

1. Create backend route groups mirroring frontend service paths exactly.
2. Add mock controllers/services per domain:
   1. Dashboard (`/api/dashboard/:role`)
   2. Agent (`/api/agent/*`)
   3. Investor (`/api/investor/*`)
   4. Buyer (`/api/buyer/*`)
   5. Valuer (`/api/valuer/*`)
   6. Shared notifications/copilot/appraisal (`/api/notifications/*`, `/api/copilot/*`, `/api/appraisal/*`)
3. Source initial payloads from existing frontend MSW data to keep UI behavior unchanged.

## Phase C - Frontend Integration Switch

1. Add Vite dev proxy for API passthrough:
   1. `/api` -> backend host (`http://localhost:4000`)
2. Disable MSW in integration mode:
   1. `VITE_ENABLE_MOCKS=false`
3. Keep frontend service files unchanged where possible (same endpoint paths).

## Phase D - Sign-up and Sign-in UX Completion

1. Sign-up form should submit to backend register endpoint.
2. Handle backend validation/duplicate errors with field messages.
3. On successful register/login:
   1. Persist session
   2. Update auth context
   3. Redirect to dashboard

## Phase E - End-to-End Verification

1. Validate auth flow:
   1. Register new user
   2. Login existing user
   3. Access protected dashboard routes
2. Validate each role page fetches from backend (not MSW):
   1. Agent
   2. Investor
   3. Buyer
   4. Valuer
3. Validate shared pages:
   1. Notifications
   2. Copilot
   3. Generate Report / appraisal steps

---

## 6. Endpoint Coverage Checklist

Auth:
- [ ] `POST /api/auth/register` (existing, verify contract)
- [ ] `POST /api/auth/login`
- [ ] `POST /api/auth/forgot-password`
- [ ] `GET /api/auth/me`
- [ ] `POST /api/auth/refresh-token`

Dashboard:
- [ ] `GET /api/dashboard/agent`
- [ ] `GET /api/dashboard/investor`
- [ ] `GET /api/dashboard/buyer`
- [ ] `GET /api/dashboard/valuer`

Agent:
- [ ] `GET /api/agent/clients`
- [ ] `GET /api/agent/clients/summary`
- [ ] `GET /api/agent/reports`
- [ ] `GET /api/agent/notifications`
- [ ] `GET /api/agent/notifications/unread-count`

Investor:
- [ ] `GET /api/investor/roi-calculation`
- [ ] `GET /api/investor/reports`
- [ ] `GET /api/investor/reports/summary`
- [ ] `GET /api/investor/notifications`
- [ ] `GET /api/investor/notifications/unread-count`

Buyer:
- [ ] `GET /api/buyer/affordability-calculation`
- [ ] `GET /api/buyer/properties/search`
- [ ] `GET /api/buyer/properties/saved`
- [ ] `GET /api/buyer/reports`
- [ ] `GET /api/buyer/notifications`
- [ ] `GET /api/buyer/notifications/unread-count`

Valuer:
- [ ] `GET /api/valuer/evidence`
- [ ] `GET /api/valuer/evidence/summary`
- [ ] `GET /api/valuer/cases`
- [ ] `GET /api/valuer/cases/summary`
- [ ] `GET /api/valuer/notifications`
- [ ] `GET /api/valuer/notifications/unread-count`

Shared:
- [ ] `GET /api/notifications/roi-disclaimer`
- [ ] `GET /api/notifications/affordability-disclaimer`
- [ ] `GET /api/copilot/conversations`
- [ ] `GET /api/copilot/suggestions`
- [ ] `GET /api/copilot/messages`
- [ ] `GET /api/appraisal/steps`
- [ ] `GET /api/appraisal/property-input-methods`
- [ ] `GET /api/appraisal/property-types`
- [ ] `GET /api/appraisal/ai-analysis-metrics`
- [ ] `GET /api/appraisal/ai-analysis-summary`
- [ ] `GET /api/appraisal/comparable-sales`
- [ ] `GET /api/appraisal/suburb-overview`
- [ ] `GET /api/appraisal/demand-signals`
- [ ] `GET /api/appraisal/report-templates`

---

## 7. Acceptance Criteria

1. User can register and login with persisted user records in backend SQLite.
2. Protected frontend routes load after auth without MSW.
3. All dashboard/role/shared pages fetch successfully from backend mock endpoints.
4. No additional DB schema/table is required beyond user/role auth tables.
5. Frontend has zero hard dependency on browser-side mocks for integration mode.

---

## 8. Runbook (Target)

1. Start backend (`backend`): `npm run dev`
2. Start frontend (root): `npm run dev`
3. Set frontend env for integration mode:
   1. `VITE_ENABLE_MOCKS=false`
4. Ensure Vite proxy routes `/api/*` to backend port.

---

## 9. Risks and Mitigations

1. **Token format mismatch** between backend-issued token and frontend decode logic.
   1. Mitigation: align frontend token parsing to JWT payload format or adapt backend response to expected structure.
2. **Contract drift** between frontend TS types and backend payloads.
   1. Mitigation: verify each endpoint with type-aligned sample responses before wiring pages.
3. **Silent fallback to MSW** masking backend issues.
   1. Mitigation: force integration mode with `VITE_ENABLE_MOCKS=false` during validation.

---

## 10. Next Execution Order

1. Implement missing backend auth endpoints.
2. Implement backend mock routes/services for all non-auth frontend services.
3. Add Vite proxy and integration env toggle.
4. Wire sign-up form submit logic.
5. Perform end-to-end smoke verification by role.
