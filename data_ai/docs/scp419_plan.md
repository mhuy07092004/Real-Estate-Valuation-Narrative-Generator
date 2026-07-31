# SCP-419 plan: baseline model evaluation

## Goal
Establish a simple, reproducible baseline for how well an off-the-shelf language model can generate property appraisal narratives using the data we already have.

## What we can build on today
- The serving schema already has property rows in gold_property_model_ready.
- The prototype narrative fixtures already provide example narrative text in gold_narrative_training_pairs.
- The API already expects narrative text and buyer-purpose context to be available.
- We do not need full fine-tuning for this ticket; the goal is only to measure baseline quality.

## MVP scope
Keep this narrow and practical:
1. Choose one small open-weight model for evaluation.
2. Build a prompt template that takes structured property data and a buyer purpose as input.
3. Run the model against a held-out set of at least 30 properties.
4. Compare generated narratives to reference narratives using ROUGE-L and BERTScore.
5. Record average latency and write a markdown report.

## Recommended model choice
For an MVP, use a compact open-weight model such as:
- Qwen2.5-3B-Instruct

Why this is a good fit:
- small enough to run locally without requiring a large GPU
- strong instruction-following quality for short narrative generation
- easier to iterate on than a larger model

If the environment later supports more compute, this can be swapped for a larger model without changing the evaluation flow.

## Data source for evaluation
Because SCP-425 is not yet a full training split, use the existing prototype data for this baseline run:
- pull property rows from gold_property_model_ready
- pull matching narrative rows from gold_narrative_training_pairs by property_id
- select a held-out sample of at least 30 rows for evaluation

For reproducibility, the script should:
- use a fixed random seed
- store the selected property ids in a small manifest file or report section

## Prompt design
Use a simple prompt template with:
- address
- suburb
- postcode
- property_type
- bedrooms, bathrooms, parking
- land_size_sqm
- price
- sale_date
- cash_rate_at_sale
- buyer_purpose

The prompt should request a short narrative that is:
- grounded in the structured property facts
- written in a professional property appraisal style
- tailored to the selected buyer purpose

## Evaluation flow
1. Build a small evaluation dataset from the current gold tables.
2. Run the model once in zero-shot mode.
3. Run the model again in few-shot mode using 3 example pairs from the same dataset.
4. Score the generated text against the reference narrative using:
   - ROUGE-L for overlap
   - BERTScore for semantic similarity
5. Measure latency per generation.
6. Write the results to eval/baseline-report.md.

## Proposed deliverables
- a Python evaluation script, for example: data_ai/ingestion/evaluate_baseline_model.py
- a prompt template file, for example: data_ai/eval/prompts/property_narrative_prompt.txt
- a markdown report, for example: data_ai/eval/baseline-report.md

## Acceptance criteria
- one base model is evaluated against at least 30 held-out property narratives
- report includes model name, prompt version, metrics, and latency
- rerunning the evaluation produces metrics within about 5 percent of the prior run when the same seed and settings are used

## Implementation steps
1. Add a small evaluation script under data_ai/ingestion.
2. Query the current gold tables and build a fixed evaluation set.
3. Implement zero-shot and few-shot generation.
4. Capture metrics and latency.
5. Write the report to data_ai/eval/baseline-report.md.

## Recommendation
Keep the first version simple and deterministic:
- no custom fine-tuning yet
- no complex human rubric
- no external API dependency unless it is already available
- focus on getting one clean baseline report that can later be compared to SCP-420 results
