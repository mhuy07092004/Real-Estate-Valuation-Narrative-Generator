CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

DROP TABLE IF EXISTS rag_document_chunks CASCADE;
DROP TABLE IF EXISTS gold_narrative_training_pairs CASCADE;
DROP TABLE IF EXISTS gold_suburb_aggregates CASCADE;
DROP TABLE IF EXISTS gold_property_model_ready CASCADE;

DROP TYPE IF EXISTS buyer_purpose_enum CASCADE;
DROP TYPE IF EXISTS source_type_enum CASCADE;

CREATE TYPE buyer_purpose_enum AS ENUM ('family', 'personal', 'investment');
CREATE TYPE source_type_enum AS ENUM (
  'client_historical',
  'llm_bootstrapped_reviewed',
  'public_sample',
  'seed_synthetic'
);

CREATE TABLE gold_property_model_ready (
  property_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address VARCHAR NOT NULL,
  suburb VARCHAR NOT NULL,
  postcode VARCHAR NOT NULL,
  state VARCHAR NOT NULL,
  property_type VARCHAR NOT NULL,
  bedrooms INT NOT NULL,
  bathrooms INT NOT NULL,
  parking INT NOT NULL,
  land_size_sqm DECIMAL(12,2) NOT NULL,
  price DECIMAL(14,2) NOT NULL,
  sale_date DATE NOT NULL,
  suburb_median_price_index DECIMAL(12,2),
  cash_rate_at_sale DECIMAL(12,4),
  is_seed_data BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE gold_suburb_aggregates (
  suburb VARCHAR NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  median_price DECIMAL(14,2) NOT NULL,
  listing_count INT NOT NULL,
  avg_days_on_market DECIMAL(10,2) NOT NULL,
  growth_pct_yoy DECIMAL(10,4) NOT NULL,
  is_seed_data BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (suburb, period_start)
);

CREATE TABLE gold_narrative_training_pairs (
  pair_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES gold_property_model_ready(property_id),
  narrative_text TEXT NOT NULL,
  buyer_purpose buyer_purpose_enum NOT NULL,
  source_type source_type_enum NOT NULL,
  consent_confirmed BOOLEAN NOT NULL,
  added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_seed_data BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE rag_document_chunks (
  chunk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document VARCHAR NOT NULL,
  publish_date DATE NOT NULL,
  topic VARCHAR NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector NULL,
  is_seed_data BOOLEAN NOT NULL DEFAULT FALSE
);