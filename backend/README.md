# Backend Guide

This folder contains the Express + TypeScript API for the project.

The backend is designed so it can be tested directly with Postman, even when the frontend is incomplete.

## Tech stack

- Node.js + Express
- TypeScript
- Prisma ORM
- SQLite (local development)
- JWT authentication

## Project layout

- src/server.ts: server entrypoint
- src/app.ts: app wiring and middleware
- src/routes: route modules under /api
- src/controllers: HTTP handlers
- src/services: business logic helpers
- src/middleware/require-auth.ts: bearer token protection
- prisma/schema.prisma: data model
- prisma/seed.ts: sample data and test user

## Quick start

1. Open a terminal in this backend folder.
2. Install packages:

```bash
npm install
```

3. Create env file:

```bash
copy .env.example .env
```

4. Run migrations:

```bash
npm run prisma:migrate
```

5. Seed sample data:

```bash
npm run prisma:seed
```

6. Start API in dev mode:

```bash
npm run dev
```

Server runs on port 4000 by default.

## Authentication model

- Auth endpoints are under /api/auth.
- Non-auth domain endpoints are protected by Bearer token.
- Protection is owner-only for user-owned records (clients, reports, saved properties).

Seeded test login:

- email: postman.user@example.com
- password: Password123

## API routes

Base URL:

- http://localhost:4000

### Public auth routes

| Method | Relative path | Full URL |
| --- | --- | --- |
| POST | /api/auth/register | http://localhost:4000/api/auth/register |
| POST | /api/auth/login | http://localhost:4000/api/auth/login |
| POST | /api/auth/forgot-password | http://localhost:4000/api/auth/forgot-password |
| POST | /api/auth/refresh-token | http://localhost:4000/api/auth/refresh-token |
| GET | /api/auth/me | http://localhost:4000/api/auth/me |

### Protected routes (Bearer token required)

| Method | Relative path | Full URL |
| --- | --- | --- |
| GET | /api/clients | http://localhost:4000/api/clients |
| GET | /api/clients/:clientId | http://localhost:4000/api/clients/:clientId |
| POST | /api/clients | http://localhost:4000/api/clients |
| PATCH | /api/clients/:clientId | http://localhost:4000/api/clients/:clientId |
| DELETE | /api/clients/:clientId | http://localhost:4000/api/clients/:clientId |
| GET | /api/reports | http://localhost:4000/api/reports |
| GET | /api/reports/:reportId | http://localhost:4000/api/reports/:reportId |
| POST | /api/reports | http://localhost:4000/api/reports |
| PATCH | /api/reports/:reportId | http://localhost:4000/api/reports/:reportId |
| DELETE | /api/reports/:reportId | http://localhost:4000/api/reports/:reportId |
| GET | /api/saved-properties | http://localhost:4000/api/saved-properties |
| GET | /api/saved-properties/:savedPropertyId | http://localhost:4000/api/saved-properties/:savedPropertyId |
| POST | /api/saved-properties | http://localhost:4000/api/saved-properties |
| PATCH | /api/saved-properties/:savedPropertyId | http://localhost:4000/api/saved-properties/:savedPropertyId |
| DELETE | /api/saved-properties/:savedPropertyId | http://localhost:4000/api/saved-properties/:savedPropertyId |
| GET | /api/market/comparable-sales | http://localhost:4000/api/market/comparable-sales |
| GET | /api/market/market-intelligence | http://localhost:4000/api/market/market-intelligence |

## API file locations

Main API router:

- src/routes/index.ts

Auth endpoints:

- Route file: src/routes/registration.routes.ts
- Controller file: src/controllers/auth.controller.ts
- Register controller file: src/controllers/registration.controller.ts
- Service files: src/services/auth.service.ts, src/services/registration.service.ts, src/services/user.service.ts, src/services/jwt.service.ts

Clients endpoints:

- Route file: src/routes/clients.routes.ts
- Controller file: src/controllers/clients.controller.ts
- Validator file: src/validators/client.validator.ts
- Auth middleware: src/middleware/require-auth.ts

Reports endpoints:

- Route file: src/routes/report.routes.ts
- Controller file: src/controllers/reports.controller.ts
- Validator file: src/validators/report.validator.ts
- Auth middleware: src/middleware/require-auth.ts

Saved properties endpoints:

- Route file: src/routes/saved-properties.routes.ts
- Controller file: src/controllers/saved-properties.controller.ts
- Validator file: src/validators/saved-property.validator.ts
- Auth middleware: src/middleware/require-auth.ts

Market data endpoints:

- Route file: src/routes/market-data.routes.ts
- Controller file: src/controllers/market-data.controller.ts
- Auth middleware: src/middleware/require-auth.ts

## Postman smoke test

1. Login to get token

Request:

- Method: POST
- URL: http://localhost:4000/api/auth/login
- Body JSON:

```json
{
  "email": "postman.user@example.com",
  "password": "Password123"
}
```

2. Copy accessToken from the response.

3. Call protected endpoint with Authorization header:

- Header name: Authorization
- Header value: Bearer <accessToken>

Example list clients:

- Method: GET
- URL: http://localhost:4000/api/clients

## Notes for new contributors

- Keep endpoint responses consistent:
  - Success: success true + data or message
  - Failure: success false + message (+ optional errors)
- Use zod validators for request payloads.
- Use ownerUserId filters for user-owned resources.
- If schema changes, run migration and regenerate client through prisma migrate.

## Build and test

Build TypeScript:

```bash
npm run build
```

Run tests:

```bash
npm test
```
