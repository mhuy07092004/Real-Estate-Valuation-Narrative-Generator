from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

import psycopg

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from ingestion.config import IngestionConfig, load_config
else:
    from .config import IngestionConfig, load_config


class ContextRetriever:
    def __init__(self, config: IngestionConfig | None = None):
        self.config = config or load_config()

    def retrieve_context_for_property(self, property_row: dict[str, Any], limit: int = 5) -> dict[str, Any]:
        try:
            with psycopg.connect(self.config.dsn) as conn:
                with conn.cursor() as cur:
                    comparables = self._fetch_comparables(cur, property_row, max(limit * 4, 10))
                    suburb_context = self._fetch_suburb_context(cur, property_row)
                    market_context = self._fetch_market_context(cur, property_row)
        except Exception:
            comparables = []
            suburb_context = None
            market_context = []

        ranked_comparables = self._rank_comparables(property_row, comparables)
        relevant_comparables = [item for item in ranked_comparables if item.get("score", 0.0) >= 3.0][:limit]
        estimated_value = property_row.get("estimated_value")
        if estimated_value is None:
            estimated_value = property_row.get("price")
        return {
            "subject_property": {
                "address": property_row.get("address"),
                "suburb": property_row.get("suburb"),
                "estimated_value": estimated_value,
            },
            "comparables": relevant_comparables,
            "suburb_context": suburb_context,
            "market_context": market_context,
        }

    def _fetch_comparables(self, cur: psycopg.Cursor, property_row: dict[str, Any], limit: int) -> list[dict[str, Any]]:
        suburb = property_row.get("suburb")
        property_type = property_row.get("property_type")
        query = """
            SELECT
                address,
                suburb,
                property_type,
                bedrooms,
                bathrooms,
                parking,
                land_size_sqm,
                price,
                sale_date
            FROM gold_property_model_ready
            WHERE property_id IS NOT NULL
        """
        params: list[Any] = []
        if suburb:
            query += " AND suburb = %s"
            params.append(suburb)
        if property_type:
            query += " AND property_type = %s"
            params.append(property_type)
        query += " ORDER BY sale_date DESC LIMIT %s"
        params.append(limit)
        cur.execute(query, tuple(params))
        rows = []
        for record in cur.fetchall():
            rows.append(
                {
                    "address": record[0],
                    "suburb": record[1],
                    "property_type": record[2],
                    "bedrooms": int(record[3]) if record[3] is not None else None,
                    "bathrooms": int(record[4]) if record[4] is not None else None,
                    "parking": int(record[5]) if record[5] is not None else None,
                    "land_size_sqm": float(record[6]) if record[6] is not None else None,
                    "price": float(record[7]) if record[7] is not None else None,
                    "sale_date": str(record[8]) if record[8] is not None else None,
                }
            )
        return rows

    def _fetch_suburb_context(self, cur: psycopg.Cursor, property_row: dict[str, Any]) -> dict[str, Any] | None:
        suburb = property_row.get("suburb")
        if not suburb:
            return None
        cur.execute(
            """
            SELECT suburb, period_start, period_end, mean_price, listing_count, growth_pct_mom
            FROM gold_suburb_aggregates
            WHERE suburb = %s
            ORDER BY period_end DESC, period_start DESC
            LIMIT 1
            """,
            (suburb,),
        )
        record = cur.fetchone()
        if record is None:
            return None
        return {
            "suburb": record[0],
            "period_start": str(record[1]) if record[1] is not None else None,
            "period_end": str(record[2]) if record[2] is not None else None,
            "mean_price": float(record[3]) if record[3] is not None else None,
            "listing_count": int(record[4]) if record[4] is not None else None,
            "growth_pct_mom": float(record[5]) if record[5] is not None else None,
        }

    def _fetch_market_context(self, cur: psycopg.Cursor, property_row: dict[str, Any]) -> list[dict[str, Any]]:
        suburb = property_row.get("suburb")
        if not suburb:
            return []
        cur.execute(
            """
            SELECT source_document, topic, chunk_text
            FROM rag_document_chunks
            WHERE topic ILIKE %s OR chunk_text ILIKE %s
            ORDER BY publish_date DESC
            LIMIT 3
            """,
            (f"%{suburb}%", f"%{suburb}%"),
        )
        rows = []
        for record in cur.fetchall():
            rows.append(
                {
                    "source_document": record[0],
                    "topic": record[1],
                    "chunk_text": record[2],
                }
            )
        return rows

    def _rank_comparables(self, property_row: dict[str, Any], comparables: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not comparables:
            return []

        def score_row(candidate: dict[str, Any]) -> float:
            total = 0.0
            if candidate.get("suburb") == property_row.get("suburb"):
                total += 5.0
            if candidate.get("property_type") == property_row.get("property_type"):
                total += 3.0
            if candidate.get("bedrooms") is not None and property_row.get("bedrooms") is not None:
                total += max(0.0, 2.0 - abs(int(candidate.get("bedrooms")) - int(property_row.get("bedrooms"))))
            if candidate.get("bathrooms") is not None and property_row.get("bathrooms") is not None:
                total += max(0.0, 1.0 - abs(int(candidate.get("bathrooms")) - int(property_row.get("bathrooms"))))
            if candidate.get("parking") is not None and property_row.get("parking") is not None:
                total += max(0.0, 1.0 - abs(int(candidate.get("parking")) - int(property_row.get("parking"))))
            if candidate.get("land_size_sqm") is not None and property_row.get("land_size_sqm") is not None:
                size_diff = abs(float(candidate.get("land_size_sqm")) - float(property_row.get("land_size_sqm")))
                total += max(0.0, 1.0 - (size_diff / 200.0))
            return total

        ranked = []
        for candidate in comparables:
            ranked.append({**candidate, "score": score_row(candidate)})

        ranked.sort(key=lambda item: item["score"], reverse=True)
        return ranked

    def build_prompt_context(self, context: dict[str, Any]) -> str:
        lines = ["Property context:"]
        subject = context.get("subject_property", {})
        lines.append(f"- Address: {subject.get('address') or 'n/a'}")
        lines.append(f"- Suburb: {subject.get('suburb') or 'n/a'}")
        lines.append(f"- Estimated value: {subject.get('estimated_value') or 'n/a'}")

        comparables = context.get("comparables") or []
        if comparables:
            lines.append("\nComparable sales:")
            for candidate in comparables:
                lines.append(
                    f"- {candidate.get('address') or 'n/a'}: sale_price={candidate.get('sale_price') or candidate.get('price') or 'n/a'}, sale_date={candidate.get('sale_date') or 'n/a'}"
                )
        else:
            lines.append("\nComparable sales: none found")

        suburb_context = context.get("suburb_context")
        if suburb_context:
            lines.append("\nSuburb context:")
            lines.append(f"- Suburb: {suburb_context.get('suburb') or 'n/a'}")
            lines.append(f"- Mean price: {suburb_context.get('mean_price') or 'n/a'}")
            lines.append(f"- Growth: {suburb_context.get('growth_pct_mom') or 'n/a'}")
        else:
            lines.append("\nSuburb context: none found")

        market_context = context.get("market_context") or []
        if market_context:
            lines.append("\nMarket commentary:")
            for item in market_context:
                lines.append(f"- {item.get('topic') or 'market'}: {item.get('chunk_text') or 'n/a'}")
        else:
            lines.append("\nMarket commentary: none found")

        return "\n".join(lines)
