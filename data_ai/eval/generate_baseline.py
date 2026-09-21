"""Generates baseline (zero-shot, untrained) Gemma 2 2B-it output for every
prompt in the test split, so we have something to compare the fine-tuned
model against later. Run this BEFORE training touches anything.

Requires the model deployed on the persistent endpoint:
  gcloud ai endpoints deploy-model 3931876120915345408 --region=us-central1
    --project=csit321-508209 --model=gemma2-2b-it-1789186742311
    --display-name=gemma2-2b-it-deployment --machine-type=g2-standard-12
    --accelerator="type=nvidia-l4,count=1" --traffic-split=0=100

Usage: python generate_baseline.py
Output: docs/fixtures/finetune_ready/test_baseline_gemma2b.jsonl
"""

from __future__ import annotations

import json
import os
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path

# Override per run instead of editing this file: VERTEX_REGION, VERTEX_ENDPOINT_ID,
# and EVAL_OUTPUT (a file name inside finetune_ready/ — use e.g.
# test_finetuned_gemma2b.jsonl so the recorded baseline is never overwritten).
PROJECT_ID = os.environ.get("VERTEX_PROJECT_ID", "393439107077")
REGION = os.environ.get("VERTEX_REGION", "us-central1")
ENDPOINT_ID = os.environ.get("VERTEX_ENDPOINT_ID", "3931876120915345408")  # baseline endpoint (no longer exists)
PREDICT_URL = (
    f"https://{REGION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}"
    f"/locations/{REGION}/endpoints/{ENDPOINT_ID}:predict"
)

TEST_FILE = Path(__file__).resolve().parent.parent / "docs" / "fixtures" / "finetune_ready" / "test.jsonl"
OUTPUT_FILE = Path(__file__).resolve().parent.parent / "docs" / "fixtures" / "finetune_ready" / os.environ.get(
    "EVAL_OUTPUT", "test_baseline_gemma2b.jsonl"
)

MAX_TOKENS = 300
RETRIES = 3
RETRY_DELAY_SECONDS = 5


def get_access_token() -> str:
    result = subprocess.run(
        "gcloud auth print-access-token",
        capture_output=True, text=True, check=True, shell=True,
    )
    return result.stdout.strip()


def extract_message_content(data: dict) -> str | None:
    candidates = [
        data.get("choices", [{}])[0].get("message", {}).get("content") if data.get("choices") else None,
        data.get("predictions", {}).get("choices", [{}])[0].get("message", {}).get("content")
        if isinstance(data.get("predictions"), dict) else None,
        data.get("predictions", [None])[0][0].get("message", {}).get("content")
        if isinstance(data.get("predictions"), list) and data["predictions"] and isinstance(data["predictions"][0], list)
        else None,
    ]
    for c in candidates:
        if isinstance(c, str) and c.strip():
            return c.strip()
    return None


def call_endpoint(prompt: str, token: str) -> str | None:
    body = json.dumps({
        "instances": [
            {
                "@requestFormat": "chatCompletions",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": MAX_TOKENS,
            }
        ]
    }).encode("utf-8")

    req = urllib.request.Request(
        PREDICT_URL, data=body, method="POST",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )

    for attempt in range(1, RETRIES + 1):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return extract_message_content(data)
        except urllib.error.HTTPError as e:
            print(f"  attempt {attempt}/{RETRIES} failed: HTTP {e.code} {e.read().decode('utf-8')[:200]}")
        except Exception as e:
            print(f"  attempt {attempt}/{RETRIES} failed: {e}")
        if attempt < RETRIES:
            time.sleep(RETRY_DELAY_SECONDS)
    return None


def main() -> None:
    token = get_access_token()

    rows = []
    with TEST_FILE.open(encoding="utf-8") as f:
        for line in f:
            if line.strip():
                rows.append(json.loads(line))

    print(f"Generating baseline output for {len(rows)} test examples...")

    results = []
    for i, row in enumerate(rows, 1):
        prompt = row["messages"][0]["content"]
        reference = row["messages"][1]["content"]
        print(f"[{i}/{len(rows)}] {row['pair_id']}")

        generated = call_endpoint(prompt, token)
        if generated is None:
            print(f"  FAILED after {RETRIES} attempts, recording null")

        results.append({
            "pair_id": row["pair_id"],
            "prompt": prompt,
            "reference": reference,
            "generated": generated,
        })

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_FILE.open("w", encoding="utf-8") as f:
        for r in results:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    failures = sum(1 for r in results if r["generated"] is None)
    print(f"\nDone. {len(results)} rows written to {OUTPUT_FILE} ({failures} failures)")


if __name__ == "__main__":
    main()
