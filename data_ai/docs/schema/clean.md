# Silver listings schema

## Table: silver_listings_clean

This table stores cleaned and standardized property listing rows derived from bronze_listings.

### Columns
- silver_listing_id: surrogate primary key
- source_listing_id: foreign reference to bronze_listings.listing_id
- source: source system name, such as domain_com_au
- address: normalized address string
- suburb: standardized suburb name
- postcode: postcode string
- state: normalized state code
- property_type: canonical property type (house, townhouse, unit, land, other)
- bedrooms: integer or null
- bathrooms: integer or null
- parking: integer or null
- land_size_sqm: numeric or null
- price: numeric or null
- listing_date: ISO date or null
- raw_payload: original bronze payload JSONB
- scraped_at: original scrape timestamp
- cleaned_at: timestamp of the silver transform run

### Notes
- The transform is idempotent and replaces the table contents on each run.
- Values that cannot be parsed are stored as null.
