from __future__ import annotations

import json
import time
from datetime import datetime

import pandas as pd
import psycopg
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

from .config import IngestionConfig


class ExtractTool:
    """
    An ExtractTool for scraping sold listing data from Domain.com.au,
    and saving them into the Bronze table.
    """

    BASE_URL = (
        "https://www.domain.com.au/sold-listings/"
        "?ptype=apartment-unit-flat,block-of-units,duplex,free-standing,new-apartments,"
        "new-home-designs,new-house-land,pent-house,semi-detached,studio,terrace,villa"
        "&excludepricewithheld=1&landsize={min_size}-{max_size}&landsizeunit=m2"
        "&state=nsw&page={page}"
    )

    MAX_PAGE = 50
    LAND_SIZE_STEP = 10

    def __init__(self, config: IngestionConfig | None = None):
        self.config = config or IngestionConfig()

    def extract(self):
        headers = [
            "address", "suburb", "property_type", "bedrooms",
            "bathrooms", "parking", "land_size_sqm", "price", "sold_date",
        ]
        records = [headers]

        for step in range(0, 100):  # land size buckets: 200-250, 250-300, ...
            size_min = 200 + step * self.LAND_SIZE_STEP
            size_max = size_min + self.LAND_SIZE_STEP
            print(f"Scraping land size: {size_min}-{size_max} m²")

            driver = uc.Chrome(version_main=150)
            try:
                page = 1
                while page <= self.MAX_PAGE:
                    url = self.BASE_URL.format(min_size=size_min, max_size=size_max, page=page)
                    driver.get(url)

                    try:
                        WebDriverWait(driver, 10).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="results"]'))
                        )
                    except TimeoutException:
                        print(f"No results container on page {page}, stopping this bucket.")
                        break

                    cards = driver.find_elements(By.CSS_SELECTOR, 'li[data-testid^="listing-"]')
                    if not cards:
                        print(f"No more listings on page {page}, moving to next size bucket.")
                        break

                    page_records = [self._parse_card(card) for card in cards]
                    page_records = [r for r in page_records if r is not None]

                    non_null_count = sum(
                        1 for record in page_records
                        if any(value is not None for value in record)
                    )
                    print(f"Page {page}: {non_null_count} propert(y/ies) with at least one non-null value")

                    if page_records:
                        page_df = pd.DataFrame(page_records, columns=headers)
                        self._append_to_database(page_df)
                        records.extend(page_records)

                    page += 1
                    time.sleep(1.5)  # be polite between page requests
            finally:
                try:
                    driver.quit()
                except Exception:
                    pass

        return pd.DataFrame(records[1:], columns=records[0])

    def _parse_card(self, card) -> list | None:
        try:
            address_line1 = card.find_element(
                By.CSS_SELECTOR, '[data-testid="address-line1"]'
            ).text.strip().rstrip(",").strip()
        except NoSuchElementException:
            address_line1 = None

        try:
            suburb = card.find_element(By.CSS_SELECTOR, '[data-testid="address-line2"]').text.strip()
        except NoSuchElementException:
            suburb = None

        try:
            price = card.find_element(By.CSS_SELECTOR, '[data-testid="listing-card-price"]').text.strip()
        except NoSuchElementException:
            price = None

        try:
            sold_date = card.find_element(By.CSS_SELECTOR, '[data-testid="listing-card-tag"] span').text.strip()
        except NoSuchElementException:
            sold_date = None

        try:
            property_type = card.find_element(
                By.XPATH, ".//div[span[contains(text(), 'Apartment') or contains(text(), 'House') "
                          "or contains(text(), 'Townhouse') or contains(text(), 'Unit') or contains(text(), 'Land')]]/span"
            ).text.strip()
        except NoSuchElementException:
            property_type = None

        bedrooms = bathrooms = parking = land_size = None
        features = card.find_elements(By.CSS_SELECTOR, '[data-testid="property-features-feature"]')
        for feature in features:
            text = feature.text.strip()
            if not text:
                continue
            if "Bed" in text:
                bedrooms = text.split()[0]
            elif "Bath" in text:
                bathrooms = text.split()[0]
            elif "Parking" in text:
                parking = text.split()[0]
            elif "m²" in text:
                land_size = text.replace("m²", "").strip()

        if address_line1 is None and price is None:
            # Likely an ad slot or malformed card; skip it
            return None

        return [
            address_line1, suburb, property_type, bedrooms,
            bathrooms, parking, land_size, price, sold_date,
        ]

    def _append_to_database(self, df: pd.DataFrame) -> None:
        if df.empty:
            return

        with psycopg.connect(self.config.dsn) as conn:
            with conn.cursor() as cur:
                for _, row in df.iterrows():
                    clean_row = {}
                    for key, value in row.items():
                        if pd.isna(value):
                            clean_row[key] = None
                        else:
                            clean_row[key] = value

                    cur.execute(
                        """
                        INSERT INTO bronze_listings (
                            source, address, suburb, postcode, state,
                            property_type, bedrooms, bathrooms, parking,
                            land_size_sqm, price, listing_date,
                            listing_description, raw_payload, scraped_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            "domain_com_au",
                            clean_row.get("address"),
                            clean_row.get("suburb"),
                            None,
                            "NSW",
                            clean_row.get("property_type"),
                            clean_row.get("bedrooms"),
                            clean_row.get("bathrooms"),
                            clean_row.get("parking"),
                            clean_row.get("land_size_sqm"),
                            clean_row.get("price"),
                            clean_row.get("sold_date"),
                            None,
                            json.dumps(clean_row, default=str),
                            datetime.now(),
                        ),
                    )