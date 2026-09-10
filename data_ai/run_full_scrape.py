"""
Single entry point for scaling the three external-data ingestion scripts
(ingestion/domain_suburb_insights_ingest.py, ingestion/sqm_vacancy_rate_ingest.py,
ingestion/abs_sa2_raw_ingest.py) from the 10-suburb test batch up to every
real suburb already imported into the backend DB.

Does NOT touch Property/ComparableSale import (ingest-bronze-listings.ts) —
that data already exists; this only reads the suburb list from it.

Clears each script's previous output CSV before running, since none of the
three scripts are resume-aware — re-running them without clearing first
silently duplicates every row (a known issue that was fine to ignore for a
10-suburb test, but would be a much bigger mess left unfixed across ~1,491
real suburbs).

Runs the three scripts sequentially, not in parallel, so Domain and SQM
never see two concurrent scraping sessions from this machine at once.

Usage (from data_ai/, with venv active):
    python run_full_scrape.py                 # every real suburb in the DB
    python run_full_scrape.py --limit 50       # a smaller batch than "all"
    python run_full_scrape.py --skip-clear     # append to existing CSVs (NOT recommended — duplicates rows)
"""
from __future__ import annotations

import argparse
import sqlite3
import subprocess
import sys
from pathlib import Path

DATA_AI_DIR = Path(__file__).resolve().parent
INGESTION_DIR = DATA_AI_DIR / "ingestion"
DEV_DB_PATH = DATA_AI_DIR.parent / "backend" / "prisma" / "dev.db"

OUTPUT_FILES_TO_CLEAR = [
    DATA_AI_DIR / "domain_suburb_insights.csv",
    DATA_AI_DIR / "sqm_vacancy_rate_raw.csv",
    DATA_AI_DIR / "abs_population_raw.csv",
    DATA_AI_DIR / "abs_building_approvals_raw.csv",
]


def count_real_suburbs() -> int:
    conn = sqlite3.connect(str(DEV_DB_PATH))
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT COUNT(*) FROM (
                SELECT suburb, state FROM properties
                WHERE postcode IS NOT NULL AND postcode != ''
                GROUP BY suburb, state
            )
            """
        )
        return cur.fetchone()[0]
    finally:
        conn.close()


def clear_previous_outputs() -> None:
    for path in OUTPUT_FILES_TO_CLEAR:
        if path.exists():
            path.unlink()
            print(f"Cleared previous output: {path.name}")


def run_script(script_name: str, limit: int) -> None:
    print(f"\n{'=' * 60}\nRunning {script_name} (limit={limit})\n{'=' * 60}", flush=True)
    result = subprocess.run(
        [sys.executable, str(INGESTION_DIR / script_name), "--limit", str(limit)],
        cwd=str(DATA_AI_DIR),
    )
    if result.returncode != 0:
        print(f"WARNING: {script_name} exited with code {result.returncode} — continuing to the next script anyway.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None, help="Suburb count to scrape (default: every real suburb in the DB)")
    parser.add_argument("--skip-clear", action="store_true", help="Don't clear previous output CSVs first (risks the known duplicate-on-rerun bug)")
    args = parser.parse_args()

    total_suburbs = count_real_suburbs()
    limit = args.limit if args.limit is not None else total_suburbs
    print(f"Real suburbs in DB: {total_suburbs}. Scraping {limit} this run.")

    if not args.skip_clear:
        clear_previous_outputs()
    else:
        print("Skipping output clear — re-running without a fresh file WILL duplicate rows (known issue).")

    run_script("domain_suburb_insights_ingest.py", limit)
    run_script("sqm_vacancy_rate_ingest.py", limit)
    run_script("abs_sa2_raw_ingest.py", limit)

    print(
        "\nAll three ingestion scripts finished. Next step: re-run "
        "backend/scripts/load-external-market-data.ts to load this into Prisma."
    )


if __name__ == "__main__":
    main()
