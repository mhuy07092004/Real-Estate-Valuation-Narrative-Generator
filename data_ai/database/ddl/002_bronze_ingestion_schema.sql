CREATE TABLE IF NOT EXISTS bronze_listings (
  listing_id BIGSERIAL PRIMARY KEY,
  source VARCHAR NOT NULL,
  address VARCHAR,
  suburb VARCHAR,
  postcode VARCHAR,
  state VARCHAR,
  property_type VARCHAR,
  bedrooms VARCHAR,
  bathrooms VARCHAR,
  parking VARCHAR,
  land_size_sqm VARCHAR,
  price VARCHAR,
  listing_date VARCHAR,
  listing_description TEXT,
  raw_payload JSONB NOT NULL,
  scraped_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bronze_listings_errors (
  error_id BIGSERIAL PRIMARY KEY,
  source VARCHAR,
  error_reason VARCHAR NOT NULL,
  raw_payload JSONB NOT NULL,
  logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bronze_listings_scraped_at
  ON bronze_listings (scraped_at);

CREATE INDEX IF NOT EXISTS idx_bronze_listings_errors_logged_at
  ON bronze_listings_errors (logged_at);