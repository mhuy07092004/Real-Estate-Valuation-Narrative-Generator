from __future__ import annotations

import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from ingestion.config import load_config
    from ingestion.macro_data_ingest import MacroIndicatorExtractTool
else:
    from .config import load_config
    from .macro_data_ingest import MacroIndicatorExtractTool


def main() -> None:
    config = load_config()
    ingestor = MacroIndicatorExtractTool(config)
    ingestor.extract()


if __name__ == "__main__":
    main()
