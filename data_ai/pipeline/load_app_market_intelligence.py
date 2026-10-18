"""Serving load: gold.suburb_aggregates -> the app's market_intelligence table.

Updates only the listing-derived columns (median price, growth, trend, house/unit
split, as-of date) of rows that already exist, matched on (suburb, state). It never
touches the externally sourced columns (days on market, rental yield, clearance
rate, vacancy rate, population growth, supply constraint), and a gold suburb the
app doesn't have yet is inserted with those left NULL.

Before writing, the current table is copied to gold.market_intelligence_backup_<date>
in the same transaction, so the change can be undone.

Suburbs that were in the app but no longer qualify (fewer than 8 sales in the
trailing 12 months once duplicate sales are removed) are KEPT by default, with
their old, stale numbers. Pass --prune-stale to delete them. Suburbs that never
came from the sales data (e.g. the seeded Richmond VIC demo row) are never touched.

Usage (from the repo root):
  python data_ai/pipeline/load_app_market_intelligence.py --dry-run
  python data_ai/pipeline/load_app_market_intelligence.py
  python data_ai/pipeline/load_app_market_intelligence.py --prune-stale
"""

from __future__ import annotations

import argparse
import json
import sys
import uuid
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from db import connect  # noqa: E402

UPDATE_COLUMNS = (
    "median_price", "median_price_growth_pct", "monthly_growth_pct", "monthly_growth_trend_pp",
    "median_house_price", "median_unit_price", "price_trend_json", "as_of_month",
)


def run(dry_run: bool, prune_stale: bool) -> None:
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """SELECT suburb, state, median_price, median_price_growth_pct, monthly_growth_pct,
                      monthly_growth_trend_pp, median_house_price, median_unit_price, price_trend, as_of_month
               FROM gold.suburb_aggregates"""
        )
        gold = {
            (r[0], r[1]): (
                float(r[2]), r[3], r[4], r[5],
                None if r[6] is None else float(r[6]), None if r[7] is None else float(r[7]),
                json.dumps(r[8], separators=(",", ":")),  # compact, like the app's JSON.stringify
                r[9],
            )
            for r in cur.fetchall()
        }
        if not gold:
            raise SystemExit("gold.suburb_aggregates is empty; run build_gold_suburb_aggregates.py first.")

        cur.execute("SELECT suburb, state, median_price, days_on_market FROM market_intelligence")
        app = {(s, st): (float(m), d) for s, st, m, d in cur.fetchall()}
        cur.execute("SELECT DISTINCT suburb, state FROM silver.listings_clean")
        from_sales = {(s, st) for s, st in cur.fetchall()}

        to_update = gold.keys() & app.keys()
        to_insert = gold.keys() - app.keys()
        stale = (app.keys() - gold.keys()) & from_sales          # real sales data, but below the 8-sale minimum now
        untouched = app.keys() - gold.keys() - stale             # never came from the sales data (seed rows)
        changed = [k for k in to_update if abs(gold[k][0] - app[k][0]) > 0.5]
        stale_with_external = [k for k in stale if app[k][1] is not None]

        print(f"gold suburbs:                       {len(gold)}")
        print(f"app rows to update:                 {len(to_update)}  ({len(changed)} with a different median price)")
        print(f"app rows to insert:                 {len(to_insert)}")
        print(f"stale (no longer qualify):          {len(stale)}  -> {'DELETED' if prune_stale else 'kept as is'}")
        print(f"  of which have external data:      {len(stale_with_external)} (days on market etc. would be lost if deleted)")
        print(f"not from sales data, left alone:    {sorted(untouched)}")
        if stale:
            print("stale suburbs: " + ", ".join(f"{s} {st}" for s, st in sorted(stale)))

        if dry_run:
            print("\nDry run: nothing written.")
            return

        backup = f"gold.market_intelligence_backup_{date.today():%Y%m%d}"
        cur.execute(f"CREATE TABLE {backup} AS SELECT * FROM market_intelligence")

        set_clause = ", ".join(f"{c} = %s" for c in UPDATE_COLUMNS)
        for key in to_update:
            cur.execute(
                f"UPDATE market_intelligence SET {set_clause} WHERE suburb = %s AND state = %s",
                (*gold[key], *key),
            )
        for key in to_insert:
            cur.execute(
                """INSERT INTO market_intelligence
                       (market_id, suburb, state, median_price, median_price_growth_pct, monthly_growth_pct,
                        monthly_growth_trend_pp, median_house_price, median_unit_price, price_trend_json, as_of_month)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (str(uuid.uuid4()), key[0], key[1], *gold[key]),
            )
        if prune_stale:
            for key in stale:
                cur.execute("DELETE FROM market_intelligence WHERE suburb = %s AND state = %s", key)
        conn.commit()

    print(f"\nWritten: {len(to_update)} updated, {len(to_insert)} inserted, "
          f"{len(stale) if prune_stale else 0} deleted. Backup: {backup}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--prune-stale", action="store_true", help="delete suburbs that no longer have 8+ sales")
    args = parser.parse_args()
    run(args.dry_run, args.prune_stale)


if __name__ == "__main__":
    main()
