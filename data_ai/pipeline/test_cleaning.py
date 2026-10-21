# Author: The Long Tran
"""Unit tests for the silver cleaning rules. Run: python -m unittest data_ai/pipeline/test_cleaning.py"""

import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from cleaning import CleanListing, Rejected, clean_listing, normalize_property_type, parse_price, parse_sold_date  # noqa: E402

LOOKUP = {("paddington", "NSW"): "2021"}
GOOD = {
    "address": "56 Selwyn Street", "suburb": "Paddington", "state": "NSW", "property_type": "House",
    "bedrooms": "4", "bathrooms": "2", "parking": "2", "land_size_sqm": "203",
    "price": "$3,450,000", "listing_date": "Sold at auction 24 Jul 2026", "source": "domain_com_au",
}


class CleaningTests(unittest.TestCase):
    def test_good_row_is_cleaned_and_typed(self):
        row = clean_listing(GOOD, LOOKUP)
        self.assertIsInstance(row, CleanListing)
        self.assertEqual((row.postcode, row.bedrooms, row.sold_price, row.sold_date), ("2021", 4, 3450000.0, date(2026, 7, 24)))

    def test_property_type_order_matches_importer(self):
        self.assertEqual(normalize_property_type("Apartment / Unit / Flat"), "Apartment")
        self.assertEqual(normalize_property_type("Townhouse"), "Townhouse")
        self.assertIsNone(normalize_property_type("Vacant land"))
        self.assertIsNone(normalize_property_type("John Smith Real Estate"))

    def test_each_failure_gets_its_reason(self):
        cases = {
            "unrecognised_property_type": {"property_type": "Land"},
            "no_postcode_match": {"suburb": "Nowhere"},
            "missing_bedrooms": {"bedrooms": "-"},
            "missing_parking": {"parking": ""},
            "missing_land_size": {"land_size_sqm": "n/a"},
            "invalid_price": {"price": "Contact agent"},
            "unparseable_sold_date": {"listing_date": "Sold"},
            "missing_address_suburb_state": {"address": ""},
        }
        for reason, change in cases.items():
            result = clean_listing({**GOOD, **change}, LOOKUP)
            self.assertIsInstance(result, Rejected, reason)
            self.assertEqual(result.reason, reason)

    def test_first_failing_rule_wins(self):
        result = clean_listing({**GOOD, "property_type": "Land", "price": ""}, LOOKUP)
        self.assertEqual(result.reason, "unrecognised_property_type")

    def test_dates(self):
        self.assertEqual(parse_sold_date("Sold by private treaty 16 Jul 2026"), date(2026, 7, 16))
        self.assertIsNone(parse_sold_date("Sold 31 Feb 2026"))  # impossible date is rejected, not rolled over

    def test_listing_key_is_stable_and_ignores_case(self):
        a = clean_listing(GOOD, LOOKUP)
        b = clean_listing({**GOOD, "address": "56 SELWYN STREET"}, LOOKUP)
        c = clean_listing({**GOOD, "price": "$3,500,000"}, LOOKUP)
        self.assertEqual(a.listing_key, b.listing_key)
        self.assertNotEqual(a.listing_key, c.listing_key)

    def test_price_quirk_is_preserved(self):
        self.assertEqual(parse_price("$1.2m"), 1.2)  # known quirk, kept for parity with the TS importer


if __name__ == "__main__":
    unittest.main()
