from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path
from typing import Any

import psycopg

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from ingestion.config import IngestionConfig, load_config
else:
    from .config import IngestionConfig, load_config


class GoldPropertyBuilder:
    def __init__(self, config: IngestionConfig | None = None):
        self.config = config or load_config()

    def run(self) -> int:
        with psycopg.connect(self.config.dsn) as conn:
            with conn.cursor() as cur:
                macro_row = self._fetch_latest_macro(cur)
                silver_rows = self._fetch_silver_rows(cur)
                gold_rows = []
                for row in silver_rows:
                    gold_rows.append(self._build_gold_row(row, macro_row))

                self._replace_gold_rows(cur, gold_rows)
                conn.commit()
                return len(gold_rows)

    def _fetch_latest_macro(self, cur: psycopg.Cursor) -> dict[str, Any] | None:
        cur.execute(
            """
            SELECT macro_id, value, period_start, period_end, indicator_name
            FROM bronze_macro_indicators
            ORDER BY fetched_at DESC, macro_id DESC
            LIMIT 1
            """
        )
        record = cur.fetchone()
        if record is None:
            return None
        return {
            "macro_id": record[0],
            "value": record[1],
            "period_start": record[2],
            "period_end": record[3],
            "indicator_name": record[4],
        }

    def _fetch_silver_rows(self, cur: psycopg.Cursor) -> list[dict[str, Any]]:
        cur.execute(
            """
            SELECT source_listing_id, source, address, suburb, postcode, state,
                   property_type, bedrooms, bathrooms, parking, land_size_sqm,
                   price, listing_date, scraped_at
            FROM silver_listings_clean
            ORDER BY scraped_at ASC
            """
        )
        rows = []
        for record in cur.fetchall():
            rows.append(
                {
                    "source_listing_id": record[0],
                    "source": record[1],
                    "address": record[2],
                    "suburb": record[3],
                    "postcode": record[4],
                    "state": record[5],
                    "property_type": record[6],
                    "bedrooms": record[7],
                    "bathrooms": record[8],
                    "parking": record[9],
                    "land_size_sqm": record[10],
                    "price": record[11],
                    "listing_date": record[12],
                    "scraped_at": record[13],
                }
            )
        return rows

    def _build_gold_row(self, row: dict[str, Any], macro_row: dict[str, Any] | None) -> dict[str, Any]:
        return {
            "source_listing_id": row["source_listing_id"],
            "address": row["address"] or "Unknown address",
            "suburb": row["suburb"],
            "postcode": row["postcode"] or "",
            "state": row["state"],
            "property_type": row["property_type"] or "other",
            "bedrooms": row["bedrooms"] or 0,
            "bathrooms": row["bathrooms"] or 0,
            "parking": row["parking"] or 0,
            "land_size_sqm": row["land_size_sqm"],
            "price": row["price"],
            "sale_date": row["listing_date"] or datetime.now().date().isoformat(),
            "suburb_median_price_index": None,
            "cash_rate_at_sale": float(macro_row["value"]) if macro_row and macro_row.get("value") is not None else None,
            "is_seed_data": False,
        }

    def _replace_gold_rows(self, cur: psycopg.Cursor, gold_rows: list[dict[str, Any]]) -> None:
        if not gold_rows:
            return

        cur.execute("DELETE FROM gold_narrative_training_pairs")
        cur.execute("DELETE FROM gold_property_model_ready")
        cur.executemany(
            """
            INSERT INTO gold_property_model_ready (
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
                sale_date,
                suburb_median_price_index,
                cash_rate_at_sale,
                is_seed_data
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            [
                (
                    row["address"],
                    row["suburb"],
                    row["postcode"],
                    row["state"],
                    row["property_type"],
                    row["bedrooms"],
                    row["bathrooms"],
                    row["parking"],
                    row["land_size_sqm"],
                    row["price"],
                    row["sale_date"],
                    row["suburb_median_price_index"],
                    row["cash_rate_at_sale"],
                    row["is_seed_data"],
                )
                for row in gold_rows
            ],
        )


def main() -> None:
    builder = GoldPropertyBuilder(load_config())
    count = builder.run()
    print(f"Built {count} rows in gold_property_model_ready")


if __name__ == "__main__":
    main()
