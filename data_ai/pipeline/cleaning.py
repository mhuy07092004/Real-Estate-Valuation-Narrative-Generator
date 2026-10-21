# Author: The Long Tran
"""Bronze -> silver cleaning rules for sold listings.

Pure functions, no database or network access, so they can be unit-tested and
reused (the price model and narrative export currently re-implement these).

The rules are a port of backend/scripts/ingest-bronze-listings.ts, applied in
the same order, so the silver layer reproduces what the app already imported.
Where the original has a known quirk it is kept on purpose and marked QUIRK,
so the first run can be compared row-for-row; fixing a quirk is a separate,
deliberate change.
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from datetime import date

MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}

SOLD_DATE_PATTERN = re.compile(
    r"(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})", re.IGNORECASE
)

# Reasons written to silver.listings_rejects (must match its CHECK constraint).
REJECTION_REASONS = (
    "unrecognised_property_type", "no_postcode_match", "missing_bedrooms",
    "missing_bathrooms", "missing_parking", "missing_land_size",
    "invalid_price", "unparseable_sold_date", "missing_address_suburb_state",
)


@dataclass(frozen=True)
class CleanListing:
    address_line: str
    suburb: str
    state: str
    postcode: str
    property_type: str
    bedrooms: int
    bathrooms: int
    parking: int
    area_sqm: float
    sold_price: float
    sold_date: date
    source: str

    @property
    def listing_key(self) -> str:
        """Hash of the natural key: the same sale scraped twice gets the same key."""
        natural = "|".join(
            [self.address_line.lower(), self.suburb.lower(), self.state, self.sold_date.isoformat(), f"{self.sold_price:.2f}"]
        )
        return hashlib.sha256(natural.encode("utf-8")).hexdigest()


@dataclass(frozen=True)
class Rejected:
    reason: str
    raw_value: str | None


def normalize_property_type(raw: str | None) -> str | None:
    lower = (raw or "").strip().lower()
    if not lower:
        return None
    if "townhouse" in lower:
        return "Townhouse"
    if "villa" in lower:
        return "Villa"
    if "apartment" in lower:
        return "Apartment"
    if "unit" in lower or "flat" in lower:
        return "Unit"
    if "house" in lower:
        return "House"
    return None  # agent names, "land", anything else: skipped, never defaulted


def parse_int_or_none(raw: str | None) -> int | None:
    # QUIRK (kept from the TypeScript importer): strips every non-digit, so
    # "3.5" becomes 35 and "3-4" becomes 34.
    digits = re.sub(r"[^0-9]", "", raw or "")
    return int(digits) if digits else None


def parse_price(raw: str | None) -> float | None:
    # QUIRK (kept from the TypeScript importer): strips everything but digits
    # and '.', so "$1.2m" becomes 1.2.
    cleaned = re.sub(r"[^0-9.]", "", raw or "")
    if not cleaned:
        return None
    try:
        value = float(cleaned)
    except ValueError:
        return None
    return value if value > 0 else None


def parse_sold_date(raw: str | None) -> date | None:
    match = SOLD_DATE_PATTERN.search(raw or "")
    if not match:
        return None
    try:
        return date(int(match.group(3)), MONTHS[match.group(2).lower()], int(match.group(1)))
    except ValueError:  # e.g. 31 Feb; the JS importer silently rolled these into the next month
        return None


def clean_listing(row: dict[str, str | None], postcode_lookup: dict[tuple[str, str], str]) -> CleanListing | Rejected:
    """Applies the quality rules in order; the first rule a row fails is its rejection reason."""
    suburb = (row.get("suburb") or "").strip()
    state = (row.get("state") or "").strip().upper()
    address = (row.get("address") or "").strip()

    property_type = normalize_property_type(row.get("property_type"))
    if property_type is None:
        return Rejected("unrecognised_property_type", row.get("property_type"))

    postcode = postcode_lookup.get((suburb.lower(), state))
    if postcode is None:
        return Rejected("no_postcode_match", f"{suburb}|{state}")

    bedrooms = parse_int_or_none(row.get("bedrooms"))
    if bedrooms is None:
        return Rejected("missing_bedrooms", row.get("bedrooms"))
    bathrooms = parse_int_or_none(row.get("bathrooms"))
    if bathrooms is None:
        return Rejected("missing_bathrooms", row.get("bathrooms"))
    parking = parse_int_or_none(row.get("parking"))
    if parking is None:
        return Rejected("missing_parking", row.get("parking"))
    area_sqm = parse_int_or_none(row.get("land_size_sqm"))
    if area_sqm is None:
        return Rejected("missing_land_size", row.get("land_size_sqm"))

    sold_price = parse_price(row.get("price"))
    if sold_price is None:
        return Rejected("invalid_price", row.get("price"))
    sold_date = parse_sold_date(row.get("listing_date"))
    if sold_date is None:
        return Rejected("unparseable_sold_date", row.get("listing_date"))

    if not address or not suburb or not state:
        return Rejected("missing_address_suburb_state", None)

    return CleanListing(
        address_line=address, suburb=suburb, state=state, postcode=postcode,
        property_type=property_type, bedrooms=bedrooms, bathrooms=bathrooms,
        parking=parking, area_sqm=float(area_sqm), sold_price=sold_price,
        sold_date=sold_date, source=row.get("source") or "unknown",
    )
