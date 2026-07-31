from __future__ import annotations

import sys
from datetime import date
from pathlib import Path
from typing import Any

import pandas as pd
import psycopg

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from ingestion.config import IngestionConfig, load_config
else:
    from .config import IngestionConfig, load_config


class SuburbAggregateBuilder:
    def __init__(self, config: IngestionConfig | None = None):
        self.config = config or load_config()

    def run(self) -> int:
        with psycopg.connect(self.config.dsn) as conn:
            with conn.cursor() as cur:
                rows = self._fetch_silver_rows(cur)
                aggregates = build_monthly_suburb_aggregates(rows)
                self._replace_rows(cur, aggregates)
                conn.commit()
                return len(aggregates)

    def _fetch_silver_rows(self, cur: psycopg.Cursor) -> list[dict[str, Any]]:
        cur.execute(
            """
            SELECT suburb, price, listing_date
            FROM silver_listings_clean
            WHERE suburb IS NOT NULL
              AND price IS NOT NULL
              AND listing_date IS NOT NULL
            ORDER BY listing_date ASC, suburb ASC
            """
        )
        rows: list[dict[str, Any]] = []
        for record in cur.fetchall():
            rows.append(
                {
                    "suburb": record[0],
                    "price": record[1],
                    "listing_date": record[2],
                }
            )
        return rows

    def _replace_rows(self, cur: psycopg.Cursor, aggregates: list[dict[str, Any]]) -> None:
        if not aggregates:
            return

        cur.execute("DELETE FROM gold_suburb_aggregates")
        cur.executemany(
            """
            INSERT INTO gold_suburb_aggregates (
                suburb,
                period_start,
                period_end,
                mean_price,
                listing_count,
                growth_pct_mom,
                is_seed_data
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            [
                (
                    row["suburb"],
                    row["period_start"],
                    row["period_end"],
                    row["mean_price"],
                    row["listing_count"],
                    row["growth_pct_mom"],
                    row["is_seed_data"],
                )
                for row in aggregates
            ],
        )


def build_monthly_suburb_aggregates(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not rows:
        return []

    frame = pd.DataFrame(rows)
    required_columns = {"suburb", "price", "listing_date"}
    if not required_columns.issubset(frame.columns):
        raise ValueError("Rows must include suburb, price, and listing_date")

    frame = frame.dropna(subset=["suburb", "price", "listing_date"]).copy()
    if frame.empty:
        return []

    frame["suburb"] = frame["suburb"].astype(str).str.strip()
    frame = frame[frame["suburb"] != ""]
    frame["price"] = pd.to_numeric(frame["price"], errors="coerce")
    frame = frame.dropna(subset=["price"])
    if frame.empty:
        return []

    frame["listing_date"] = pd.to_datetime(frame["listing_date"], errors="coerce")
    frame = frame.dropna(subset=["listing_date"])
    if frame.empty:
        return []

    frame["period_start"] = frame["listing_date"].dt.to_period("M").dt.to_timestamp()
    frame["period_end"] = frame["period_start"] + pd.offsets.MonthEnd(0)

    aggregated = (
        frame.groupby(["suburb", "period_start", "period_end"], as_index=False)
        .agg(mean_price=("price", "mean"), listing_count=("price", "size"))
        .sort_values(["suburb", "period_start"])
        .reset_index(drop=True)
    )

    aggregated["growth_pct_mom"] = None
    for suburb in aggregated["suburb"].dropna().unique():
        suburb_rows = aggregated[aggregated["suburb"] == suburb].copy()
        suburb_rows["previous_mean_price"] = suburb_rows["mean_price"].shift(1)
        growth = (
            (suburb_rows["mean_price"] - suburb_rows["previous_mean_price"])
            / suburb_rows["previous_mean_price"]
            * 100
        )
        growth = growth.where(
            suburb_rows["previous_mean_price"].notna() & (suburb_rows["previous_mean_price"] != 0),
            None,
        )
        aggregated.loc[suburb_rows.index, "growth_pct_mom"] = growth

    aggregated["period_start"] = aggregated["period_start"].dt.date
    aggregated["period_end"] = aggregated["period_end"].dt.date
    aggregated["mean_price"] = aggregated["mean_price"].astype(float)
    aggregated["listing_count"] = aggregated["listing_count"].astype(int)
    aggregated["growth_pct_mom"] = aggregated["growth_pct_mom"].astype(float)
    aggregated["is_seed_data"] = False

    return aggregated[[
        "suburb",
        "period_start",
        "period_end",
        "mean_price",
        "listing_count",
        "growth_pct_mom",
        "is_seed_data",
    ]].to_dict(orient="records")


def main() -> None:
    builder = SuburbAggregateBuilder(load_config())
    count = builder.run()
    print(f"Built {count} suburb aggregate rows")


if __name__ == "__main__":
    main()
