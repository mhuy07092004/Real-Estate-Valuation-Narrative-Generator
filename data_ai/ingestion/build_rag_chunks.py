from __future__ import annotations

import json
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Any

import psycopg

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from ingestion.config import IngestionConfig, load_config
else:
    from .config import IngestionConfig, load_config


class RagChunkBuilder:
    def __init__(self, config: IngestionConfig | None = None, fixture_path: str | None = None):
        self.config = config or load_config()
        self.fixture_path = fixture_path or str(
            Path(__file__).resolve().parent.parent / "docs" / "fixtures" / "rag_documents.jsonl"
        )

    def run(self) -> int:
        fixture_rows = load_fixture_rows(self.fixture_path)
        if not fixture_rows:
            return 0

        with psycopg.connect(self.config.dsn) as conn:
            with conn.cursor() as cur:
                payload_rows = self._build_payload_rows(fixture_rows)
                self._insert_rows(cur, payload_rows)
                conn.commit()
                return len(payload_rows)

    def _build_payload_rows(self, fixture_rows: list[dict[str, Any]]) -> list[tuple[Any, ...]]:
        rows: list[tuple[Any, ...]] = []
        for fixture_row in fixture_rows:
            rows.append(
                (
                    fixture_row["source_document"],
                    fixture_row["publish_date"],
                    fixture_row["topic"],
                    fixture_row["chunk_text"],
                    None,
                    False,
                )
            )
        return rows

    def _insert_rows(self, cur: psycopg.Cursor, payload_rows: list[tuple[Any, ...]]) -> None:
        if not payload_rows:
            return

        for start in range(0, len(payload_rows), 10):
            batch = payload_rows[start : start + 10]
            cur.executemany(
                """
                INSERT INTO rag_document_chunks (
                    source_document,
                    publish_date,
                    topic,
                    chunk_text,
                    embedding,
                    is_seed_data
                ) VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
                """,
                batch,
            )
            print(f"Inserted {min(start + len(batch), len(payload_rows))}/{len(payload_rows)} rag chunks")


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
    publish_date = payload.get("publish_date")
    if isinstance(publish_date, str):
        normalized_publish_date = date.fromisoformat(publish_date)
    elif isinstance(publish_date, datetime):
        normalized_publish_date = publish_date.date()
    else:
        normalized_publish_date = date.today()

    return {
        "source_document": payload.get("source_document") or "fixture_document",
        "publish_date": normalized_publish_date,
        "topic": payload.get("topic") or "market commentary",
        "chunk_text": payload.get("chunk_text") or "",
    }


def main() -> None:
    builder = RagChunkBuilder(load_config())
    count = builder.run()
    print(f"Loaded {count} rag chunks")


if __name__ == "__main__":
    main()
