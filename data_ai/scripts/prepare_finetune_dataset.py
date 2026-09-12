"""Joins the role-conditioned narrative pairs (data_ai/docs/fixtures/narrative_training_pairs.{split}.jsonl,
produced by split_narrative_dataset.py) back to their real grounding data
(data_ai/docs/fixtures/narrative_dataset_inputs.jsonl, produced by
backend/scripts/export-narrative-training-inputs.ts) and formats each row as a
chat-style {"messages": [...]} example ready for SFT (Gemma 2 9B-it via
transformers/peft/trl on Vertex AI Training).

The prompt mirrors what report-content.service.ts actually has available when
it builds a report today: subject property facts, comparables, suburb market
stats, and (buyer/investor only) affordability/ROI figures. The completion is
the real narrative_text (Executive Summary, + Growth Outlook for investor or
Affordability Assessment for buyer).

Usage: python prepare_finetune_dataset.py
Output: data_ai/docs/fixtures/finetune_ready/{train,val,test}.jsonl
"""

from __future__ import annotations

import json
from pathlib import Path

FIXTURES_DIR = Path(__file__).resolve().parent.parent / "docs" / "fixtures"
INPUTS_PATH = FIXTURES_DIR / "narrative_dataset_inputs.jsonl"
OUTPUT_DIR = FIXTURES_DIR / "finetune_ready"

ROLE_LABEL = {
    "agent": "real estate agent",
    "valuer": "certified practising valuer",
    "buyer": "buyer's advocate",
    "investor": "property investment advisor",
}

REPORT_TYPE_LABEL = {
    "vendor-appraisal": "Vendor Appraisal",
    "bank-valuation": "Bank Valuation",
    "buyer-report": "Buyer Report",
    "investment-report": "Investment Report",
}

SECTIONS_REQUIRED = {
    "agent": "the Executive Summary section",
    "valuer": "the Executive Summary section",
    "buyer": "the Executive Summary section and the Affordability Assessment section",
    "investor": "the Executive Summary section and the Growth Outlook section",
}


def money(n: float) -> str:
    return f"${round(n):,}"


def load_inputs() -> dict[tuple[str, str], dict]:
    inputs = {}
    with INPUTS_PATH.open(encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            row = json.loads(line)
            inputs[(row["property_id"], row["role"])] = row
    return inputs


def build_prompt(row: dict) -> str:
    subj = row["subject"]
    role = row["role"]
    lines = [
        f"You are a professional {ROLE_LABEL[role]} preparing the narrative sections of a "
        f"{REPORT_TYPE_LABEL[row['report_type']]} report.",
        "",
        "Property:",
        f"- Address: {subj['address']}, {subj['suburb']} {subj['state']} {subj['postcode']}",
        f"- Type: {subj['propertyType']}, {subj['bedrooms']} bed / {subj['bathrooms']} bath / "
        f"{subj['parking']} car, {subj.get('areaSqm', 'unknown')} sqm",
        "",
        f"Estimated value: {money(row['estimated_value'])}",
        "",
        "Comparable sales:",
    ]
    for c in row["comparables"]:
        sold_date = c["soldDate"][:10]
        lines.append(
            f"- {c['address']}: {money(c['soldPrice'])}, sold {sold_date}, "
            f"{c['bedrooms']} bed / {c['bathrooms']} bath / {c['parking']} car, "
            f"{c.get('areaSqm', 'unknown')} sqm"
        )

    m = row["market"]
    lines += [
        "",
        f"Market data for {subj['suburb']}:",
        f"- Median price: {money(m['medianPrice'])} ({m['medianPriceGrowthPct']}% annual growth, "
        f"{round(m['monthlyGrowthPct'], 1)}% monthly)",
        f"- Median days on market: {m['daysOnMarket']}",
        f"- Rental yield: {round(m['rentalYieldPct'], 2)}%",
        f"- Auction clearance rate: {m['auctionClearanceRatePct']}%",
        f"- Vacancy rate: {round(m['vacancyRatePct'], 2)}%",
    ]

    if role == "investor" and row.get("roi"):
        roi = row["roi"]
        inputs_ = roi["inputs"]
        lines += [
            "",
            "Financing assumptions:",
            f"- Purchase price: {money(inputs_['purchasePrice'])}",
            f"- Deposit: {money(inputs_['deposit'])}",
            f"- Loan interest rate: {inputs_['interestRate']}%",
            f"- Estimated weekly rent: {money(inputs_['weeklyRent'])}",
            "",
            "ROI figures (calculated, do not recompute):",
            f"- Gross rental yield: {round(roi['grossYieldPct'], 2)}%",
            f"- Net rental yield: {round(roi['netYieldPct'], 2)}%",
            f"- Monthly cash flow: {money(roi['monthlyCashFlow'])}",
            f"- Cash-on-cash return: {round(roi['cashOnCashReturnPct'], 2)}%",
        ]

    if role == "buyer" and row.get("affordability"):
        aff = row["affordability"]
        inputs_ = aff["inputs"]
        lines += [
            "",
            "Buyer financial profile (as entered):",
            f"- Gross annual income: {money(inputs_['yourAnnualIncome'])}"
            + (f" + partner {money(inputs_['partnerAnnualIncome'])}" if inputs_.get("partnerAnnualIncome") else ""),
            f"- Deposit available: {money(inputs_['availableDeposit'])}",
            "",
            "Affordability figures (calculated, do not recompute):",
            f"- Estimated borrowing capacity: {money(aff['estimatedBorrowingCapacity'])}",
            f"- Maximum loan amount: {money(aff['maxLoanAmount'])}",
            f"- Repayment as % of income: {aff['repaymentToIncomePct']}%",
        ]

    lines += [
        "",
        f"Write {SECTIONS_REQUIRED[role]} exactly as they would appear in the generated report, "
        "with the same section headings, grounded strictly in the data above. "
        "Do not invent any figures not present above.",
    ]
    return "\n".join(lines)


def convert_split(split_name: str, inputs: dict[tuple[str, str], dict]) -> int:
    src = FIXTURES_DIR / f"narrative_training_pairs.{split_name}.jsonl"
    dst = OUTPUT_DIR / f"{split_name}.jsonl"
    count = 0
    with src.open(encoding="utf-8") as f_in, dst.open("w", encoding="utf-8") as f_out:
        for line in f_in:
            if not line.strip():
                continue
            pair = json.loads(line)
            key = (pair["property_id"], pair["role"])
            row = inputs.get(key)
            if row is None:
                raise KeyError(f"No grounding input found for {key}")
            example = {
                "pair_id": pair["pair_id"],
                "messages": [
                    {"role": "user", "content": build_prompt(row)},
                    {"role": "assistant", "content": pair["narrative_text"]},
                ],
            }
            f_out.write(json.dumps(example, ensure_ascii=False) + "\n")
            count += 1
    return count


def main() -> None:
    inputs = load_inputs()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for split_name in ("train", "val", "test"):
        n = convert_split(split_name, inputs)
        print(f"{split_name}: {n} examples -> {OUTPUT_DIR / (split_name + '.jsonl')}")


if __name__ == "__main__":
    main()
