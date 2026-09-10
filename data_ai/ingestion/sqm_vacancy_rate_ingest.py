"""
Production ingestion: Vacancy Rate, per postcode — sourced from SQM
Research's free "/property/vacancy-rates" page, which embeds a full
monthly vacancy-rate time series (back to January 2005) directly in plain
page JavaScript. See probe_sqm_vacancy_page.py (data_ai/scripts/) for the
feasibility check this is built on top of — that probe also ruled out
SQM's paid "Postcode Snapshot" report (postcodesnapshot.php), which is a
real paywall, not the source used here.

Raw-first, same as abs_sa2_raw_ingest.py: every monthly data point SQM
returns is written out as-is (listings, properties, vr), no aggregation or
transformation (e.g. picking "the" current rate, or converting vr to a
percentage) — that's deferred to a later step.

Driver reuse: same pattern as domain_suburb_insights_ingest.py — one Chrome
instance handles a batch of RESET_EVERY_N_SUBURBS suburbs before being
relaunched, not recreated per suburb.

Output: data_ai/sqm_vacancy_rate_raw.csv, one row per (suburb, year, month).

Usage (from data_ai/, with venv active):
    python ingestion/sqm_vacancy_rate_ingest.py
    python ingestion/sqm_vacancy_rate_ingest.py --limit 10
    python ingestion/sqm_vacancy_rate_ingest.py --limit 50 --reset-every 20
"""
from __future__ import annotations

import argparse
import csv
import json
import time
from pathlib import Path

import undetected_chromedriver as uc
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait

from suburb_source import load_suburbs

DEFAULT_LIMIT = 10
DEFAULT_RESET_EVERY_N_SUBURBS = 20
CHROME_VERSION_MAIN = 152  # matches the Chrome installed on this dev machine; bump if it updates

OUTPUT_CSV_PATH = Path(__file__).resolve().parent.parent / "sqm_vacancy_rate_raw.csv"

CSV_FIELDS = ["suburb", "state", "postcode", "year", "month", "listings", "properties", "vr"]


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


def extract_vacancy_series(html: str) -> list[dict] | None:
    marker = "var data = "
    idx = html.find(marker)
    if idx == -1:
        return None
    start = idx + len(marker)
    raw = extract_balanced_json_array(html, start)
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def build_rows(suburb: dict, series: list[dict]) -> list[dict]:
    rows = []
    for point in series:
        rows.append(
            {
                "suburb": suburb["suburb"],
                "state": suburb["state"],
                "postcode": suburb["postcode"],
                "year": point.get("year"),
                "month": point.get("month"),
                "listings": point.get("listings"),
                "properties": point.get("properties"),
                "vr": point.get("vr"),
            }
        )
    return rows


def scrape_suburb(driver, suburb: dict) -> list[dict]:
    url = f"https://sqmresearch.com.au/property/vacancy-rates?postcode={suburb['postcode']}"
    driver.get(url)

    try:
        WebDriverWait(driver, 15).until(
            lambda d: d.title not in ("", "Just a moment...", "Access Denied", "403 Forbidden")
        )
    except TimeoutException:
        pass
    time.sleep(3)

    series = extract_vacancy_series(driver.page_source)
    if series is None:
        print(f"  WARNING: no vacancy-rate time series found for postcode {suburb['postcode']} — skipping, not fabricating a row")
        return []

    return build_rows(suburb, series)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT, help="How many suburbs to scrape this run")
    parser.add_argument("--reset-every", type=int, default=DEFAULT_RESET_EVERY_N_SUBURBS, help="Relaunch Chrome after this many suburbs")
    args = parser.parse_args()

    suburbs = load_suburbs(args.limit)
    print(f"Loaded {len(suburbs)} real suburbs (limit={args.limit})")

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

                print(f"[{i + 1}/{len(suburbs)}] {suburb['suburb']} {suburb['state']} ({suburb['postcode']})")
                try:
                    rows = scrape_suburb(driver, suburb)
                except Exception as exc:  # noqa: BLE001 — log and continue, don't let one suburb kill the batch
                    print(f"  ERROR scraping postcode {suburb['postcode']}: {exc}")
                    rows = []

                if rows:
                    writer.writerows(rows)
                    f.flush()
                    rows_written += len(rows)
                    suburbs_scraped += 1
                    print(f"  wrote {len(rows)} row(s) ({rows[0]['year']}-{rows[0]['month']:02d} to {rows[-1]['year']}-{rows[-1]['month']:02d})")
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
    print("\nNOTE: this is the full raw monthly time series per postcode, back to Jan 2005 — no aggregation applied, per instruction.")


if __name__ == "__main__":
    main()
