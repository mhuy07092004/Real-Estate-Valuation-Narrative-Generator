"""Silver transform: bronze.listings -> silver.listings_clean + silver.listings_rejects.

Every bronze row is either cleaned into silver.listings_clean or recorded in
silver.listings_rejects with the rule it failed. The same sale scraped twice
collapses to one clean row (same listing_key; the earliest bronze row wins).

Idempotent: running it again changes nothing. If the cleaning rules change,
use --rebuild to clear both silver tables and recompute from bronze (bronze is
never modified).

Usage (from the repo root):
  python data_ai/pipeline/transform_silver_listings.py --dry-run   # read bronze, report counts, write nothing
  python data_ai/pipeline/transform_silver_listings.py             # transform
  python data_ai/pipeline/transform_silver_listings.py --rebuild   # clear silver, then transform
"""

from __future__ import annotations

import argparse
import csv
import io
import sys
import urllib.request
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from cleaning import CleanListing, Rejected, clean_listing  # noqa: E402
from db import connect  # noqa: E402

POSTCODE_LOOKUP_URL = "https://raw.githubusercontent.com/Elkfox/Australian-Postcode-Data/master/au_postcodes.csv"

BRONZE_COLUMNS = [
    "address", "suburb", "state", "property_type", "bedrooms", "bathrooms",
    "parking", "land_size_sqm", "price", "listing_date", "source",
]


def load_postcode_lookup() -> dict[tuple[str, str], str]:
    """(suburb lower-case, STATE) -> postcode; the first match wins, as in the app importer."""
    print("Fetching Australian postcode lookup...")
    with urllib.request.urlopen(POSTCODE_LOOKUP_URL, timeout=30) as response:
        text = response.read().decode("utf-8")

    lookup: dict[tuple[str, str], str] = {}
    for row in csv.DictReader(io.StringIO(text)):
        suburb = (row.get("place_name") or "").strip().lower()
        state = (row.get("state_code") or "").strip().upper()
        postcode = (row.get("postcode") or "").strip()
        if suburb and state and postcode:
            lookup.setdefault((suburb, state), postcode)
    print(f"Loaded {len(lookup)} suburb->postcode mappings.")
    return lookup


def run(dry_run: bool, rebuild: bool) -> None:
    lookup = load_postcode_lookup()

    with connect() as conn, conn.cursor() as cur:
        cur.execute(f"SELECT bronze_id, {', '.join(BRONZE_COLUMNS)} FROM bronze.listings ORDER BY bronze_id")
        bronze = cur.fetchall()

        clean: dict[str, tuple[int, CleanListing]] = {}
        rejects: list[tuple[int, Rejected]] = []
        duplicates = 0
        for bronze_id, *values in bronze:
            result = clean_listing(dict(zip(BRONZE_COLUMNS, values)), lookup)
            if isinstance(result, Rejected):
                rejects.append((bronze_id, result))
            elif result.listing_key in clean:
                duplicates += 1
            else:
                clean[result.listing_key] = (bronze_id, result)

        print(f"\nbronze rows read:           {len(bronze)}")
        print(f"cleaned (before de-dupe):   {len(clean) + duplicates}")
        print(f"  duplicates collapsed:     {duplicates}")
        print(f"  silver.listings_clean:    {len(clean)}")
        print(f"rejected:                   {len(rejects)}")
        for reason, count in Counter(r.reason for _, r in rejects).most_common():
            print(f"  {reason:32s}{count}")

        if dry_run:
            print("\nDry run: nothing written.")
            return

        if rebuild:
            cur.execute("TRUNCATE silver.listings_clean, silver.listings_rejects")

        cur.execute(
            """CREATE TEMP TABLE stage_clean (
                   listing_key TEXT, address_line TEXT, suburb TEXT, state TEXT, postcode TEXT,
                   property_type TEXT, bedrooms INT, bathrooms INT, parking INT, area_sqm DOUBLE PRECISION,
                   sold_price NUMERIC(14,2), sold_date DATE, source TEXT, first_bronze_id BIGINT
               ) ON COMMIT DROP"""
        )
        with cur.copy("COPY stage_clean FROM STDIN") as copy:
            for key, (bronze_id, c) in clean.items():
                copy.write_row((key, c.address_line, c.suburb, c.state, c.postcode, c.property_type, c.bedrooms,
                                c.bathrooms, c.parking, c.area_sqm, c.sold_price, c.sold_date, c.source, bronze_id))
        cur.execute(
            """INSERT INTO silver.listings_clean
                   (listing_key, address_line, suburb, state, postcode, property_type, bedrooms, bathrooms,
                    parking, area_sqm, sold_price, sold_date, source, first_bronze_id)
               SELECT * FROM stage_clean
               ON CONFLICT (listing_key) DO NOTHING"""
        )
        inserted = cur.rowcount

        cur.execute("CREATE TEMP TABLE stage_rejects (bronze_id BIGINT, reason TEXT, raw_value TEXT) ON COMMIT DROP")
        with cur.copy("COPY stage_rejects FROM STDIN") as copy:
            for bronze_id, r in rejects:
                copy.write_row((bronze_id, r.reason, r.raw_value))
        cur.execute(
            """INSERT INTO silver.listings_rejects (bronze_id, rejection_reason, raw_value)
               SELECT bronze_id, reason, raw_value FROM stage_rejects
               ON CONFLICT (bronze_id) DO UPDATE
                   SET rejection_reason = EXCLUDED.rejection_reason, raw_value = EXCLUDED.raw_value, rejected_at = now()"""
        )
        conn.commit()

    print(f"\nWritten: {inserted} new rows in silver.listings_clean, {len(rejects)} rows in silver.listings_rejects.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true", help="read bronze and report counts; write nothing")
    parser.add_argument("--rebuild", action="store_true", help="clear both silver tables first, then recompute")
    args = parser.parse_args()
    run(args.dry_run, args.rebuild)


if __name__ == "__main__":
    main()
