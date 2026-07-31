from __future__ import annotations

import json
import urllib.error
import urllib.request
from datetime import date, datetime
from io import BytesIO
from typing import Any

import pandas as pd
import psycopg

from .config import IngestionConfig


class MacroIndicatorExtractTool:
    """A national-level macro indicator ingestion tool."""

    DEFAULT_SOURCE_URL = (
        "https://www.rba.gov.au/statistics/tables/xls/f01d.xlsx"
    )
    DEFAULT_INDICATOR_NAME = "rba_cash_rate"
    SOURCE = "rba"
    GEOGRAPHY_LEVEL = "national"

    def __init__(self, config: IngestionConfig | None = None):
        self.config = config or IngestionConfig()

    def extract(self) -> None:
        content = self._fetch_source()
        if content is None:
            print("Warning: macro source fetch returned no payload")
            return

        record = self._parse_excel(content)
        if record is None:
            print("Warning: macro source payload did not contain a valid record")
            return

        self._append_to_database(record)
        print(
            "Inserted national macro indicator:",
            record["indicator_name"],
            record["period_start"],
            record["value"],
        )

    def _fetch_source(self) -> bytes | None:
        url = self.config.macro_source_url or self.DEFAULT_SOURCE_URL
        request = urllib.request.Request(
            url,
            headers={"User-Agent": self.config.user_agent},
        )

        try:
            with urllib.request.urlopen(request, timeout=self.config.request_timeout_seconds) as response:
                data = response.read()
                if not data:
                    print(f"Warning: empty response from macro source {url}")
                    return None
                return data
        except urllib.error.HTTPError as exc:
            print(f"Warning: HTTP error fetching macro source {url}: {exc.code} {exc.reason}")
        except urllib.error.URLError as exc:
            print(f"Warning: network error fetching macro source {url}: {exc.reason}")
        except Exception as exc:
            print(f"Warning: unexpected error fetching macro source {url}: {exc}")

        return None

    def _parse_excel(self, content: bytes) -> dict[str, Any] | None:
        try:
            df = pd.read_excel(
                BytesIO(content),
                sheet_name=0,
                engine="openpyxl",
                header=10,
            )
        except ImportError:
            print("Warning: openpyxl is required to parse RBA Excel macros. Install it with `pip install openpyxl`.")
            return None
        except Exception as exc:
            print(f"Warning: failed to parse Excel macro source: {exc}")
            return None

        if df.empty:
            return None

        df.columns = [str(col).strip() for col in df.columns]
        date_col = "Series ID" if "Series ID" in df.columns else self._find_date_column(df)
        value_col = self._find_value_column(df)
        if date_col is None or value_col is None:
            print("Warning: could not locate date/value columns in RBA macro spreadsheet")
            return None

        df = df[[date_col, value_col]].copy()
        df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
        df[value_col] = pd.to_numeric(df[value_col], errors="coerce")
        df = df[df[date_col].notna() & df[value_col].notna()]

        if df.empty:
            return None

        latest = df.iloc[-1]
        period_start = latest[date_col]
        if isinstance(period_start, datetime):
            period_start = period_start.date()
        elif isinstance(period_start, date):
            period_start = period_start
        else:
            return None

        return {
            "source": self.SOURCE,
            "indicator_name": self.config.macro_indicator_name or self.DEFAULT_INDICATOR_NAME,
            "geography_level": self.GEOGRAPHY_LEVEL,
            "geography_code": None,
            "period_start": period_start,
            "period_end": None,
            "value": float(latest[value_col]),
            "unit": "percent",
            "raw_payload": {
                "source_url": self.config.macro_source_url or self.DEFAULT_SOURCE_URL,
                "sheet_columns": list(df.columns),
                "latest_row": {
                    "period_start": str(period_start),
                    "value": float(latest[value_col]),
                },
            },
            "fetched_at": datetime.now(),
        }

    def _find_date_column(self, df: pd.DataFrame) -> str | None:
        if "Series ID" in df.columns:
            return "Series ID"

        candidates = [col for col in df.columns if "date" in col.lower()]
        if candidates:
            return candidates[0]
        if len(df.columns) >= 1:
            return df.columns[0]
        return None

    def _find_value_column(self, df: pd.DataFrame) -> str | None:
        candidates = [col for col in df.columns if "cash" in col.lower() or "rate" in col.lower()]
        if candidates:
            return candidates[0]
        if len(df.columns) >= 2:
            return df.columns[1]
        return None

    def _append_to_database(self, record: dict[str, Any]) -> None:
        with psycopg.connect(self.config.dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO bronze_macro_indicators (
                        source,
                        indicator_name,
                        geography_level,
                        geography_code,
                        period_start,
                        period_end,
                        value,
                        unit,
                        raw_payload,
                        fetched_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        record["source"],
                        record["indicator_name"],
                        record["geography_level"],
                        record["geography_code"],
                        record["period_start"],
                        record["period_end"],
                        record["value"],
                        record["unit"],
                        json.dumps(record["raw_payload"], default=str),
                        record["fetched_at"],
                    ),
                )
