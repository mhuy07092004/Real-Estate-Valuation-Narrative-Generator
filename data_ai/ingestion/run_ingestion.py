from __future__ import annotations

import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from ingestion.bronze_listing_ingest import ExtractTool
    from ingestion.config import load_config
else:
    from .bronze_listing_ingest import ExtractTool
    from .config import load_config


def main() -> None:
    config = load_config()
    ingestor = ExtractTool(config)
    ingestor.extract()


if __name__ == "__main__":
    main()