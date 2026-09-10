"""
Shared suburb list for the new external-data ingestion scripts (Domain
suburb-profile, ABS population/building-approvals, SQM vacancy rate).

Reads directly from the real, already-imported Property table in the Node
backend's SQLite DB rather than re-deriving suburb/postcode combos from the
raw bronze CSV — that DB already has real postcodes filled in (via a live
external lookup during the original CSV import), so this reuses that work.

Kept dependency-free (stdlib only) and separate from
domain_suburb_insights_ingest.py so the plain-REST ABS script doesn't need
to import undetected_chromedriver just to get a suburb list.
"""
from __future__ import annotations

import re
import sqlite3
from pathlib import Path

DEV_DB_PATH = Path(__file__).resolve().parent.parent.parent / "backend" / "prisma" / "dev.db"


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def load_suburbs(limit: int) -> list[dict]:
    """Real suburb+state+postcode combos already imported into the backend DB,
    ordered by sale volume so the highest-confidence suburbs get processed first."""
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
