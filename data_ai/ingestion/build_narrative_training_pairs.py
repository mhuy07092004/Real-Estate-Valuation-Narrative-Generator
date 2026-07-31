from __future__ import annotations

import json
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import psycopg

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from ingestion.config import IngestionConfig, load_config
else:
    from .config import IngestionConfig, load_config


class NarrativeTrainingPairBuilder:
    def __init__(self, config: IngestionConfig | None = None, fixture_path: str | None = None):
        self.config = config or load_config()
        self.fixture_path = fixture_path or str(Path(__file__).resolve().parent.parent / "narrative_training_pairs.jsonl")

    def run(self) -> int:
        fixture_rows = load_fixture_rows(self.fixture_path)
        if not fixture_rows:
            return 0

        with psycopg.connect(self.config.dsn) as conn:
            with conn.cursor() as cur:
                property_ids = self._fetch_property_ids(cur)
                if not property_ids:
                    raise RuntimeError("No gold properties were found to attach narrative pairs to")

                payload_rows = self._build_payload_rows(fixture_rows, property_ids)
                self._insert_rows(cur, payload_rows)
                conn.commit()
                return len(payload_rows)

    def _fetch_property_ids(self, cur: psycopg.Cursor) -> list[str]:
        cur.execute("SELECT property_id FROM gold_property_model_ready ORDER BY property_id")
        return [str(record[0]) for record in cur.fetchall()]

    def _build_payload_rows(self, fixture_rows: list[dict[str, Any]], property_ids: list[str]) -> list[tuple[Any, ...]]:
        if not property_ids:
            return []

        property_id_lookup = set(property_ids)
        rows: list[tuple[Any, ...]] = []
        for index, fixture_row in enumerate(fixture_rows):
            resolved_property_id = fixture_row.get("property_id")
            if isinstance(resolved_property_id, str) and resolved_property_id in property_id_lookup:
                property_id = resolved_property_id
            else:
                property_id = property_ids[index % len(property_ids)]

            rows.append(
                (
                    fixture_row["pair_id"],
                    property_id,
                    fixture_row["narrative_text"],
                    fixture_row["buyer_purpose"],
                    fixture_row["source_type"],
                    fixture_row["consent_confirmed"],
                    fixture_row["added_at"],
                    False,
                )
            )
        return rows

    def _insert_rows(self, cur: psycopg.Cursor, payload_rows: list[tuple[Any, ...]]) -> None:
        if not payload_rows:
            return

        batch_size = 10
        total_rows = len(payload_rows)

        for start in range(0, total_rows, batch_size):
            batch = payload_rows[start : start + batch_size]
            cur.executemany(
                """
                INSERT INTO gold_narrative_training_pairs (
                    pair_id,
                    property_id,
                    narrative_text,
                    buyer_purpose,
                    source_type,
                    consent_confirmed,
                    added_at,
                    is_seed_data
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (pair_id) DO NOTHING
                """,
                batch,
            )

            processed_rows = min(start + len(batch), total_rows)
            print(f"Inserted {processed_rows}/{total_rows} narrative training pairs")


def load_fixture_rows(fixture_path: str | Path) -> list[dict[str, Any]]:
    fixture_file = Path(fixture_path)
    if not fixture_file.exists():
        raise FileNotFoundError(f"Fixture file not found: {fixture_file}")

    rows: list[dict[str, Any]] = []
    with fixture_file.open("r", encoding="utf-8") as handle:
        for line_number, raw_line in enumerate(handle, start=1):
            stripped = raw_line.strip()
            if not stripped:
                continue
            payload = json.loads(stripped)
            if not isinstance(payload, dict):
                raise ValueError(f"Expected a JSON object at line {line_number} in {fixture_file}")

            rows.append(normalize_fixture_row(payload))
    return rows


def normalize_fixture_row(payload: dict[str, Any]) -> dict[str, Any]:
    pair_id = payload.get("pair_id")
    if not pair_id:
        pair_id = str(uuid.uuid4())

    property_id = payload.get("property_id")
    narrative_text = payload.get("narrative_text") or ""
    buyer_purpose = payload.get("buyer_purpose") or "family"
    source_type = payload.get("source_type") or "seed_synthetic"
    consent_confirmed = bool(payload.get("consent_confirmed", False))
    added_at = payload.get("added_at")

    if isinstance(added_at, str):
        try:
            normalized_added_at = datetime.fromisoformat(added_at.replace("Z", "+00:00"))
        except ValueError:
            normalized_added_at = datetime.now(timezone.utc)
    elif isinstance(added_at, datetime):
        normalized_added_at = added_at
    else:
        normalized_added_at = datetime.now(timezone.utc)

    if normalized_added_at.tzinfo is None:
        normalized_added_at = normalized_added_at.replace(tzinfo=timezone.utc)

    return {
        "pair_id": pair_id,
        "property_id": property_id,
        "narrative_text": narrative_text,
        "buyer_purpose": buyer_purpose,
        "source_type": source_type,
        "consent_confirmed": consent_confirmed,
        "added_at": normalized_added_at,
    }


def main() -> None:
    builder = NarrativeTrainingPairBuilder(load_config())
    count = builder.run()
    print(f"Loaded {count} narrative training pairs")


if __name__ == "__main__":
    main()
