"""
Feasibility probe for Days-on-Market/Rental-Yield/Vacancy-Rate sourcing.

Loads a Domain.com.au suburb-profile page using the same undetected_chromedriver
setup already proven in ingestion/bronze_listing_ingest.py, and saves the raw
HTML + a screenshot so we can inspect by hand whether the Market Insights
section (median price / days on market / rental yield / vacancy rate) actually
renders, or whether Domain's Kasada anti-bot blocks it here too.

Standalone — no DB writes, no dependency on the rest of ingestion/. This is a
read-only probe against a handful of suburb pages, not a bulk scrape.

Usage (from data_ai/, with venv active):
    python scripts/probe_domain_suburb_page.py
    python scripts/probe_domain_suburb_page.py orange-nsw-2800 richmond-vic-3121
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

import undetected_chromedriver as uc
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "probe_output"
BASE_URL = "https://www.domain.com.au/suburb-profile/{slug}"

# One suburb already in our real imported dataset (regional NSW, from
# bronze_listings.csv) and one from the old seed data, to see if coverage
# differs by suburb size/prominence.
DEFAULT_SLUGS = ["orange-nsw-2800", "richmond-vic-3121"]


def probe(slug: str) -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)
    url = BASE_URL.format(slug=slug)
    print(f"\n=== Probing {url} ===")

    driver = uc.Chrome(version_main=152)
    try:
        driver.get(url)

        # Give any Kasada JS challenge time to resolve before reading the page,
        # same politeness window as the existing sold-listings scraper.
        try:
            WebDriverWait(driver, 15).until(
                lambda d: d.title not in ("", "Just a moment...", "Access Denied")
            )
        except TimeoutException:
            pass
        time.sleep(3)

        html = driver.page_source
        html_path = OUTPUT_DIR / f"{slug}.html"
        html_path.write_text(html, encoding="utf-8")

        screenshot_path = OUTPUT_DIR / f"{slug}.png"
        driver.save_screenshot(str(screenshot_path))

        looks_blocked = "KPSDK" in html and "suburb-profile" not in html.lower()
        mentions_market_insights = any(
            needle in html for needle in ("Market Insights", "Days on Market", "Rental yield", "Vacancy rate")
        ) or "days on market" in html.lower()

        print(f"Title: {driver.title!r}")
        print(f"Saved HTML: {html_path} ({len(html):,} bytes)")
        print(f"Saved screenshot: {screenshot_path}")
        print(f"Looks like an anti-bot challenge page: {looks_blocked}")
        print(f"Contains Market Insights / Days on Market / Rental yield / Vacancy rate text: {mentions_market_insights}")
    finally:
        try:
            driver.quit()
        except Exception:
            pass


def main() -> None:
    slugs = sys.argv[1:] or DEFAULT_SLUGS
    for slug in slugs:
        probe(slug)
        time.sleep(2)  # be polite between suburb pages


if __name__ == "__main__":
    main()
