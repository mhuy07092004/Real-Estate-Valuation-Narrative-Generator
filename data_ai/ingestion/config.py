from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class IngestionConfig:
    dsn: str = os.getenv(
        "RELAIVE_AI_DB_DSN",
        "postgresql://relaive:relaive_dev_password@localhost:5432/relaive_ai",
    )
    source_url: str = os.getenv("SCP414_SOURCE_URL", "https://example.invalid/listings.json")
    requests_per_second: float = float(os.getenv("SCP414_RATE_LIMIT_RPS", "0.5"))
    request_timeout_seconds: int = int(os.getenv("SCP414_TIMEOUT_SECONDS", "15"))
    user_agent: str = os.getenv("SCP414_USER_AGENT", "relaive-scp414-bot/0.1")
    baseline_model_name: str = os.getenv("SCP419_MODEL_NAME", "qwen2.5:3b-instruct")
    baseline_eval_limit: int = int(os.getenv("SCP419_EVAL_LIMIT", "30"))
    baseline_ollama_timeout_seconds: int = int(os.getenv("SCP419_OLLAMA_TIMEOUT_SECONDS", "180"))
    macro_source_url: str = os.getenv(
        "SCP415_SOURCE_URL",
        "https://www.rba.gov.au/statistics/tables/xls/f01d.xlsx",
    )
    macro_indicator_name: str = os.getenv("SCP415_INDICATOR_NAME", "rba_cash_rate")


def load_config() -> IngestionConfig:
    return IngestionConfig()