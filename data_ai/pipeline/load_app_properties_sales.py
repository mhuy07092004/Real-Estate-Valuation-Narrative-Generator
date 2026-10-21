# Author: The Long Tran
"""Serving load: silver.listings_clean -> the app's properties + comparable_sales.

Replaces the scraped rows in both tables with the clean, de-duplicated sales in
silver (one property + one sale per silver row, like the old TypeScript importer
but without its duplicates). Rows that never came from the scraped data - the
seeded Richmond VIC demo properties - are kept with their original ids.

Everything happens in one transaction. First both tables are copied to
gold.properties_backup_<stamp> / gold.comparable_sales_backup_<stamp>; after the
insert the row counts are checked, and any mismatch rolls the whole thing back.

Usage (from the repo root):
  python data_ai/pipeline/load_app_properties_sales.py --dry-run
  python data_ai/pipeline/load_app_properties_sales.py
"""

from __future__ import annotations

import argparse
import sys
import uuid
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from db import connect  # noqa: E402

# Properties whose (address, suburb, state) is not in silver did not come from the scrape.
NOT_IN_SILVER = """
    NOT EXISTS (
        SELECT 1 FROM silver.listings_clean s
        WHERE lower(s.address_line) = lower(p.address_line) AND s.suburb = p.suburb AND s.state = p.state
    )
"""


def run(dry_run: bool) -> None:
    with connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM silver.listings_clean")
        silver_rows = cur.fetchone()[0]
        if silver_rows == 0:
            raise SystemExit("silver.listings_clean is empty; run transform_silver_listings.py first.")

        cur.execute("SELECT count(*) FROM properties")
        props_now = cur.fetchone()[0]
        cur.execute("SELECT count(*) FROM comparable_sales")
        sales_now = cur.fetchone()[0]
        cur.execute(f"SELECT count(*) FROM properties p WHERE {NOT_IN_SILVER}")
        seed_count = cur.fetchone()[0]
        cur.execute(
            """SELECT count(*) FROM (
                   SELECT 1 FROM properties p JOIN comparable_sales cs USING (property_id)
                   GROUP BY lower(p.address_line), p.suburb, p.state, cs.sold_date, cs.sold_price
                   HAVING count(*) > 1) d"""
        )
        duplicate_groups = cur.fetchone()[0]
        cur.execute(
            """SELECT coalesce(sum(n - 1), 0) FROM (
                   SELECT count(*) AS n FROM properties p JOIN comparable_sales cs USING (property_id)
                   GROUP BY lower(p.address_line), p.suburb, p.state, cs.sold_date, cs.sold_price
                   HAVING count(*) > 1) d"""
        )
        extra_copies = cur.fetchone()[0]

        expected = silver_rows + seed_count
        print(f"silver.listings_clean:               {silver_rows}")
        print(f"app properties / comparable_sales:   {props_now} / {sales_now}")
        print(f"  duplicate sale groups in the app:  {duplicate_groups} ({extra_copies} extra copies)")
        print(f"  rows not from the scrape (kept):   {seed_count}")
        print(f"after the load, each table will have {expected} rows (silver {silver_rows} + {seed_count} kept)")

        if dry_run:
            print("\nDry run: nothing written.")
            return

        stamp = datetime.now().strftime("%Y%m%d_%H%M")
        cur.execute(f"CREATE TABLE gold.properties_backup_{stamp} AS SELECT * FROM properties")
        cur.execute(f"CREATE TABLE gold.comparable_sales_backup_{stamp} AS SELECT * FROM comparable_sales")

        # Hold the non-scraped rows aside, with their original ids.
        cur.execute(
            f"""SELECT p.property_id, p.address_line, p.suburb, p.state, p.postcode, p.property_type,
                       p.bedrooms, p.bathrooms, p.parking, p.area_sqm, p.created_at
                FROM properties p WHERE {NOT_IN_SILVER}"""
        )
        kept_props = cur.fetchall()
        cur.execute(
            f"""SELECT cs.comparable_id, cs.property_id, cs.sold_price, cs.sold_date, cs.created_at
                FROM comparable_sales cs JOIN properties p USING (property_id) WHERE {NOT_IN_SILVER}"""
        )
        kept_sales = cur.fetchall()

        cur.execute(
            """SELECT address_line, suburb, state, postcode, property_type, bedrooms, bathrooms, parking,
                      area_sqm, sold_price, sold_date
               FROM silver.listings_clean ORDER BY sold_date, listing_key"""
        )
        silver = cur.fetchall()

        cur.execute("TRUNCATE comparable_sales, properties")

        with cur.copy(
            "COPY properties (property_id, address_line, suburb, state, postcode, property_type, "
            "bedrooms, bathrooms, parking, area_sqm) FROM STDIN"
        ) as props_copy:
            sale_rows = []
            for address, suburb, state, postcode, ptype, beds, baths, parking, area, price, sold in silver:
                property_id = str(uuid.uuid4())
                props_copy.write_row((property_id, address, suburb, state, postcode, ptype, beds, baths, parking, area))
                sale_rows.append((str(uuid.uuid4()), property_id, float(price), datetime(sold.year, sold.month, sold.day)))
        with cur.copy("COPY comparable_sales (comparable_id, property_id, sold_price, sold_date) FROM STDIN") as sales_copy:
            for row in sale_rows:
                sales_copy.write_row(row)

        for row in kept_props:
            cur.execute(
                """INSERT INTO properties (property_id, address_line, suburb, state, postcode, property_type,
                       bedrooms, bathrooms, parking, area_sqm, created_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                row,
            )
        for row in kept_sales:
            cur.execute(
                "INSERT INTO comparable_sales (comparable_id, property_id, sold_price, sold_date, created_at) "
                "VALUES (%s, %s, %s, %s, %s)",
                row,
            )

        cur.execute("SELECT count(*) FROM properties")
        props_after = cur.fetchone()[0]
        cur.execute("SELECT count(*) FROM comparable_sales")
        sales_after = cur.fetchone()[0]
        if props_after != expected or sales_after != expected:
            conn.rollback()
            raise SystemExit(f"Count mismatch (properties {props_after}, sales {sales_after}, expected {expected}); rolled back.")
        conn.commit()

    print(f"\nWritten: properties {props_after}, comparable_sales {sales_after}. "
          f"Backups: gold.properties_backup_{stamp}, gold.comparable_sales_backup_{stamp}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true")
    run(parser.parse_args().dry_run)


if __name__ == "__main__":
    main()
