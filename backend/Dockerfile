# syntax=docker/dockerfile:1
#
# Build context is the REPO ROOT, not backend/ — this Dockerfile needs to
# match the AI-service Dockerfile's build pattern. Build with:
#   docker build -f backend/Dockerfile -t <image> .   (run from the repo root)

# node:22-slim (Debian) rather than alpine — bcrypt is a native addon without
# reliable prebuilt musl binaries, so alpine risks a native-compile failure.
# (Kept even after the bcrypt→bcryptjs swap — untested whether alpine is
# safe now; not part of this change's scope.)
FROM node:22-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./
COPY backend/prisma ./prisma
RUN npm ci

COPY backend/. .
RUN npx prisma generate
RUN npm run build

# devDependencies (tsx, typescript, vitest, eslint, ...) were only needed to
# build the app — drop them now. `prisma` (the CLI, not @prisma/client) is
# kept as a real dependency (see package.json) since the runner stage below
# needs it to run migrations against the live database at container start.

RUN npm prune --omit=dev

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
EXPOSE 4000
# DATABASE_URL now points at an external Cloud SQL Postgres instance (see
# infra/terraform/), set as a real env var on whatever platform runs this
# container — not baked into the image. Applying migrations on every boot
# is safe and idempotent (a no-op if nothing's pending); seeding/ingestion
# are deliberately NOT run here — those already ran once, directly against
# Cloud SQL (see infra/terraform/README.md), and re-running seed.ts would
# re-insert its non-idempotent sample rows on every deploy.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]