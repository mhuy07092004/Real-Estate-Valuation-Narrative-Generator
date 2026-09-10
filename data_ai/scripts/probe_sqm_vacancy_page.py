"""
Feasibility probe for Vacancy Rate sourcing (the last unresolved item of the
7 flagged data gaps).

SQM Research's postcode-snapshot tool was reported (by a third-party review,
not SQM directly) as a genuinely free, no-login vacancy-rate lookup by
postcode. First probe run of this script (2026-09-10) proved that claim
wrong: postcodesnapshot.php loaded fine (not bot-blocked, undetected_
chromedriver got straight through) but is a real, genuine paywall — $49.95
single report / $99.95-per-month subscription, no free vacancy number shown
at all. However, that same page's "Free Property Data" sidebar links to
/property/vacancy-rates as a separate, apparently-free tool — this script
now probes that page instead.

Standalone — no DB writes, not production ingestion code, same shape as
probe_domain_suburb_page.py.

Usage (from data_ai/, with venv active):
    python scripts/probe_sqm_vacancy_page.py
    python scripts/probe_sqm_vacancy_page.py 2800 3121
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

import undetected_chromedriver as uc
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "probe_output"
# /property/vacancy-rates is SQM's separate "Free Property Data" sidebar link,
# not the paid postcodesnapshot.php report (confirmed paywalled, see module
# docstring). Query param name is a guess pending this probe's own result.
BASE_URL = "https://sqmresearch.com.au/property/vacancy-rates?postcode={postcode}"

# 2800 = Orange NSW (already in our real dataset), 3121 = Richmond VIC (seed suburb).
DEFAULT_POSTCODES = ["2800", "3121"]


def probe(postcode: str) -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)
    url = BASE_URL.format(postcode=postcode)
    print(f"\n=== Probing {url} ===")

    driver = uc.Chrome(version_main=152)
    try:
        driver.get(url)

        try:
            WebDriverWait(driver, 15).until(
                lambda d: d.title not in ("", "Just a moment...", "Access Denied", "403 Forbidden")
            )
        except TimeoutException:
            pass
        time.sleep(3)

        html = driver.page_source
        html_path = OUTPUT_DIR / f"sqm_vacancy_rates_page_{postcode}.html"
        html_path.write_text(html, encoding="utf-8")

        screenshot_path = OUTPUT_DIR / f"sqm_vacancy_rates_page_{postcode}.png"
        driver.save_screenshot(str(screenshot_path))

        looks_blocked = any(
            needle in html for needle in ("403 Forbidden", "Access Denied", "AkamaiGHost")
        ) or "vacancy" not in html.lower()
        mentions_vacancy = "vacancy" in html.lower()

        print(f"Title: {driver.title!r}")
        print(f"Saved HTML: {html_path} ({len(html):,} bytes)")
        print(f"Saved screenshot: {screenshot_path}")
        print(f"Looks blocked/forbidden: {looks_blocked}")
        print(f"Contains 'vacancy' text: {mentions_vacancy}")
    finally:
        try:
            driver.quit()
        except Exception:
            pass


def main() -> None:
    postcodes = sys.argv[1:] or DEFAULT_POSTCODES
    for postcode in postcodes:
        probe(postcode)
        time.sleep(2)


if __name__ == "__main__":
    main()
