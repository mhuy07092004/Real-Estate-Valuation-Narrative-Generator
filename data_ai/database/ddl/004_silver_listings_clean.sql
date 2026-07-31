CREATE TABLE IF NOT EXISTS silver_listings_clean (
  silver_listing_id BIGSERIAL PRIMARY KEY,
  source_listing_id BIGINT NOT NULL,
  source VARCHAR,
  address VARCHAR,
  suburb VARCHAR,
  postcode VARCHAR,
  state VARCHAR,
  property_type VARCHAR,
  bedrooms INTEGER,
  bathrooms INTEGER,
  parking INTEGER,
  land_size_sqm NUMERIC,
  price NUMERIC,
  listing_date DATE,
  raw_payload JSONB,
  scraped_at TIMESTAMP,
  cleaned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (source_listing_id)
);

CREATE INDEX IF NOT EXISTS idx_silver_listings_clean_suburb
  ON silver_listings_clean (suburb);

CREATE INDEX IF NOT EXISTS idx_silver_listings_clean_listing_date
  ON silver_listings_clean (listing_date);
