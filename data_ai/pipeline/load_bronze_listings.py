"""Bronze loader: data_ai/bronze_listings.csv -> bronze.listings.

Bronze is raw and append-only. Every CSV column lands as text exactly as
scraped (empty fields become NULL); nothing is cleaned, typed or filtered here.
Lines that cannot be parsed into the expected columns go to
bronze.listings_errors instead of being dropped silently.

Safe to re-run:
  * the same file (same SHA-256) is never loaded twice;
  * a grown file (scrapers append to the CSV) only inserts rows whose
    (source, listing_id, scraped_at) are not already in bronze.

Usage (from the repo root):
  python data_ai/pipeline/load_bronze_listings.py --dry-run   # parse only, no database
  python data_ai/pipeline/load_bronze_listings.py             # load into bronze
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from db import REPO_ROOT, connect  # noqa: E402

DEFAULT_CSV = REPO_ROOT / "data_ai" / "bronze_listings.csv"

COLUMNS = [
    "listing_id", "source", "address", "suburb", "postcode", "state",
    "property_type", "bedrooms", "bathrooms", "parking", "land_size_sqm",
    "price", "listing_date", "listing_description", "raw_payload", "scraped_at",
]


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_rows(path: Path) -> tuple[list[tuple], list[tuple[int, str, str]]]:
    """Returns (good_rows, errors). Each error is (line_number, raw_text, reason)."""
    good: list[tuple] = []
    errors: list[tuple[int, str, str]] = []

    with path.open("r", newline="", encoding="utf-8") as handle:
        reader = csv.reader(handle)
        header = next(reader, None)
        if header != COLUMNS:
            raise SystemExit(f"Unexpected CSV header.\n  expected: {COLUMNS}\n  found:    {header}")

        for row in reader:
            line = reader.line_num
            if len(row) != len(COLUMNS):
                errors.append((line, ",".join(row), f"expected {len(COLUMNS)} fields, got {len(row)}"))
                continue

            values = [value if value != "" else None for value in row]
            payload = values[COLUMNS.index("raw_payload")]
            if payload is not None:
                try:
                    json.loads(payload)
                except json.JSONDecodeError:
                    errors.append((line, ",".join(row), "raw_payload is not valid JSON"))
                    continue

            good.append(tuple(values))

    return good, errors


def load(path: Path, rows: list[tuple], errors: list[tuple[int, str, str]]) -> None:
    sha = file_sha256(path)
    cols = ", ".join(COLUMNS)

    with connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT batch_id, loaded_at FROM bronze.ingest_batches WHERE file_sha256 = %s", (sha,))
        existing = cur.fetchone()
        if existing:
            print(f"This exact file was already loaded as batch {existing[0]} at {existing[1]}. Nothing to do.")
            return

        source = next((r[COLUMNS.index("source")] for r in rows if r[COLUMNS.index("source")]), "unknown")
        cur.execute(
            "INSERT INTO bronze.ingest_batches (source, file_name, file_sha256) VALUES (%s, %s, %s) RETURNING batch_id",
            (source, path.name, sha),
        )
        batch_id = cur.fetchone()[0]

        # Stage the whole file, then insert only rows bronze doesn't already hold.
        cur.execute(
            f"CREATE TEMP TABLE stage ({', '.join(f'{c} TEXT' for c in COLUMNS[:-2])}, raw_payload TEXT, scraped_at TEXT) ON COMMIT DROP"
        )
        with cur.copy(f"COPY stage ({cols}) FROM STDIN") as copy:
            for row in rows:
                copy.write_row(row)

        cur.execute(
            f"""
            INSERT INTO bronze.listings (batch_id, {cols})
            SELECT %s, {', '.join('s.' + c if c != 'raw_payload' else 's.raw_payload::jsonb' for c in COLUMNS)}
            FROM stage s
            WHERE NOT EXISTS (
                SELECT 1 FROM bronze.listings b
                WHERE b.source     IS NOT DISTINCT FROM s.source
                  AND b.listing_id IS NOT DISTINCT FROM s.listing_id
                  AND b.scraped_at IS NOT DISTINCT FROM s.scraped_at
            )
            """,
            (batch_id,),
        )
        inserted = cur.rowcount

        for line, raw, reason in errors:
            cur.execute(
                "INSERT INTO bronze.listings_errors (batch_id, line_number, raw_line, error) VALUES (%s, %s, %s, %s)",
                (batch_id, line, raw, reason),
            )

        cur.execute(
            "UPDATE bronze.ingest_batches SET row_count = %s, error_count = %s WHERE batch_id = %s",
            (inserted, len(errors), batch_id),
        )
        conn.commit()

    print(f"Loaded batch {batch_id}: {inserted} new rows into bronze.listings "
          f"({len(rows) - inserted} already present), {len(errors)} unparseable lines to bronze.listings_errors.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--dry-run", action="store_true", help="parse and report counts; do not touch the database")
    args = parser.parse_args()

    rows, errors = read_rows(args.csv)
    print(f"{args.csv.name}: {len(rows)} parseable rows, {len(errors)} unparseable lines.")
    for line, _raw, reason in errors[:5]:
        print(f"  line {line}: {reason}")

    if args.dry_run:
        print("Dry run: database not touched.")
        return
    load(args.csv, rows, errors)


if __name__ == "__main__":
    main()
