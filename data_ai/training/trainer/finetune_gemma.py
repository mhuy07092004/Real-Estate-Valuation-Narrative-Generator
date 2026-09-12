"""LoRA fine-tuning of Gemma 2 2B-it on the role-conditioned narrative dataset
(gs://csit321-508209-relaive-data/training-data/{train,val}.jsonl).
Requires an HF_TOKEN env var with the Gemma license accepted.
"""

from __future__ import annotations

import argparse
import os

from datasets import load_dataset
from peft import LoraConfig
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl import SFTConfig, SFTTrainer

MODEL_ID = "google/gemma-2-2b-it"


def gcs_to_fuse_path(uri: str) -> str:
    # Vertex AI training containers mount every accessible GCS bucket at
    # /gcs/<bucket>/... via Cloud Storage FUSE -- plain filesystem writes
    # (torch.save, save_pretrained) only reach the real bucket through this
    # mount, not through a bare gs:// URI passed to standard file I/O.
    return "/gcs/" + uri[len("gs://"):] if uri.startswith("gs://") else uri


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--train-file", type=gcs_to_fuse_path, default=gcs_to_fuse_path(os.environ.get(
        "TRAIN_FILE", "gs://csit321-508209-relaive-data/training-data/train.jsonl")))
    parser.add_argument("--val-file", type=gcs_to_fuse_path, default=gcs_to_fuse_path(os.environ.get(
        "VAL_FILE", "gs://csit321-508209-relaive-data/training-data/val.jsonl")))
    parser.add_argument("--output-dir", type=gcs_to_fuse_path, default=gcs_to_fuse_path(
        os.environ.get("AIP_MODEL_DIR", "./output")))
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--learning-rate", type=float, default=2e-4)
    parser.add_argument("--batch-size", type=int, default=1)
    parser.add_argument("--grad-accum", type=int, default=8)
    parser.add_argument("--lora-r", type=int, default=16)
    parser.add_argument("--lora-alpha", type=int, default=32)
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, token=os.environ.get("HF_TOKEN"))
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID, token=os.environ.get("HF_TOKEN"),
        torch_dtype="bfloat16", device_map="auto",
    )

    lora_config = LoraConfig(
        r=args.lora_r, lora_alpha=args.lora_alpha, lora_dropout=0.05,
        bias="none", task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    )

    train_dataset = load_dataset("json", data_files=args.train_file, split="train")
    val_dataset = load_dataset("json", data_files=args.val_file, split="train")

    sft_config = SFTConfig(
        output_dir=args.output_dir, num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        learning_rate=args.learning_rate, bf16=True,
        logging_steps=10, eval_strategy="no", save_strategy="epoch",
        report_to="none", max_seq_length=1024, packing=False,
    )

    trainer = SFTTrainer(
        model=model, args=sft_config,
        train_dataset=train_dataset, eval_dataset=val_dataset,
        peft_config=lora_config, tokenizer=tokenizer,
    )

    trainer.train()
    trainer.save_model(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)


if __name__ == "__main__":
    main()
