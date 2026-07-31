# SCP-417 plan: build the gold model-ready dataset

## Goal
Create a simple gold-layer transform that turns cleaned silver listings into a model-ready dataset for later API and training work.

## Scope
This version should stay intentionally lightweight and based on what we already have:
- silver listings from SCP-416
- bronze macro indicators from SCP-415
- one national macro field that is already available
- one suburb-level macro field that is not available yet, so it will remain blank for now

## Proposed output table
Use a gold table such as gold_property_model_ready with these core columns:
- property_id or source_listing_id
- address
- suburb
- postcode
- state
- property_type
- bedrooms
- bathrooms
- parking
- land_size_sqm
- price
- sale_date
- national_macro_value
- suburb_macro_value
- is_seed_data

## Simplified join strategy
For now, do not over-engineer the join.

1. Read all rows from silver_listings_clean
2. Read the latest macro indicator row from bronze_macro_indicators
3. Attach the national value to every property row
4. Leave suburb_macro_value blank for now because we do not yet have a reliable suburb-level macro source in the current pipeline
5. Write the result into gold_property_model_ready

This gives us a usable gold table without blocking on missing suburb-level data.

## Why this approach fits the current state
- The macro ingestion already has a national indicator source
- The current bronze data has no suburb-level macro dataset wired into the pipeline yet
- The later API and training tickets only need a stable model-ready table, not a perfect macro join immediately

## Implementation steps
1. Add or confirm the gold table schema for gold_property_model_ready
2. Build a Python transform script, for example:
   - data_ai/ingestion/build_gold_properties.py
3. Read from silver_listings_clean and bronze_macro_indicators
4. Join the latest national macro indicator onto each property row
5. Set suburb_macro_value to null/blank for now
6. Insert into gold_property_model_ready
7. Make the script idempotent so reruns do not create duplicates

## MVP behavior
- Each silver listing becomes one gold row
- The national macro field is populated
- The suburb macro field is left blank/null for now
- The transform runs end-to-end from the current data sources

## Recommendation
I would keep the first version very simple:
- one national macro field
- one suburb macro field intentionally left empty
- no reject/error table
- no complex date matching logic yet

That keeps the implementation pragmatic and avoids adding extra complexity before the data foundation is fully there.
