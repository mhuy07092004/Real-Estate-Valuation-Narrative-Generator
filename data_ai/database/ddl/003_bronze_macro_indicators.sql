CREATE TABLE IF NOT EXISTS bronze_macro_indicators (
  macro_id BIGSERIAL PRIMARY KEY,
  source VARCHAR NOT NULL,
  indicator_name VARCHAR NOT NULL,
  geography_level VARCHAR NOT NULL,
  geography_code VARCHAR,
  period_start DATE NOT NULL,
  period_end DATE,
  value NUMERIC,
  unit VARCHAR,
  raw_payload JSONB NOT NULL,
  fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bronze_macro_indicators_fetched_at
  ON bronze_macro_indicators (fetched_at);
