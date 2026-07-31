# SCP-416 plan: bronze-to-silver cleaning and standardization

## Goal
Build the first cleaning transform for the current data pipeline so raw listings from bronze can become usable silver data for later gold-layer work.

This plan is intentionally MVP-focused and fits the code and data we already have in the repo:
- the scraper writes raw rows into bronze_listings
- the current bronze rows contain mixed strings, free-text dates, and inconsistent property types
- there is no silver layer yet, so this ticket should create it and make it runnable end-to-end

## What exists today
- Ingestion script: data_ai/ingestion/bronze_listing_ingest.py
- Bronze table: bronze_listings
- Bronze error table: bronze_listings_errors
- Seed script: data_ai/scripts/seed_prototype_data.py

The sample rows already show the main issues to solve:
- price is stored as a currency string like "$3,450,000"
- listing_date is free text like "Sold at auction 24 Jul 2026"
- property_type can be null or inconsistent
- postcode is currently blank
- address formatting is not normalized

## Scope for SCP-416
Implement a transform that reads from bronze_listings and produces:
- silver_listings_clean: cleaned, deduplicated, standardized rows

## Proposed data flow
1. Read all rows from bronze_listings
2. Normalize and validate each row
3. Deduplicate by a normalized address + normalized listing date key
4. Keep the most recently scraped version when duplicates exist
5. Insert cleaned rows into silver_listings_clean
6. Make the run idempotent so a second run does not create duplicate silver rows

## Suggested table design
### silver_listings_clean
Create a table with these core columns:
- source_listing_id: the bronze listing_id source row
- source: source name such as domain_com_au
- address: cleaned address
- suburb: trimmed and standardized suburb name
- postcode: parsed postcode
- state: normalized state code
- property_type: canonical property type
- bedrooms: integer or null
- bathrooms: integer or null
- parking: integer or null
- land_size_sqm: numeric or null
- price: numeric or null
- listing_date: ISO date or null
- raw_payload: original bronze payload JSONB
- scraped_at: original scrape timestamp
- cleaned_at: timestamp of silver transform run
- is_duplicate: boolean or null for auditability

## Normalization rules
### Address normalization
- trim whitespace
- collapse repeated internal whitespace
- lowercase for comparison
- standardize common abbreviations before deduplication
  - St -> Street
  - Rd -> Road
  - Ave -> Avenue
  - Cres -> Crescent
  - Dr -> Drive
  - Pde -> Parade
- keep a cleaned display version for the silver row

### Deduplication
Use a deduplication key based on:
- normalized address
- normalized listing date

If multiple bronze rows share the same key:
- keep the row with the latest scraped_at
- mark the older duplicate rows as suppressed or record them in an audit table if needed later

### Field standardization
- price: strip "$", ",", whitespace; convert to numeric; if it cannot be parsed, leave it null
- listing_date: parse common formats such as:
  - YYYY-MM-DD
  - DD Mon YYYY
  - "Sold at auction 24 Jul 2026"
  - "Sold by private treaty 13 Jul 2026"
  If parsing fails, leave it null
- property_type: canonicalize values such as:
  - house
  - townhouse
  - unit/apartment
  - land
  - other
- bedrooms/bathrooms/parking: parse to integers if possible; otherwise leave null
- empty strings: convert to null
- postcode: preserve as string or integer, but do not leave blanks

## Idempotency
The transform should be safe to run more than once.
Recommended approach:
- use a unique key on source + source_listing_id
- upsert into silver_listings_clean
- remove any stale rows for the same source_listing_id before inserting the new version

This ensures a rerun does not create duplicate rows.

## Implementation steps
1. Add SQL DDL for silver_listings_clean
2. Add a Python transform script, for example:
   - data_ai/ingestion/clean_listings.py
3. Implement normalization helpers:
   - normalize_address()
   - normalize_property_type()
   - parse_price()
   - parse_listing_date()
   - normalize_text_field()
4. Implement deduplication and insert into the single silver table
5. Add a small CLI entry point so it can be run as a single command
6. Add tests for:
   - successful parsing of a standard row
   - handling of a malformed price/date
   - deduplication behavior
   - idempotent rerun
7. Document the schema in data_ai/docs/schema/clean.md

## MVP acceptance criteria
- The transform reads from bronze_listings and writes to silver_listings_clean
- Rows with invalid critical fields are normalized as null rather than failing the whole run
- Duplicate rows by normalized address + listing date are collapsed to one silver row
- Running the transform twice does not create duplicate silver rows
- The output schema is documented and matches the actual table definitions

## Recommended first implementation slice
For the first pass, keep it simple and reliable:
- focus on the current Domain scraper output only
- do not add geocoding or external enrichment yet
- do not try to join macro data yet
- use straightforward parsing and reject logic rather than over-engineering

That will give us a solid silver layer that the later gold-layer and API tickets can build on.
