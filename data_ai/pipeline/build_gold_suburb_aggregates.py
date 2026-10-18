"""Gold build: silver.listings_clean -> gold.suburb_aggregates.

Per-suburb market statistics over the trailing 12 months: median price, a
12-month price-index trend, month-on-month growth, and the House/Unit median
split. A port of backend/scripts/build-suburb-market-intelligence.ts, so the
numbers can be compared with what the app serves today.

Gold is fully derived from silver, so each run replaces the table contents in
one transaction (nothing else writes to it).

Usage (from the repo root):
  python data_ai/pipeline/build_gold_suburb_aggregates.py --dry-run   # compute + compare, write nothing
  python data_ai/pipeline/build_gold_suburb_aggregates.py             # rebuild gold.suburb_aggregates
"""

from __future__ import annotations

import argparse
import json
import math
import statistics
import sys
from collections import defaultdict
from dataclasses import dataclass
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from db import connect  # noqa: E402

MIN_SALES_IN_WINDOW = 8
WINDOW_MONTHS = 12
MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
HOUSE_TYPES = {"House", "Townhouse", "Villa"}
UNIT_TYPES = {"Apartment", "Unit"}


@dataclass(frozen=True)
class SuburbAggregate:
    suburb: str
    state: str
    median_price: float
    median_house_price: float | None
    median_unit_price: float | None
    median_price_growth_pct: float
    monthly_growth_pct: float
    monthly_growth_trend_pp: float
    sales_in_window: int
    price_trend: list[dict]
    as_of_month: date


def js_round(value: float) -> int:
    """JavaScript Math.round (halves round up); Python's round() rounds halves to even."""
    return math.floor(value + 0.5)


def month_start(year: int, month_index: int) -> date:
    """First day of a month; month_index may overflow/underflow the year, like JS Date.UTC."""
    year += month_index // 12
    return date(year, month_index % 12 + 1, 1)


def aggregate_suburb(suburb: str, state: str, sales: list[tuple[date, float, str]], window_start: date,
                     reference: date) -> SuburbAggregate | None:
    in_window = [s for s in sales if s[0] >= window_start]
    if len(in_window) < MIN_SALES_IN_WINDOW:
        return None

    by_month: dict[tuple[int, int], list[float]] = defaultdict(list)
    for sold_date, price, _ in in_window:
        by_month[(sold_date.year, sold_date.month)].append(price)

    # 12 calendar months, forward-filled from the nearest earlier month (the first
    # month back-filled from the nearest later one): "price held at last known level".
    months: list[tuple[str, float | None]] = []
    for i in range(WINDOW_MONTHS):
        d = month_start(window_start.year, window_start.month - 1 + i)
        prices = by_month.get((d.year, d.month))
        months.append((MONTH_LABELS[d.month - 1], statistics.median(prices) if prices else None))
    medians = [m[1] for m in months]
    for i in range(1, len(medians)):
        if medians[i] is None:
            medians[i] = medians[i - 1]
    for i in range(len(medians) - 2, -1, -1):
        if medians[i] is None:
            medians[i] = medians[i + 1]

    baseline = medians[0]
    trend = [{"month": months[i][0], "priceIndex": js_round(medians[i] / baseline * 100)} for i in range(WINDOW_MONTHS)]

    last, prev, prev_prev = (trend[-1]["priceIndex"], trend[-2]["priceIndex"], trend[-3]["priceIndex"])
    growth = last - 100
    monthly = (last - prev) / prev * 100 if prev > 0 else 0
    previous_monthly = (prev - prev_prev) / prev_prev * 100 if prev_prev > 0 else 0

    houses = [p for _, p, t in in_window if t in HOUSE_TYPES]
    units = [p for _, p, t in in_window if t in UNIT_TYPES]

    return SuburbAggregate(
        suburb=suburb, state=state,
        median_price=statistics.median(p for _, p, _ in in_window),
        median_house_price=statistics.median(houses) if houses else None,
        median_unit_price=statistics.median(units) if units else None,
        median_price_growth_pct=float(growth), monthly_growth_pct=monthly,
        monthly_growth_trend_pp=monthly - previous_monthly,
        sales_in_window=len(in_window), price_trend=trend, as_of_month=reference,
    )


def build(rows: list[tuple[str, str, date, float, str]]) -> tuple[list[SuburbAggregate], int]:
    reference = max(r[2] for r in rows)
    window_start = month_start(reference.year, reference.month - 1 - (WINDOW_MONTHS - 1))

    grouped: dict[tuple[str, str], list[tuple[date, float, str]]] = defaultdict(list)
    for suburb, state, sold_date, price, property_type in rows:
        grouped[(suburb, state)].append((sold_date, price, property_type))

    result, skipped = [], 0
    for (suburb, state), sales in grouped.items():
        agg = aggregate_suburb(suburb, state, sales, window_start, reference)
        if agg is None:
            skipped += 1
        else:
            result.append(agg)
    return result, skipped


def compare_with_app(cur, aggregates: list[SuburbAggregate]) -> None:
    cur.execute("SELECT suburb, state, median_price FROM market_intelligence")
    app = {(s, st): float(m) for s, st, m in cur.fetchall()}
    gold = {(a.suburb, a.state): a.median_price for a in aggregates}

    both = gold.keys() & app.keys()
    differing = [k for k in both if abs(gold[k] - app[k]) > 0.5]
    print(f"\nCompared with the app's market_intelligence ({len(app)} suburbs):")
    print(f"  suburbs in both:          {len(both)}")
    print(f"  identical median price:   {len(both) - len(differing)}")
    print(f"  different median price:   {len(differing)}  (expected: suburbs where duplicate sales skewed the old median)")
    if differing:
        pct = [abs(gold[k] - app[k]) / app[k] * 100 for k in differing]
        print(f"  differing by avg {statistics.mean(pct):.2f}%, max {max(pct):.2f}%")
    print(f"  only in gold:             {len(gold.keys() - app.keys())}")
    print(f"  only in the app:          {len(app.keys() - gold.keys())}")


def run(dry_run: bool) -> None:
    with connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT suburb, state, sold_date, sold_price, property_type FROM silver.listings_clean")
        rows = [(s, st, d, float(p), t) for s, st, d, p, t in cur.fetchall()]
        if not rows:
            raise SystemExit("silver.listings_clean is empty; run transform_silver_listings.py first.")

        aggregates, skipped = build(rows)
        print(f"silver rows: {len(rows)}; suburbs with a trailing-12-month aggregate: {len(aggregates)}; "
              f"skipped (fewer than {MIN_SALES_IN_WINDOW} sales): {skipped}; as of {aggregates[0].as_of_month}")
        compare_with_app(cur, aggregates)

        if dry_run:
            print("\nDry run: nothing written.")
            return

        cur.execute("DELETE FROM gold.suburb_aggregates")
        with cur.copy(
            "COPY gold.suburb_aggregates (suburb, state, median_price, median_house_price, median_unit_price, "
            "median_price_growth_pct, monthly_growth_pct, monthly_growth_trend_pp, sales_in_window, price_trend, "
            "as_of_month) FROM STDIN"
        ) as copy:
            for a in aggregates:
                copy.write_row((a.suburb, a.state, a.median_price, a.median_house_price, a.median_unit_price,
                                a.median_price_growth_pct, a.monthly_growth_pct, a.monthly_growth_trend_pp,
                                a.sales_in_window, json.dumps(a.price_trend), a.as_of_month))
        conn.commit()
    print(f"\nWritten: {len(aggregates)} rows in gold.suburb_aggregates.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true", help="compute and compare with the app; write nothing")
    run(parser.parse_args().dry_run)


if __name__ == "__main__":
    main()
