#!/usr/bin/env python3
import argparse
import os
import random
import uuid
from datetime import date, timedelta

import psycopg
from psycopg import sql

# DEFAULT_DSN = os.getenv(
#     "RELAIVE_AI_DB_DSN",
#     "postgresql://relaive:relaive_dev_password@localhost:5432/relaive_ai",
# )

DEFAULT_DSN = "postgresql://relaive:relaive_dev_password@localhost:5432/relaive_ai"

SUBURBS = [
    {
        "suburb": "Surry Hills",
        "postcode": "2010",
        "state": "NSW",
        "median_price": 1480000,
        "listing_count": 62,
        "avg_days_on_market": 18.4,
        "growth_pct_yoy": 0.071,
    },
    {
        "suburb": "Parramatta",
        "postcode": "2150",
        "state": "NSW",
        "median_price": 920000,
        "listing_count": 78,
        "avg_days_on_market": 24.1,
        "growth_pct_yoy": 0.058,
    },
    {
        "suburb": "Brisbane South",
        "postcode": "4101",
        "state": "QLD",
        "median_price": 860000,
        "listing_count": 54,
        "avg_days_on_market": 21.8,
        "growth_pct_yoy": 0.049,
    },
    {
        "suburb": "Carlton",
        "postcode": "3053",
        "state": "VIC",
        "median_price": 1100000,
        "listing_count": 68,
        "avg_days_on_market": 19.6,
        "growth_pct_yoy": 0.064,
    },
    {
        "suburb": "Perth North",
        "postcode": "6000",
        "state": "WA",
        "median_price": 825000,
        "listing_count": 49,
        "avg_days_on_market": 26.4,
        "growth_pct_yoy": 0.045,
    },
    {
        "suburb": "Adelaide Inner",
        "postcode": "5000",
        "state": "SA",
        "median_price": 790000,
        "listing_count": 43,
        "avg_days_on_market": 27.2,
        "growth_pct_yoy": 0.042,
    },
]

STREET_NAMES = [
    "Bourke Street",
    "Cliveden Avenue",
    "Miller Road",
    "Harbour View Drive",
    "Morgan Lane",
    "Riverstone Crescent",
    "Wattle Street",
    "Lonsdale Parade",
    "Elm Court",
    "Parkside Terrace",
]

PROPERTY_TYPES = ["house", "townhouse", "unit"]

NARRATIVE_TEMPLATES = [
    "This residence presents a compelling opportunity for {buyer_purpose} buyers seeking a well-located home with strong lifestyle appeal and long-term value potential.",
    "The finishes and layout offer a balanced mix of comfort, practicality, and ease of maintenance for {buyer_purpose} purchasers.",
    "Positioned within a tightly held pocket, the property benefits from proximity to key amenities, local schools, and transport links valued by {buyer_purpose} buyers.",
    "A stable market context and recent comparable sales support the appeal of this home for {buyer_purpose} purchasers seeking confidence in their buying decision.",
]

RAG_CHUNKS = [
    "The local market has remained resilient this quarter, with buyer activity supported by stable financing conditions and renewed confidence in inner-city and family-oriented suburbs.",
    "Recent sales evidence suggests that well-located homes with flexible floor plans continue to outperform broader market averages in demand and pricing resilience.",
    "The RBA has held the official cash rate steady, which has helped keep mortgage affordability in focus while encouraging measured buyer competition in core residential precincts.",
    "Suburb-level movement remains positive where stock levels are constrained and buyers continue to prioritise homes with strong amenity access and commuting convenience.",
    "The seed sample commentary indicates that pricing remains supported by durable lifestyle demand and selective purchasing in premium stock segments.",
    "For many buyers, the strongest demand continues to sit around homes that combine contemporary presentation with practical family-oriented design.",
    "Auction clearance rates for comparable stock remain stable, providing a useful benchmark for assessing short-term market momentum in the selected area.",
    "The broader market commentary suggests a preference for homes with landholding, energy efficiency, and adaptable internal layouts.",
    "Price discovery remains methodical, with market participants responding carefully to listing quality and the depth of local buyer competition.",
    "This synthetic commentary is included only for prototype/demo purposes and should not be treated as a live market intelligence feed.",
]

def connect() -> psycopg.Connection:
    return psycopg.connect(DEFAULT_DSN)

def clear_seed_rows(cur: psycopg.Cursor) -> None:
    cur.execute("DELETE FROM rag_document_chunks WHERE is_seed_data = TRUE;")
    cur.execute("DELETE FROM gold_narrative_training_pairs WHERE is_seed_data = TRUE;")
    cur.execute("DELETE FROM gold_suburb_aggregates WHERE is_seed_data = TRUE;")
    cur.execute("DELETE FROM gold_property_model_ready WHERE is_seed_data = TRUE;")

def build_property_rows() -> list[tuple]:
    rng = random.Random(42)
    rows = []

    for i in range(100):
        suburb = SUBURBS[i % len(SUBURBS)]
        property_type = PROPERTY_TYPES[i % len(PROPERTY_TYPES)]

        bedrooms = 2 + (i % 4)
        bathrooms = 1 + (i % 3)
        parking = 1 + (i % 2)
        land_size_sqm = 180 + (i * 7 % 240)
        price = int(suburb["median_price"] * (0.72 + (rng.random() * 0.55)))
        sale_date = date(2024, 1, 1) + timedelta(days=i * 3)

        address_number = 10 + i
        street_name = STREET_NAMES[i % len(STREET_NAMES)]
        address = f"{address_number} {street_name}, {suburb['suburb']} NSW {suburb['postcode']}"

        rows.append(
            (
                str(uuid.uuid4()),
                address,
                suburb["suburb"],
                suburb["postcode"],
                suburb["state"],
                property_type,
                bedrooms,
                bathrooms,
                parking,
                float(land_size_sqm),
                float(price),
                sale_date,
                float(suburb["median_price"] * 0.94),
                float(0.0425 + (i % 5) * 0.0025),
                True,
            )
        )

    return rows

def build_suburb_rows() -> list[tuple]:
    rows = []
    for idx, suburb in enumerate(SUBURBS[:5]):
        rows.append(
            (
                suburb["suburb"],
                date(2024, 1, 1),
                date(2024, 3, 31),
                float(suburb["median_price"]),
                suburb["listing_count"],
                float(suburb["avg_days_on_market"]),
                float(suburb["growth_pct_yoy"]),
                True,
            )
        )
    return rows

def build_pair_rows(property_ids: list[str]) -> list[tuple]:
    rows = []
    buyer_purposes = ["family", "personal", "investment"]

    for i in range(20):
        property_id = property_ids[i % len(property_ids)]
        buyer_purpose = buyer_purposes[i % len(buyer_purposes)]
        narrative = NARRATIVE_TEMPLATES[i % len(NARRATIVE_TEMPLATES)].format(
            buyer_purpose=buyer_purpose
        )

        rows.append(
            (
                str(uuid.uuid4()),
                property_id,
                narrative,
                buyer_purpose,
                "seed_synthetic",
                True,
                True,
            )
        )

    return rows

def build_chunk_rows() -> list[tuple]:
    rows = []
    for i in range(10):
        rows.append(
            (
                str(uuid.uuid4()),
                f"seed_sample_commentary_{i + 1}",
                date(2024, 1, 1) + timedelta(days=i * 14),
                "market_commentary",
                RAG_CHUNKS[i],
                None,
                True,
            )
        )
    return rows

def insert_seed_data(cur: psycopg.Cursor) -> None:
    property_rows = build_property_rows()
    suburb_rows = build_suburb_rows()
    property_ids = [row[0] for row in property_rows]

    cur.executemany(
        """
        INSERT INTO gold_property_model_ready (
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
            sale_date,
            suburb_median_price_index,
            cash_rate_at_sale,
            is_seed_data
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        property_rows,
    )

    cur.executemany(
        """
        INSERT INTO gold_suburb_aggregates (
            suburb,
            period_start,
            period_end,
            median_price,
            listing_count,
            avg_days_on_market,
            growth_pct_yoy,
            is_seed_data
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        suburb_rows,
    )

    pair_rows = build_pair_rows(property_ids)
    cur.executemany(
        """
        INSERT INTO gold_narrative_training_pairs (
            pair_id,
            property_id,
            narrative_text,
            buyer_purpose,
            source_type,
            consent_confirmed,
            is_seed_data
        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        pair_rows,
    )

    chunk_rows = build_chunk_rows()
    cur.executemany(
        """
        INSERT INTO rag_document_chunks (
            chunk_id,
            source_document,
            publish_date,
            topic,
            chunk_text,
            embedding,
            is_seed_data
        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        chunk_rows,
    )

def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the Relaive AI prototype demo tables.")
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Remove all seed rows from the serving tables.",
    )
    args = parser.parse_args()

    with connect() as conn:
        with conn.cursor() as cur:
            if args.clear:
                clear_seed_rows(cur)
                conn.commit()
                print("Seed rows cleared.")
                return

            clear_seed_rows(cur)
            insert_seed_data(cur)
            conn.commit()

    print("Seed data load complete.")
    print("Inserted 100 property rows, 5 suburb rows, 20 narrative pairs, and 10 RAG chunks.")

if __name__ == "__main__":
    main()