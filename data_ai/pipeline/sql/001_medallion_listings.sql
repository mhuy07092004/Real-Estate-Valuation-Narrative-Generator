-- Medallion layers for the sold-listings pipeline (step 1: schemas + tables).
--
--   bronze  raw scraped rows exactly as received, append-only, never updated
--   silver  cleaned, validated, de-duplicated rows + a table of rejects with reasons
--   gold    aggregated / feature tables built from silver
--
-- The application's own tables (properties, comparable_sales, market_intelligence)
-- stay in `public`, owned by Prisma, and become the serving layer loaded from gold.
-- Everything here is idempotent (IF NOT EXISTS): safe to run more than once.
--
-- Run once, as a role allowed to CREATE SCHEMA on the relaive database:
--   psql "$DATABASE_URL" -f data_ai/pipeline/sql/001_medallion_listings.sql

CREATE SCHEMA IF NOT EXISTS bronze;
CREATE SCHEMA IF NOT EXISTS silver;
CREATE SCHEMA IF NOT EXISTS gold;

-- ---------------------------------------------------------------- bronze ----

-- One row per file loaded. The file hash makes loading idempotent: the same
-- file is never loaded into bronze twice.
CREATE TABLE IF NOT EXISTS bronze.ingest_batches (
    batch_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source       TEXT        NOT NULL,                -- e.g. 'domain_com_au'
    file_name    TEXT        NOT NULL,
    file_sha256  TEXT        NOT NULL UNIQUE,
    row_count    INTEGER     NOT NULL DEFAULT 0,
    error_count  INTEGER     NOT NULL DEFAULT 0,
    loaded_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Raw listings. Every source column is kept as TEXT, untouched, so nothing a
-- scraper produced is lost before validation. Mirrors bronze_listings.csv.
CREATE TABLE IF NOT EXISTS bronze.listings (
    bronze_id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    batch_id            UUID        NOT NULL REFERENCES bronze.ingest_batches (batch_id),
    listing_id          TEXT,
    source              TEXT,
    address             TEXT,
    suburb              TEXT,
    postcode            TEXT,
    state               TEXT,
    property_type       TEXT,
    bedrooms            TEXT,
    bathrooms           TEXT,
    parking             TEXT,
    land_size_sqm       TEXT,
    price               TEXT,
    listing_date        TEXT,        -- a sentence, e.g. 'Sold at auction 24 Jul 2026'
    listing_description TEXT,
    raw_payload         JSONB,
    scraped_at          TEXT,
    ingested_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bronze_listings_batch_idx ON bronze.listings (batch_id);

-- Lines that could not even be parsed into columns (wrong field count, etc.).
CREATE TABLE IF NOT EXISTS bronze.listings_errors (
    error_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    batch_id    UUID        NOT NULL REFERENCES bronze.ingest_batches (batch_id),
    line_number INTEGER     NOT NULL,
    raw_line    TEXT        NOT NULL,
    error       TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- silver ----

-- Valid, typed, de-duplicated sales. listing_key is a hash of the natural key
-- (address, suburb, state, sold date, price), so the same sale scraped twice
-- collapses to one row and re-running the transform changes nothing.
CREATE TABLE IF NOT EXISTS silver.listings_clean (
    listing_key       TEXT PRIMARY KEY,
    address_line      TEXT          NOT NULL,
    suburb            TEXT          NOT NULL,
    state             TEXT          NOT NULL,
    postcode          TEXT          NOT NULL,
    property_type     TEXT          NOT NULL
        CHECK (property_type IN ('House', 'Townhouse', 'Villa', 'Apartment', 'Unit')),
    bedrooms          INTEGER       NOT NULL CHECK (bedrooms  >= 0),
    bathrooms         INTEGER       NOT NULL CHECK (bathrooms >= 0),
    parking           INTEGER       NOT NULL CHECK (parking   >= 0),
    area_sqm          DOUBLE PRECISION NOT NULL CHECK (area_sqm >= 0),
    sold_price        NUMERIC(14,2) NOT NULL CHECK (sold_price > 0),
    sold_date         DATE          NOT NULL,
    source            TEXT          NOT NULL,
    first_bronze_id   BIGINT        NOT NULL,   -- bronze row this version came from
    cleaned_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS silver_listings_suburb_idx ON silver.listings_clean (suburb, state);
CREATE INDEX IF NOT EXISTS silver_listings_sold_date_idx ON silver.listings_clean (sold_date);

-- Every bronze row that failed a quality rule, with the rule that failed it.
-- One row per bronze row, so re-running the transform upserts rather than piles up.
CREATE TABLE IF NOT EXISTS silver.listings_rejects (
    bronze_id         BIGINT PRIMARY KEY REFERENCES bronze.listings (bronze_id),
    rejection_reason  TEXT        NOT NULL
        CHECK (rejection_reason IN (
            'unrecognised_property_type', 'no_postcode_match', 'missing_bedrooms',
            'missing_bathrooms', 'missing_parking', 'missing_land_size',
            'invalid_price', 'unparseable_sold_date', 'missing_address_suburb_state'
        )),
    raw_value         TEXT,
    rejected_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS silver_rejects_reason_idx ON silver.listings_rejects (rejection_reason);

-- ------------------------------------------------------------------ gold ----

-- Per-suburb market statistics computed from silver. This is what loads the
-- application's market_intelligence table.
CREATE TABLE IF NOT EXISTS gold.suburb_aggregates (
    suburb                 TEXT NOT NULL,
    state                  TEXT NOT NULL,
    median_price           NUMERIC(14,2) NOT NULL,
    median_house_price     NUMERIC(14,2),
    median_unit_price      NUMERIC(14,2),
    median_price_growth_pct DOUBLE PRECISION,
    monthly_growth_pct     DOUBLE PRECISION,
    sales_in_window        INTEGER NOT NULL,       -- sales in the trailing 12 months
    price_trend            JSONB,                  -- last 12 monthly medians
    computed_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (suburb, state)
);
