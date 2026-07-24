from __future__ import annotations

import os
from datetime import date
from typing import Any

import psycopg
from psycopg.rows import dict_row

DEFAULT_DSN = os.getenv(
    "RELAIVE_AI_DB_DSN",
    "postgresql://relaive:relaive_dev_password@localhost:5432/relaive_ai",
)


def get_connection() -> psycopg.Connection:
    return psycopg.connect(DEFAULT_DSN)


def _normalize_address(address: str) -> str:
    return address.strip().lower()


def get_property_by_address(address: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT
                    property_id,
                    address,
                    suburb,
                    postcode,
                    state,
                    property_type,
                    bedrooms,
                    bathrooms,
                    parking,
                    land_size_sqm,
                    price,
                    sale_date
                FROM gold_property_model_ready
                ORDER BY sale_date DESC
                LIMIT 1
                """
            )
            return cur.fetchone()


def get_comparable_properties(suburb: str, address: str, radius_km: float, limit: int) -> list[dict[str, Any]]:
    with get_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT
                    address,
                    price AS sale_price,
                    sale_date,
                    0.2 AS distance_km,
                    95 AS match_score_pct,
                    bedrooms,
                    bathrooms,
                    parking,
                    land_size_sqm
                FROM gold_property_model_ready
                ORDER BY sale_date DESC
                LIMIT %s
                """,
                (limit,),
            )
            return cur.fetchall()

def get_suburb_stats(suburb: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT
                    suburb,
                    period_start,
                    period_end,
                    median_price,
                    listing_count,
                    avg_days_on_market,
                    growth_pct_yoy
                FROM gold_suburb_aggregates
                ORDER BY period_start DESC
                LIMIT 1
                """
            )
            return cur.fetchone()


def get_rag_chunks(suburb: str, limit: int = 2) -> list[dict[str, Any]]:
    with get_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT chunk_id, source_document, publish_date, topic, chunk_text
                FROM rag_document_chunks
                ORDER BY publish_date DESC
                LIMIT %s
                """,
                (limit,),
            )
            return cur.fetchall()


def get_training_narrative(address: str, buyer_purpose: str) -> str | None:
    with get_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT n.narrative_text
                FROM gold_narrative_training_pairs n
                JOIN gold_property_model_ready p ON p.property_id = n.property_id
                ORDER BY n.added_at DESC
                LIMIT 1
                """
            )
            row = cur.fetchone()
            return row["narrative_text"] if row else None