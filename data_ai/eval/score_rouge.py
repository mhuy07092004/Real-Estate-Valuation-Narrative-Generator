"""Scores generated narrative text against the real reference narrative_text
using ROUGE-L. Works on any file produced by generate_baseline.py's format
(pair_id, prompt, reference, generated) -- run once now on the baseline
output, and again later on the fine-tuned model's output, to compare.

Usage:
  python score_rouge.py docs/fixtures/finetune_ready/test_baseline_gemma2b.jsonl --label baseline
"""

from __future__ import annotations

import argparse
import json
import statistics
from pathlib import Path

from rouge_score import rouge_scorer


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("input_file", type=Path)
    parser.add_argument("--label", default="run")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    scorer = rouge_scorer.RougeScorer(["rougeL"], use_stemmer=True)

    rows = []
    with args.input_file.open(encoding="utf-8") as f:
        for line in f:
            if line.strip():
                rows.append(json.loads(line))

    precisions, recalls, fmeasures = [], [], []
    skipped = 0

    for row in rows:
        reference = row.get("reference")
        generated = row.get("generated")
        if not reference or not generated:
            skipped += 1
            continue
        score = scorer.score(reference, generated)["rougeL"]
        precisions.append(score.precision)
        recalls.append(score.recall)
        fmeasures.append(score.fmeasure)

    print(f"[{args.label}] {len(fmeasures)} rows scored, {skipped} skipped (missing reference/generated)")
    if fmeasures:
        print(f"[{args.label}] ROUGE-L precision: mean={statistics.mean(precisions):.4f} "
              f"stdev={statistics.stdev(precisions):.4f}")
        print(f"[{args.label}] ROUGE-L recall:    mean={statistics.mean(recalls):.4f} "
              f"stdev={statistics.stdev(recalls):.4f}")
        print(f"[{args.label}] ROUGE-L f-measure: mean={statistics.mean(fmeasures):.4f} "
              f"stdev={statistics.stdev(fmeasures):.4f}")


if __name__ == "__main__":
    main()
