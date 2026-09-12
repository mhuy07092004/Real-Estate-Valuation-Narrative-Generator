"""Fixed-seed 80/10/10 split of data_ai/narrative_training_pairs.jsonl into
train/val/test files, stratified by role so each split has a proportional
mix of all 4 roles (not just a global shuffle, which could otherwise leave
a split missing one role entirely given only 75 rows per role).

Per SCP-425's acceptance criteria (train/validation/test split, documented
and reproducible). Not using DVC for versioning — see the plan notes for
why plain git-tracked files were chosen instead for this dataset's size.

Usage: python split_narrative_dataset.py
Output: data_ai/docs/fixtures/narrative_training_pairs.{train,val,test}.jsonl
"""

from __future__ import annotations

import json
import random
from collections import defaultdict
from pathlib import Path

SEED = 42
INPUT_PATH = Path(__file__).resolve().parent.parent / "narrative_training_pairs.jsonl"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "docs" / "fixtures"


def load_rows() -> list[dict]:
    with INPUT_PATH.open(encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def split_rows(rows: list[dict]) -> tuple[list[dict], list[dict], list[dict]]:
    rng = random.Random(SEED)
    by_role: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        by_role[row["role"]].append(row)

    train, val, test = [], [], []
    for role in sorted(by_role):
        group = by_role[role][:]
        rng.shuffle(group)
        n = len(group)
        train_end = int(n * 0.8)
        val_end = int(n * 0.9)
        train.extend(group[:train_end])
        val.extend(group[train_end:val_end])
        test.extend(group[val_end:])

    # Shuffle each split's role-grouped rows together for interleaving.
    rng.shuffle(train)
    rng.shuffle(val)
    rng.shuffle(test)
    return train, val, test


def write_jsonl(path: Path, rows: list[dict]) -> None:
    with path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


def main() -> None:
    rows = load_rows()
    train, val, test = split_rows(rows)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    write_jsonl(OUTPUT_DIR / "narrative_training_pairs.train.jsonl", train)
    write_jsonl(OUTPUT_DIR / "narrative_training_pairs.val.jsonl", val)
    write_jsonl(OUTPUT_DIR / "narrative_training_pairs.test.jsonl", test)

    print(f"Total: {len(rows)}  Train: {len(train)}  Val: {len(val)}  Test: {len(test)}")

    role_counts = defaultdict(lambda: defaultdict(int))
    for split_name, split_rows_ in (("train", train), ("val", val), ("test", test)):
        for row in split_rows_:
            role_counts[split_name][row["role"]] += 1
    for split_name in ("train", "val", "test"):
        print(f"  {split_name}: {dict(role_counts[split_name])}")


if __name__ == "__main__":
    main()
