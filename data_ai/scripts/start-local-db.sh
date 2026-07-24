#!/usr/bin/env bash
set -euo pipefail

docker compose up -d postgres

echo "Waiting for Postgres to become ready..."
until docker exec relaive-ai-db pg_isready -U relaive -d relaive_ai >/dev/null 2>&1; do
  sleep 1
done

echo "Postgres is ready."
echo "Run schema setup with:"
echo "  docker exec -i relaive-ai-db psql -U relaive -d relaive_ai < database/ddl/001_serving_schema.sql"