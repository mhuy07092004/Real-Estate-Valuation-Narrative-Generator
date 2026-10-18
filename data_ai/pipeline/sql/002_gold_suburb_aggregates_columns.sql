-- Adds the two columns gold.suburb_aggregates needs to feed the application's
-- market_intelligence table (they were missing from 001). Idempotent.
--
--   cd backend
--   npx prisma db execute --file ..\data_ai\pipeline\sql\002_gold_suburb_aggregates_columns.sql --schema prisma\schema.prisma

ALTER TABLE gold.suburb_aggregates
    ADD COLUMN IF NOT EXISTS monthly_growth_trend_pp DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS as_of_month DATE;
