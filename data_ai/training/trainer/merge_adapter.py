"""Merges a trained LoRA adapter into the Gemma 2 2B-it base model and
saves the full merged model, ready to upload as a Vertex AI Model resource.

Usage (as a Vertex custom job): python -m trainer.merge_adapter
Reads adapter from /gcs/.../model (FUSE-mounted), writes merged model to
another /gcs/... path the same way.
"""

from __future__ import annotations

import argparse
import os

from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL_ID = "google/gemma-2-2b-it"


def gcs_to_fuse_path(uri: str) -> str:
    return "/gcs/" + uri[len("gs://"):] if uri.startswith("gs://") else uri


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--adapter-dir", type=gcs_to_fuse_path, required=True)
    parser.add_argument("--output-dir", type=gcs_to_fuse_path, required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    token = os.environ.get("HF_TOKEN")

    base_model = AutoModelForCausalLM.from_pretrained(MODEL_ID, token=token, torch_dtype="bfloat16")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, token=token)

    model = PeftModel.from_pretrained(base_model, args.adapter_dir)
    merged = model.merge_and_unload()

    merged.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)
    print(f"Merged model saved to {args.output_dir}")


if __name__ == "__main__":
    main()
