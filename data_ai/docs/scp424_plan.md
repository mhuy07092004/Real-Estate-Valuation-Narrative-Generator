# SCP-424 plan: suburb-level aggregation transform

## Goal
Build a simple suburb-level aggregation transform that turns cleaned silver listings into a gold suburb summary table for later market-intelligence use.

## Scope
This version should stay lightweight and based on the data we currently have.

We will compute:
- mean sale price per suburb per period
- listing count per suburb per period
- monthly growth percentage per suburb per period

We will not compute average days on market because the current silver data does not include that field.

## Proposed output table
Use the existing gold_suburb_aggregates table shape, with these core fields:
- suburb
- period_start
- period_end
- mean_price
- listing_count
- growth_pct_mom
- is_seed_data

## Aggregation strategy
1. Read from silver_listings_clean
2. Group rows by suburb and a fixed monthly period
3. Use monthly buckets for the first implementation
4. For each suburb + period:
   - mean_price = mean of price
   - listing_count = count of rows in the period
   - growth_pct_mom = compare this month’s median price with the previous month for the same suburb
5. Write the result into gold_suburb_aggregates
6. Make the transform idempotent so reruns do not create duplicates for the same suburb/period

## Simplified rules
- Use listing_date as the period anchor
- Use monthly buckets for each suburb
- If the previous month is unavailable, leave growth_pct_mom as null

## Implementation steps
1. Add or confirm the gold_suburb_aggregates table schema
2. Build a Python transform script, for example:
   - data_ai/ingestion/build_suburb_aggregates.py
3. Read silver_listings_clean rows
4. Group by suburb and month bucket
5. Compute median price and listing count
6. Compute month-over-month growth when the same suburb has a prior month available
7. Insert or replace rows for each suburb/period combination

## MVP behavior
- One row per suburb per month
- Mean price and listing count are populated
- Growth is populated when the prior month exists; otherwise it stays null
- Re-running the script does not duplicate rows for already-processed periods

## Recommendation
Keep the first version simple:
- no avg_days_on_market
- no complex geospatial logic
- no reject/error table
- use monthly periods and a simple overwrite/replace strategy for each suburb-period combination

That gives you a practical suburb summary table that fits the available data and avoids unsupported year-over-year comparisons.
