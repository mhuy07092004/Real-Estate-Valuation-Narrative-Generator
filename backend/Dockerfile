# syntax=docker/dockerfile:1
#
# Build context is the REPO ROOT, not backend/ — this Dockerfile needs to
# reach data_ai/*.csv, which sits outside backend/. Build with:
#   docker build -f backend/Dockerfile -t <image> .   (run from the repo root)

# node:22-slim (Debian) rather than alpine — bcrypt is a native addon without
# reliable prebuilt musl binaries, so alpine risks a native-compile failure.
FROM node:22-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./
COPY backend/prisma ./prisma
RUN npm ci

COPY backend/. .
RUN npx prisma generate
RUN npm run build

# Bake reference data into the image at build time (one cost per build,
# instead of re-ingesting on every container boot). These are the same
# ingestion scripts you run manually today — they resolve their CSV inputs
# relative to backend/ as "../data_ai/...", so the CSVs need to land as a
# sibling of /app inside the image, at /data_ai.
COPY data_ai/bronze_listings.csv /data_ai/bronze_listings.csv
COPY data_ai/domain_suburb_insights.csv /data_ai/domain_suburb_insights.csv
COPY data_ai/abs_population_raw.csv /data_ai/abs_population_raw.csv
COPY data_ai/abs_building_approvals_raw.csv /data_ai/abs_building_approvals_raw.csv
COPY data_ai/sqm_vacancy_rate_raw.csv /data_ai/sqm_vacancy_rate_raw.csv

ENV DATABASE_URL=file:./prisma/dev.db
RUN npx prisma migrate deploy
RUN npx tsx prisma/seed.ts
RUN npx tsx scripts/ingest-bronze-listings.ts
RUN npx tsx scripts/load-external-market-data.ts
RUN npx tsx scripts/build-suburb-market-intelligence.ts

# devDependencies (tsx, typescript, vitest, eslint, ...) were only needed to
# build the app and run the ingestion scripts above — drop them now.
RUN npm prune --omit=dev

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL=file:./prisma/dev.db
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
EXPOSE 4000
# DB is already migrated, seeded, and populated with reference data as of
# build time (see builder stage above) — just start the server.
CMD ["node", "dist/server.js"]
