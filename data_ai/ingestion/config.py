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


def load_config() -> IngestionConfig:
    return IngestionConfig()