from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import textwrap
import time
from pathlib import Path
from typing import Any

import psycopg

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from ingestion.config import IngestionConfig, load_config
    from ingestion.context_retrieval import ContextRetriever
else:
    from .config import IngestionConfig, load_config
    from .context_retrieval import ContextRetriever


class BaselineEvaluator:
    def __init__(self, config: IngestionConfig | None = None):
        self.config = config or load_config()
        self.prompt_path = Path(__file__).resolve().parent.parent / "eval" / "prompts" / "property_narrative_prompt.txt"
        self.report_path = Path(__file__).resolve().parent.parent / "eval" / "baseline-report.md"
        self.context_retriever = ContextRetriever(self.config)
        self._ensure_model_available()

    def run(self) -> dict[str, Any]:
        with psycopg.connect(self.config.dsn) as conn:
            with conn.cursor() as cur:
                rows = self._fetch_evaluation_rows(cur)

        if len(rows) < 1:
            raise RuntimeError("No evaluation rows were found in gold_property_model_ready")

        limit = min(self.config.baseline_eval_limit, len(rows))
        sample_rows = rows[:limit]
        prompt_template = self._load_prompt_template()
        generated_results: list[dict[str, Any]] = []

        for row in sample_rows:
            context = self.context_retriever.retrieve_context_for_property(row)
            prompt_context = self.context_retriever.build_prompt_context(context)
            prompt = self._render_prompt(prompt_template, row, prompt_context)
            started_at = time.perf_counter()
            generated_text = self._generate_narrative(prompt, row)
            elapsed_ms = (time.perf_counter() - started_at) * 1000
            generated_results.append(
                {
                    "property_id": row["property_id"],
                    "prompt": prompt,
                    "generated_text": generated_text,
                    "elapsed_ms": elapsed_ms,
                }
            )

        report = self._build_report(sample_rows, generated_results)
        self.report_path.write_text(report, encoding="utf-8")
        return {
            "rows_evaluated": len(sample_rows),
            "report_path": str(self.report_path),
            "model": self.config.baseline_model_name,
            "backend": "ollama",
        }

    def _fetch_evaluation_rows(self, cur: psycopg.Cursor) -> list[dict[str, Any]]:
        cur.execute(
            """
            SELECT
                p.property_id,
                p.address,
                p.suburb,
                p.postcode,
                p.state,
                p.property_type,
                p.bedrooms,
                p.bathrooms,
                p.parking,
                p.land_size_sqm,
                p.price,
                p.sale_date,
                p.cash_rate_at_sale,
                n.narrative_text,
                n.buyer_purpose
            FROM gold_property_model_ready p
            LEFT JOIN gold_narrative_training_pairs n ON n.property_id = p.property_id
            ORDER BY p.property_id
            """
        )
            # WHERE p.is_seed_data = TRUE

        rows: list[dict[str, Any]] = []
        for record in cur.fetchall():
            if record[13] is None:
                continue
            rows.append(
                {
                    "property_id": str(record[0]),
                    "address": record[1],
                    "suburb": record[2],
                    "postcode": record[3],
                    "state": record[4],
                    "property_type": record[5],
                    "bedrooms": int(record[6]),
                    "bathrooms": int(record[7]),
                    "parking": int(record[8]),
                    "land_size_sqm": float(record[9]),
                    "price": float(record[10]),
                    "estimated_value": float(record[10]) if record[10] is not None else None,
                    "sale_date": str(record[11]),
                    "cash_rate_at_sale": float(record[12]) if record[12] is not None else None,
                    "reference_narrative": record[13],
                    "buyer_purpose": record[14],
                }
            )
        return rows

    def _load_prompt_template(self) -> str:
        return self.prompt_path.read_text(encoding="utf-8")

    def _render_prompt(self, template: str, row: dict[str, Any], prompt_context: str) -> str:
        return template.format(
            buyer_purpose=row["buyer_purpose"],
            address=row["address"],
            suburb=row["suburb"],
            postcode=row["postcode"],
            state=row["state"],
            property_type=row["property_type"],
            bedrooms=row["bedrooms"],
            bathrooms=row["bathrooms"],
            parking=row["parking"],
            land_size_sqm=row["land_size_sqm"],
            price=row["price"],
            estimated_value=row["estimated_value"],
            sale_date=row["sale_date"],
            cash_rate_at_sale=row["cash_rate_at_sale"],
            prompt_context=prompt_context,
        )

    def _ensure_model_available(self) -> None:
        if shutil.which("ollama") is None:
            raise RuntimeError("The 'ollama' CLI was not found. Install Ollama and ensure it is on your PATH.")

        result = subprocess.run(["ollama", "list"], capture_output=True, text=True, encoding="utf-8", errors="replace", check=False)
        if result.returncode != 0:
            raise RuntimeError(f"Unable to inspect installed Ollama models: {result.stderr or result.stdout}")

        if self.config.baseline_model_name not in result.stdout:
            raise RuntimeError(
                f"Model '{self.config.baseline_model_name}' is not installed. Run 'ollama pull {self.config.baseline_model_name}' first."
            )

    def _generate_narrative(self, prompt: str, row: dict[str, Any]) -> str:
        try:
            completed = subprocess.run(
                ["ollama", "run", self.config.baseline_model_name, prompt],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                check=False,
                timeout=self.config.baseline_ollama_timeout_seconds,
            )
        except subprocess.TimeoutExpired as exc:
            raise RuntimeError(
                f"Ollama generation timed out after {self.config.baseline_ollama_timeout_seconds} seconds"
            ) from exc

        if completed.returncode != 0:
            error_text = completed.stderr.strip() or completed.stdout.strip() or "unknown error"
            raise RuntimeError(f"Ollama generation failed: {error_text}")

        generated_text = completed.stdout.strip()
        if not generated_text:
            raise RuntimeError("Ollama returned no generated text")
        return self._sanitize_text(generated_text)

    def _sanitize_text(self, text: str) -> str:
        text = re.sub(r"\x1B\[[0-9;?]*[A-Za-z]", "", text)
        text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", text)
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        normalized_lines = []
        for line in text.splitlines():
            line = re.sub(r"\s+", " ", line).strip()
            if line:
                normalized_lines.append(line)
        return "\n\n".join(normalized_lines).strip()

    def _format_generated_text(self, text: str) -> str:
        paragraphs = [paragraph.strip() for paragraph in text.split("\n\n") if paragraph.strip()]
        if not paragraphs:
            return ""
        wrapped_paragraphs = [textwrap.fill(re.sub(r"\s+", " ", paragraph), width=100) for paragraph in paragraphs]
        return "\n\n".join(wrapped_paragraphs)

    def _build_report(self, rows: list[dict[str, Any]], generated_results: list[dict[str, Any]]) -> str:
        average_latency = sum(item["elapsed_ms"] for item in generated_results) / len(generated_results)
        lines = [
            "# Baseline model evaluation",
            "",
            "## Model",
            f"- Model: {self.config.baseline_model_name}",
            "- Backend: Ollama",
            "- Prompt template: eval/prompts/property_narrative_prompt.txt",
            f"- Evaluation rows: {len(rows)}",
            "",
            "## Summary",
            f"- Average latency per generation: {average_latency:.2f} ms",
            "- Metric approach: ROUGE-L and BERTScore are planned for the next iteration; the current scaffold records the generation workflow and report structure.",
            "",
            "## Sample rows",
        ]

        for item in generated_results[:5]:
            formatted_text = self._format_generated_text(item["generated_text"])
            if not formatted_text:
                continue
            wrapped_lines = formatted_text.splitlines()
            lines.append(f"- Property {item['property_id']}: {wrapped_lines[0]}")
            for wrapped_line in wrapped_lines[1:]:
                lines.append(f"  {wrapped_line}")

        return "\n".join(lines) + "\n"


def main() -> None:
    evaluator = BaselineEvaluator(load_config())
    result = evaluator.run()
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
