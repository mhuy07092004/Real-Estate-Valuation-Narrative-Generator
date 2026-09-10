"""
Production ingestion: Days on Market, Rental Yield (computed), and Auction
Clearance Rate, per suburb — sourced from Domain.com.au's suburb-profile
page, which embeds a real server-rendered GraphQL data blob (`LocationProfile`)
directly in the page HTML. See probe_domain_suburb_page.py (data_ai/scripts/)
for the feasibility check this is built on top of, and the "External
data-sourcing tasks" section of .agents/rules/backend-rebuild-plan.md for the
full writeup.

Suburb list: read directly from the real, already-imported Property table in
the Node backend's SQLite DB (backend/prisma/dev.db) rather than re-deriving
postcodes from the raw bronze CSV — that DB already has the correct
suburb+state+postcode combos (postcode filled in during the original CSV
import via a live external lookup), so this reuses that work instead of
duplicating it.

Output: a flat CSV, one row per (suburb, property category, bedroom count) —
the same granularity Domain's own data comes in. Aggregating this down to a
single per-suburb number is a separate step (mirrors how
build-suburb-market-intelligence.ts is a separate step from
ingest-bronze-listings.ts) — not done here.

Driver reuse: per explicit instruction, the Chrome instance is NOT
relaunched for every suburb (expensive) — one instance handles a batch of
RESET_EVERY_N_SUBURBS suburbs, then gets quit and relaunched to avoid
session staleness, same idea as the land-size-bucket loop in
bronze_listing_ingest.py restarting the driver per bucket.

Usage (from data_ai/, with venv active):
    python ingestion/domain_suburb_insights_ingest.py
    python ingestion/domain_suburb_insights_ingest.py --limit 10
    python ingestion/domain_suburb_insights_ingest.py --limit 50 --reset-every 20
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sqlite3
import time
from pathlib import Path

import undetected_chromedriver as uc
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait

DEV_DB_PATH = Path(__file__).resolve().parent.parent.parent / "backend" / "prisma" / "dev.db"
OUTPUT_CSV_PATH = Path(__file__).resolve().parent.parent / "domain_suburb_insights.csv"

DEFAULT_LIMIT = 10
DEFAULT_RESET_EVERY_N_SUBURBS = 20
CHROME_VERSION_MAIN = 152  # matches the Chrome installed on this dev machine; bump if it updates

CSV_FIELDS = [
    "suburb",
    "state",
    "postcode",
    "domain_slug",
    "property_category",
    "bedrooms",
    "median_sold_price",
    "days_on_market",
    "auction_clearance_rate",
    "number_sold",
    "median_rent_price",
    "rental_yield_pct",
    "entry_level_price",
    "luxury_level_price",
]


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def load_suburbs(limit: int) -> list[dict]:
    """Real suburb+state+postcode combos already imported into the backend DB,
    ordered by sale volume so the highest-confidence suburbs get scraped first."""
    conn = sqlite3.connect(str(DEV_DB_PATH))
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT suburb, state, postcode, COUNT(*) AS sale_count
            FROM properties
            WHERE postcode IS NOT NULL AND postcode != ''
            GROUP BY suburb, state
            ORDER BY sale_count DESC
            LIMIT ?
            """,
            (limit,),
        )
        return [
            {"suburb": suburb, "state": state, "postcode": postcode}
            for suburb, state, postcode, _sale_count in cur.fetchall()
        ]
    finally:
        conn.close()


def extract_balanced_json_array(html: str, start_idx: int) -> str | None:
    """Extracts a balanced [...] substring starting at start_idx, respecting
    quoted strings so brackets inside string values don't throw off the count."""
    depth = 0
    in_string = False
    escape_next = False
    for i in range(start_idx, len(html)):
        ch = html[i]
        if escape_next:
            escape_next = False
            continue
        if ch == "\\":
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                return html[start_idx : i + 1]
    return None


def extract_property_categories(html: str) -> list[dict] | None:
    marker = '"propertyCategories":'
    idx = html.find(marker)
    if idx == -1:
        return None
    start = html.find("[", idx)
    if start == -1:
        return None
    raw = extract_balanced_json_array(html, start)
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def build_rows(suburb: dict, categories: list[dict]) -> list[dict]:
    rows = []
    for cat in categories:
        median_sold_price = cat.get("medianSoldPrice")
        median_rent_price = cat.get("medianRentPrice")
        rental_yield_pct = None
        if median_sold_price and median_rent_price:
            rental_yield_pct = round((median_rent_price * 52 / median_sold_price) * 100, 2)

        rows.append(
            {
                "suburb": suburb["suburb"],
                "state": suburb["state"],
                "postcode": suburb["postcode"],
                "domain_slug": suburb["domain_slug"],
                "property_category": cat.get("propertyCategory"),
                "bedrooms": cat.get("bedrooms"),
                "median_sold_price": median_sold_price,
                "days_on_market": cat.get("daysOnMarket"),
                "auction_clearance_rate": cat.get("auctionClearanceRate"),
                "number_sold": cat.get("numberSold"),
                "median_rent_price": median_rent_price,
                "rental_yield_pct": rental_yield_pct,
                "entry_level_price": cat.get("entryLevelPrice"),
                "luxury_level_price": cat.get("luxuryLevelPrice"),
            }
        )
    return rows


def scrape_suburb(driver, suburb: dict) -> list[dict]:
    url = f"https://www.domain.com.au/suburb-profile/{suburb['domain_slug']}"
    driver.get(url)

    try:
        WebDriverWait(driver, 15).until(
            lambda d: d.title not in ("", "Just a moment...", "Access Denied", "403 Forbidden")
        )
    except TimeoutException:
        pass
    time.sleep(3)

    categories = extract_property_categories(driver.page_source)
    if categories is None:
        print(f"  WARNING: no propertyCategories data found for {suburb['domain_slug']} — skipping, not fabricating a row")
        return []

    return build_rows(suburb, categories)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT, help="How many suburbs to scrape this run")
    parser.add_argument("--reset-every", type=int, default=DEFAULT_RESET_EVERY_N_SUBURBS, help="Relaunch Chrome after this many suburbs")
    args = parser.parse_args()

    suburbs = load_suburbs(args.limit)
    for s in suburbs:
        s["domain_slug"] = f"{slugify(s['suburb'])}-{s['state'].lower()}-{s['postcode']}"

    print(f"Loaded {len(suburbs)} real suburbs from {DEV_DB_PATH} (limit={args.limit})")

    OUTPUT_CSV_PATH.parent.mkdir(exist_ok=True)
    write_header = not OUTPUT_CSV_PATH.exists()

    with open(OUTPUT_CSV_PATH, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        if write_header:
            writer.writeheader()

        driver = None
        rows_written = 0
        suburbs_scraped = 0
        suburbs_failed = 0

        try:
            for i, suburb in enumerate(suburbs):
                if driver is None:
                    print(f"\nLaunching Chrome (suburbs {i + 1}-{min(i + args.reset_every, len(suburbs))})")
                    driver = uc.Chrome(version_main=CHROME_VERSION_MAIN)

                print(f"[{i + 1}/{len(suburbs)}] {suburb['domain_slug']}")
                try:
                    rows = scrape_suburb(driver, suburb)
                except Exception as exc:  # noqa: BLE001 — log and continue, don't let one suburb kill the batch
                    print(f"  ERROR scraping {suburb['domain_slug']}: {exc}")
                    rows = []

                if rows:
                    writer.writerows(rows)
                    f.flush()
                    rows_written += len(rows)
                    suburbs_scraped += 1
                    print(f"  wrote {len(rows)} row(s)")
                else:
                    suburbs_failed += 1

                time.sleep(2)  # be polite between suburb pages

                # Reset the driver every N suburbs rather than every single one.
                if (i + 1) % args.reset_every == 0 and i + 1 < len(suburbs):
                    print("Resetting Chrome instance...")
                    driver.quit()
                    driver = None
        finally:
            if driver is not None:
                try:
                    driver.quit()
                except Exception:
                    pass

    print(
        f"\nDone. Suburbs scraped: {suburbs_scraped}, failed/skipped: {suburbs_failed}, "
        f"rows written: {rows_written} -> {OUTPUT_CSV_PATH}"
    )


if __name__ == "__main__":
    main()
