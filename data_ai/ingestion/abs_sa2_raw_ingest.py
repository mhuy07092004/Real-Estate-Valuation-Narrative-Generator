"""
Production ingestion: raw ABS SA2 data for Population Growth and Supply
Constraint (the proxy: dwelling approvals). Plain public REST APIs at
geo.abs.gov.au — no scraping, no anti-bot, no auth. See
probe_abs_sa2_data.py (data_ai/scripts/) for the feasibility check this is
built on top of.

Deliberately does NOT resolve the open suburb->SA2 mapping problem (a
suburb name like "Orange" can match several SA2 regions with different
numbers — see the "External data-sourcing tasks" section of
.agents/rules/backend-rebuild-plan.md). Every SA2 row that matches the
suburb-name search is written out as-is, tagged with the suburb we searched
for, so the mapping decision can be made later as a separate transform step
over this raw data instead of being baked into the scrape.

Output: two flat CSVs —
    data_ai/abs_population_raw.csv         (Estimated Resident Population, per SA2, per year)
    data_ai/abs_building_approvals_raw.csv (dwelling approvals, per SA2, per financial year)
Both in long format (one row per SA2 x year), not pivoted, so downstream
code can reshape however it needs to.

Usage (from data_ai/, with venv active):
    python ingestion/abs_sa2_raw_ingest.py
    python ingestion/abs_sa2_raw_ingest.py --limit 10
"""
from __future__ import annotations

import argparse
import csv
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

from suburb_source import load_suburbs

DEFAULT_LIMIT = 10

ERP_URL = "https://geo.abs.gov.au/arcgis/rest/services/Hosted/ABS_ERP_2001_2023_SA2/FeatureServer/0/query"
ERP_YEAR_FIELDS = {2019: "erp_no_2019", 2020: "erp_no_2020", 2021: "erp_no_2021", 2022: "erp_no_2022", 2023: "erp_no_2023"}

BAPS_URL = "https://geo.abs.gov.au/arcgis/rest/services/Hosted/ABS_BAPS_SA2_1415_2223/FeatureServer/0/query"
# totdwl_dwl_XXXX = total dwelling units approved (all sectors) for that financial year.
BAPS_YEAR_FIELDS = {"2019-20": "totdwl_dwl_1920", "2020-21": "totdwl_dwl_2021", "2021-22": "totdwl_dwl_2122", "2022-23": "totdwl_dwl_2223"}

POPULATION_CSV_PATH = Path(__file__).resolve().parent.parent / "abs_population_raw.csv"
BUILDING_APPROVALS_CSV_PATH = Path(__file__).resolve().parent.parent / "abs_building_approvals_raw.csv"

POPULATION_CSV_FIELDS = ["query_suburb", "query_state", "query_postcode", "sa2_name", "sa2_code", "year", "estimated_resident_population"]
BUILDING_APPROVALS_CSV_FIELDS = ["query_suburb", "query_state", "query_postcode", "sa2_name", "sa2_code", "financial_year", "dwelling_approvals"]


def fetch_json(base_url: str, sa2_name_filter: str, out_fields: str) -> dict:
    where_clause = f"sa2_name_2021 LIKE '%{sa2_name_filter}%'"
    query = urllib.parse.urlencode(
        {
            "where": where_clause,
            "outFields": out_fields,
            "returnGeometry": "false",
            "f": "json",
        }
    )
    url = f"{base_url}?{query}"
    request = urllib.request.Request(url, headers={"User-Agent": "relaive-abs-sa2-ingest/0.1"})
    with urllib.request.urlopen(request, timeout=15) as response:
        return json.loads(response.read())


def fetch_population_rows(suburb: dict) -> list[dict]:
    out_fields = "sa2_name_2021,sa2_code_2021," + ",".join(ERP_YEAR_FIELDS.values())
    data = fetch_json(ERP_URL, suburb["suburb"], out_fields)
    rows = []
    for feature in data.get("features", []):
        attrs = feature["attributes"]
        for year, field_name in ERP_YEAR_FIELDS.items():
            value = attrs.get(field_name)
            if value is None:
                continue
            rows.append(
                {
                    "query_suburb": suburb["suburb"],
                    "query_state": suburb["state"],
                    "query_postcode": suburb["postcode"],
                    "sa2_name": attrs.get("sa2_name_2021"),
                    "sa2_code": attrs.get("sa2_code_2021"),
                    "year": year,
                    "estimated_resident_population": value,
                }
            )
    return rows


def fetch_building_approval_rows(suburb: dict) -> list[dict]:
    out_fields = "sa2_name_2021,sa2_code_2021," + ",".join(BAPS_YEAR_FIELDS.values())
    data = fetch_json(BAPS_URL, suburb["suburb"], out_fields)
    rows = []
    for feature in data.get("features", []):
        attrs = feature["attributes"]
        for financial_year, field_name in BAPS_YEAR_FIELDS.items():
            value = attrs.get(field_name)
            if value is None:
                continue
            rows.append(
                {
                    "query_suburb": suburb["suburb"],
                    "query_state": suburb["state"],
                    "query_postcode": suburb["postcode"],
                    "sa2_name": attrs.get("sa2_name_2021"),
                    "sa2_code": attrs.get("sa2_code_2021"),
                    "financial_year": financial_year,
                    "dwelling_approvals": value,
                }
            )
    return rows


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT, help="How many suburbs to query this run")
    args = parser.parse_args()

    suburbs = load_suburbs(args.limit)
    print(f"Loaded {len(suburbs)} real suburbs (limit={args.limit})")

    pop_write_header = not POPULATION_CSV_PATH.exists()
    baps_write_header = not BUILDING_APPROVALS_CSV_PATH.exists()

    with open(POPULATION_CSV_PATH, "a", newline="", encoding="utf-8") as pop_f, open(
        BUILDING_APPROVALS_CSV_PATH, "a", newline="", encoding="utf-8"
    ) as baps_f:
        pop_writer = csv.DictWriter(pop_f, fieldnames=POPULATION_CSV_FIELDS)
        baps_writer = csv.DictWriter(baps_f, fieldnames=BUILDING_APPROVALS_CSV_FIELDS)
        if pop_write_header:
            pop_writer.writeheader()
        if baps_write_header:
            baps_writer.writeheader()

        pop_rows_written = 0
        baps_rows_written = 0

        for i, suburb in enumerate(suburbs):
            print(f"[{i + 1}/{len(suburbs)}] {suburb['suburb']} {suburb['state']}")

            try:
                pop_rows = fetch_population_rows(suburb)
            except Exception as exc:  # noqa: BLE001 — log and continue, don't let one suburb kill the batch
                print(f"  ERROR fetching population data: {exc}")
                pop_rows = []
            if pop_rows:
                pop_writer.writerows(pop_rows)
                pop_f.flush()
                pop_rows_written += len(pop_rows)
                matched_sa2s = {r["sa2_name"] for r in pop_rows}
                print(f"  population: {len(pop_rows)} row(s) across {len(matched_sa2s)} matched SA2(s): {sorted(matched_sa2s)}")
            else:
                print("  population: no SA2 match — skipped, not fabricating a row")

            try:
                baps_rows = fetch_building_approval_rows(suburb)
            except Exception as exc:  # noqa: BLE001
                print(f"  ERROR fetching building approvals data: {exc}")
                baps_rows = []
            if baps_rows:
                baps_writer.writerows(baps_rows)
                baps_f.flush()
                baps_rows_written += len(baps_rows)
                matched_sa2s = {r["sa2_name"] for r in baps_rows}
                print(f"  building approvals: {len(baps_rows)} row(s) across {len(matched_sa2s)} matched SA2(s): {sorted(matched_sa2s)}")
            else:
                print("  building approvals: no SA2 match — skipped, not fabricating a row")

            time.sleep(0.5)  # light politeness delay; this is a plain public REST API, not a scrape

    print(
        f"\nDone. Population rows written: {pop_rows_written} -> {POPULATION_CSV_PATH}\n"
        f"Building approval rows written: {baps_rows_written} -> {BUILDING_APPROVALS_CSV_PATH}"
    )
    print(
        "\nNOTE: multiple SA2 rows per suburb are expected and NOT deduplicated — "
        "the suburb->SA2 mapping decision is deferred to a later transform step, per instruction."
    )


if __name__ == "__main__":
    main()
