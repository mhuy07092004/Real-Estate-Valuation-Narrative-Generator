# syntax=docker/dockerfile:1

# node:22-slim (Debian) rather than alpine — bcrypt is a native addon without
# reliable prebuilt musl binaries, so alpine risks a native-compile failure.
FROM node:22-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
EXPOSE 4000
# Runs the (ephemeral) SQLite file through the current schema on every boot,
# then starts the server. See backend .env.example for the accepted trade-off
# of data resetting on each redeploy/restart.
CMD ["/bin/sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
