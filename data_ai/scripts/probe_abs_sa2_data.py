"""
Feasibility probe for Population Growth / Supply Constraint sourcing.

Unlike the Domain suburb-profile probe, these two ABS datasets are plain
public ArcGIS REST APIs (geo.abs.gov.au) — no scraping, no anti-bot, just an
HTTP GET returning JSON. This script queries both for a given SA2 name
filter, saves the raw JSON response to disk, and prints a short summary so
we can manually confirm the real numbers before writing any real ingestion
logic.

Covers:
  - ABS_ERP_2001_2023_SA2  -> Estimated Resident Population per SA2, 2021-2023
    (source for Population Growth)
  - ABS_BAPS_SA2_1415_2223 -> Building Approvals per SA2, 2014/15-2022/23
    (source for the Supply Constraint proxy: dwelling approvals per year)

Standalone — stdlib only (urllib), no DB writes, no new dependencies.

Usage:
    cd data_ai
    venv\Scripts\python.exe scripts\probe_abs_sa2_data.py "Orange"
    venv\Scripts\python.exe scripts\probe_abs_sa2_data.py "Richmond"
"""
from __future__ import annotations

import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "probe_output"

ERP_URL = "https://geo.abs.gov.au/arcgis/rest/services/Hosted/ABS_ERP_2001_2023_SA2/FeatureServer/0/query"
ERP_FIELDS = "sa2_name_2021,sa2_code_2021,erp_no_2021,erp_no_2022,erp_no_2023"

BAPS_URL = "https://geo.abs.gov.au/arcgis/rest/services/Hosted/ABS_BAPS_SA2_1415_2223/FeatureServer/0/query"
# totdwl_dwl_XXXX = total dwelling units approved (all sectors) for that
# financial year — the field we'd use for the supply-constraint proxy.
BAPS_FIELDS = "sa2_name_2021,sa2_code_2021,totdwl_dwl_1920,totdwl_dwl_2021,totdwl_dwl_2122,totdwl_dwl_2223"


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
    request = urllib.request.Request(url, headers={"User-Agent": "relaive-data-feasibility-probe/0.1"})
    with urllib.request.urlopen(request, timeout=15) as response:
        return json.loads(response.read())


def probe(sa2_name_filter: str) -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)
    slug = sa2_name_filter.lower().replace(" ", "-")

    print(f"\n=== ABS ERP (Population) — SA2 name contains '{sa2_name_filter}' ===")
    erp_data = fetch_json(ERP_URL, sa2_name_filter, ERP_FIELDS)
    erp_path = OUTPUT_DIR / f"abs_erp_{slug}.json"
    erp_path.write_text(json.dumps(erp_data, indent=2), encoding="utf-8")
    features = erp_data.get("features", [])
    print(f"Saved: {erp_path} ({len(features)} SA2 region(s) matched)")
    for f in features:
        a = f["attributes"]
        e21, e22, e23 = a.get("erp_no_2021"), a.get("erp_no_2022"), a.get("erp_no_2023")
        growth = None
        if e21 and e23:
            growth = round((e23 - e21) / e21 * 100, 2)
        print(f"  {a.get('sa2_name_2021')} ({a.get('sa2_code_2021')}): {e21} -> {e22} -> {e23}  (2yr growth: {growth}%)")

    print(f"\n=== ABS Building Approvals (Supply proxy) — SA2 name contains '{sa2_name_filter}' ===")
    baps_data = fetch_json(BAPS_URL, sa2_name_filter, BAPS_FIELDS)
    baps_path = OUTPUT_DIR / f"abs_baps_{slug}.json"
    baps_path.write_text(json.dumps(baps_data, indent=2), encoding="utf-8")
    features = baps_data.get("features", [])
    print(f"Saved: {baps_path} ({len(features)} SA2 region(s) matched)")
    for f in features:
        a = f["attributes"]
        print(
            f"  {a.get('sa2_name_2021')} ({a.get('sa2_code_2021')}): "
            f"dwellings approved 19/20={a.get('totdwl_dwl_1920')}, "
            f"20/21={a.get('totdwl_dwl_2021')}, "
            f"21/22={a.get('totdwl_dwl_2122')}, "
            f"22/23={a.get('totdwl_dwl_2223')}"
        )


def main() -> None:
    filters = sys.argv[1:] or ["Orange", "Richmond"]
    for name in filters:
        probe(name)


if __name__ == "__main__":
    main()
