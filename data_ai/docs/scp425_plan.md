# SCP-425 plan: labeled narrative training set

## Goal
Build a simple training-pair generation step that turns cleaned property data into a labeled narrative dataset for later fine-tuning.

## Scope
This version should stay lightweight and use the data we already have in the repo.

We do not currently have a real narrative source, so the MVP should use a local fixture or hand-written examples instead of trying to ingest external reports.

We will create:
- a small script that joins property rows to local narrative text examples
- a simple gold training-pair table for later model training
- a straightforward, repeatable workflow that can be run locally

## Proposed output table
Use the existing gold_narrative_training_pairs table shape with these core fields:
- pair_id
- property_id
- narrative_text
- buyer_purpose
- source_type
- consent_confirmed
- added_at
- is_seed_data

## Data approach
1. Read from gold_property_model_ready
2. Use a small local fixture of hand-written narrative examples for the prototype
3. Match each narrative example to a property row using address or a simple identifier
4. Insert the resulting pairs into gold_narrative_training_pairs
5. Make the process repeatable so reruns do not create duplicates

## Simplified rules
- Use only three buyer purpose values:
  - family
  - personal
  - investment
- Use a simple source type for the prototype:
  - seed_synthetic
- Set consent_confirmed to true for prototype/demo rows
- Keep the script simple; no full DVC workflow is required in this MVP slice

## Suggested implementation steps
1. Confirm the gold_narrative_training_pairs schema exists
2. Add a Python script, for example:
   - data_ai/scripts/build_narrative_training_pairs.py
3. Load property rows from gold_property_model_ready
4. Prepare a small local JSON/CSV fixture with hand-written narrative examples
5. Match each narrative to a property row using address
6. Insert rows into gold_narrative_training_pairs
7. Make the run idempotent by clearing or upserting existing seed rows for the same source/example

## MVP behavior
- A small dataset of narrative pairs is inserted into the gold training table
- Each row has a valid buyer_purpose and source_type
- Each row has consent_confirmed explicitly set
- Re-running the script does not duplicate rows

## Recommended first implementation slice
Keep it simple and practical:
- no complex consent workflow
- no DVC versioning in the first pass
- no train/validation/test split yet
- use a small local fixture of hand-written narrative examples for local demo purposes

That gives us a usable training-pair table that can support later fine-tuning work without overbuilding the initial version.
