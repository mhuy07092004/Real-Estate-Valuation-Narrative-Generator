from __future__ import annotations

import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd
import psycopg

POSTCODE_DATA_URL = "https://raw.githubusercontent.com/Elkfox/Australian-Postcode-Data/master/au_postcodes.csv"

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from ingestion.config import IngestionConfig, load_config
else:
    from .config import IngestionConfig, load_config


class ListingCleaner:
    def __init__(self, config: IngestionConfig | None = None):
        self.config = config or load_config()
        self._postcode_lookup = None

    def run(self) -> int:
        self._postcode_lookup = load_postcode_lookup()
        with psycopg.connect(self.config.dsn) as conn:
            with conn.cursor() as cur:
                rows = self._fetch_bronze_rows(cur)
                total_rows = len(rows)
                cleaned_rows = []
                for index, row in enumerate(rows, start=1):
                    cleaned = self._clean_row(row)
                    if cleaned is not None:
                        cleaned_rows.append(cleaned)

                    if index % 1000 == 0:
                        print(f"processed row {index}/{total_rows}")
                        if cleaned_rows:
                            self._replace_silver_rows(cur, cleaned_rows)
                            cleaned_rows = []

                if cleaned_rows:
                    self._replace_silver_rows(cur, cleaned_rows)

                conn.commit()
                print(f"inserted {len(rows)} cleaned rows into silver_listings_clean")
                return len(rows)

    def _fetch_bronze_rows(self, cur: psycopg.Cursor) -> list[dict[str, Any]]:
        cur.execute(
            """
            SELECT listing_id, source, address, suburb, postcode, state, property_type,
                   bedrooms, bathrooms, parking, land_size_sqm, price, listing_date,
                   listing_description, raw_payload, scraped_at
            FROM bronze_listings
            ORDER BY scraped_at ASC
            """
        )
        rows = []
        for record in cur.fetchall():
            rows.append(
                {
                    "listing_id": record[0],
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
                    "listing_description": record[13],
                    "raw_payload": record[14],
                    "scraped_at": record[15],
                }
            )
        return rows

    def _replace_silver_rows(self, cur: psycopg.Cursor, cleaned_rows: list[dict[str, Any]]) -> None:
        if not cleaned_rows:
            return

        cur.executemany(
            """
            INSERT INTO silver_listings_clean (
                source_listing_id,
                source,
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
                listing_date,
                raw_payload,
                scraped_at,
                cleaned_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            [
                (
                    row["source_listing_id"],
                    row["source"],
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
                    row["listing_date"],
                    json.dumps(row["raw_payload"], default=str) if row.get("raw_payload") is not None else None,
                    row["scraped_at"],
                    row["cleaned_at"],
                )
                for row in cleaned_rows
            ],
        )

    def _clean_row(self, row: dict[str, Any]) -> dict[str, Any] | None:
        address = normalize_address(row.get("address"))
        suburb = normalize_text(row.get("suburb"))
        postcode = normalize_text(row.get("postcode"))
        state = normalize_state(row.get("state"))
        if not postcode and suburb:
            postcode = map_suburb_to_postcode(suburb, self._postcode_lookup)
        property_type = normalize_property_type(row.get("property_type"))
        bedrooms = parse_int(row.get("bedrooms"))
        bathrooms = parse_int(row.get("bathrooms"))
        parking = parse_int(row.get("parking"))
        land_size_sqm = parse_float(row.get("land_size_sqm"))
        price = parse_price(row.get("price"))
        listing_date = parse_listing_date(row.get("listing_date"))

        if not address:
            address = None
        if not suburb:
            suburb = None
        if not postcode:
            postcode = None
        if not state:
            state = None
        if not property_type:
            property_type = None

        return {
            "source_listing_id": row.get("listing_id"),
            "source": normalize_text(row.get("source")),
            "address": address,
            "suburb": suburb,
            "postcode": postcode,
            "state": state,
            "property_type": property_type,
            "bedrooms": bedrooms,
            "bathrooms": bathrooms,
            "parking": parking,
            "land_size_sqm": land_size_sqm,
            "price": price,
            "listing_date": listing_date,
            "raw_payload": row.get("raw_payload") if isinstance(row.get("raw_payload"), (dict, str)) else None,
            "scraped_at": row.get("scraped_at"),
            "cleaned_at": datetime.now(),
        }


def load_postcode_lookup() -> pd.DataFrame | None:
    try:
        return pd.read_csv(POSTCODE_DATA_URL)
    except Exception:
        return None


def map_suburb_to_postcode(suburb: str | None, postcode_lookup: pd.DataFrame | None = None) -> str | None:
    if not suburb:
        return None

    if postcode_lookup is None:
        postcode_lookup = load_postcode_lookup()

    if postcode_lookup is None:
        return None

    suburb_column = None
    for candidate in ["place_name", "suburb", "suburb_name", "locality", "suburb_name_full", "name"]:
        if candidate in postcode_lookup.columns:
            suburb_column = candidate
            break

    if suburb_column is None:
        return None

    postcode_column = None
    for candidate in ["postcode", "post_code", "postal_code", "pc"]:
        if candidate in postcode_lookup.columns:
            postcode_column = candidate
            break

    if postcode_column is None:
        return None

    normalized_suburb = re.sub(r"\s+", " ", suburb.strip()).lower()
    match = postcode_lookup[postcode_lookup[suburb_column].astype(str).str.lower() == normalized_suburb]
    if match.empty:
        return None

    postcode = match.iloc[0].get(postcode_column)
    if pd.isna(postcode):
        return None
    return str(int(postcode)) if isinstance(postcode, float) else str(postcode)


def normalize_address(value: Any) -> str | None:
    text = normalize_text(value)
    if not text:
        return None

    text = re.sub(r"\s+", " ", text.strip())
    text = text.replace(" St ", " Street ").replace(" St,", " Street,")
    text = text.replace(" Rd ", " Road ").replace(" Rd,", " Road,")
    text = text.replace(" Ave ", " Avenue ").replace(" Ave,", " Avenue,")
    text = text.replace(" Cres ", " Crescent ").replace(" Cres,", " Crescent,")
    text = text.replace(" Dr ", " Drive ").replace(" Dr,", " Drive,")
    text = text.replace(" Pde ", " Parade ").replace(" Pde,", " Parade,")
    text = re.sub(r"\s+", " ", text).strip()
    return text.title() if not any(char.isdigit() for char in text) else text


def normalize_property_type(value: Any) -> str | None:
    text = normalize_text(value)
    if not text:
        return None

    lower = text.lower()
    if "townhouse" in lower:
        return "townhouse"
    if "unit" in lower or "apartment" in lower or "flat" in lower:
        return "unit"
    if "house" in lower:
        return "house"
    if "land" in lower:
        return "land"
    return "other"


def normalize_state(value: Any) -> str | None:
    text = normalize_text(value)
    if not text:
        return None
    upper = text.upper()
    return upper if len(upper) == 3 else upper[:3]


def normalize_text(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        text = value.strip()
        return text or None
    return str(value)


def parse_int(value: Any) -> int | None:
    if value is None:
        return None
    if isinstance(value, int):
        return value
    text = normalize_text(value)
    if not text:
        return None
    digits = re.sub(r"[^0-9]", "", text)
    if not digits:
        return None
    return int(digits)


def parse_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, float):
        return value
    text = normalize_text(value)
    if not text:
        return None
    text = text.replace(",", "")
    try:
        return float(text)
    except ValueError:
        return None


def parse_price(value: Any) -> float | None:
    if value is None:
        return None
    text = normalize_text(value)
    if not text:
        return None
    cleaned = re.sub(r"[^0-9.-]", "", text)
    if not cleaned or cleaned in {"-", "."}:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def parse_listing_date(value: Any) -> str | None:
    if value is None:
        return None
    text = normalize_text(value)
    if not text:
        return None

    patterns = [
        "%Y-%m-%d",
        "%d %b %Y",
        "%d %B %Y",
        "%d/%m/%Y",
        "%d-%m-%Y",
    ]
    for pattern in patterns:
        try:
            parsed = datetime.strptime(text, pattern)
            return parsed.date().isoformat()
        except ValueError:
            continue

    match = re.search(r"(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})", text, re.I)
    if match:
        try:
            parsed = datetime.strptime(match.group(0), "%d %b %Y")
            return parsed.date().isoformat()
        except ValueError:
            return None

    return None


def main() -> None:
    cleaner = ListingCleaner(load_config())
    count = cleaner.run()
    print(f"Cleaned {count} listings into silver_listings_clean")


if __name__ == "__main__":
    main()
    # import pandas as pd 
    # url='https://raw.githubusercontent.com/Elkfox/Australian-Postcode-Data/master/au_postcodes.csv'; 
    # df=pd.read_csv(url)
    # print(df.columns.tolist())
    # print(df.head(3).to_string())
