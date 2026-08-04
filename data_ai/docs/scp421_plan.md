# SCP-421 plan: context retrieval and grounding layer

## Goal
Build a lightweight retrieval-and-grounding layer for buyer-intent narrative generation. The first version should help the system generate a property narrative using evidence from existing structured data rather than relying only on general model knowledge.

The MVP should support:
- subject-property context from the user’s selected property
- comparable sales context from historical sales data
- suburb-level market context from suburb summaries
- optional market commentary context from existing RAG rows

This should stay intentionally simple and should not introduce a vector database or a full document-search stack in the MVP.

## Product framing
For this MVP, we assume the system already has an estimated price for the subject property available from the broader valuation workflow. The job of SCP-421 is not to invent that price from scratch; it is to use that existing estimated price together with retrieved evidence to generate a grounded narrative.

That means the workflow should be:
1. the user provides the subject property details
2. the system retrieves supporting evidence
3. the system uses the existing estimated price alongside the retrieved context
4. the narrative is generated using that grounded evidence

## MVP design
Use a deterministic retrieval service that accepts a subject-property input and returns a compact JSON payload for prompting.

### Inputs
The service should take:
- property address
- suburb
- postcode
- state
- property type
- bedrooms
- bathrooms
- parking
- land size
- buyer purpose or report intent
- optionally a selected property identifier or listing reference

The user does not need to provide a known sale price.

### Output
The retrieval service should return a structure like:

```json
{
  "subject_property": {
    "address": "12 Collins Street",
    "suburb": "Melbourne",
    "property_type": "house",
    "bedrooms": 2,
    "bathrooms": 1,
    "parking": 1,
    "land_size_sqm": 180
  },
  "estimated_value": 840000,
  "comparables": [
    {
      "address": "10 Collins Street",
      "sale_price": 820000,
      "sale_date": "2026-06-01",
      "bedrooms": 2,
      "bathrooms": 1,
      "parking": 1,
      "land_size_sqm": 170
    }
  ],
  "suburb_context": {
    "suburb": "Melbourne",
    "period_start": "2026-07-01",
    "period_end": "2026-07-31",
    "mean_price": 900000,
    "listing_count": 18,
    "growth_pct_mom": 3.4
  },
  "market_context": [
    {
      "source_document": "market-note",
      "topic": "market commentary",
      "chunk_text": "Buyer demand remains steady in inner-city locations."
    }
  ]
}
```

## Implementation approach

### 1. Add a retrieval module
Create a new module at:
- [data_ai/ingestion/context_retrieval.py](../ingestion/context_retrieval.py)

This module should expose a function such as:
- `retrieve_context_for_property(property_row, limit=5)`

The function should:
1. Query [data_ai/database/ddl/001_serving_schema.sql](../database/ddl/001_serving_schema.sql) backing tables through psycopg.
2. Pull comparable properties from `gold_property_model_ready`.
3. Pull the latest suburb summary from `gold_suburb_aggregates`.
4. Optionally pull recent rows from `rag_document_chunks` as supporting context.
5. Derive an estimated value range from the retrieved comparable sales and suburb context.
6. Return an empty result set rather than raising an error when there are no relevant matches.

### 2. Use existing data sources, not a new vector stack
The first implementation should rely on the current tables:
- `gold_property_model_ready` for comparable sales
- `gold_suburb_aggregates` for suburb market summaries
- `rag_document_chunks` for optional market commentary snippets

No embedding index is required for this ticket.

### 3. Keep the matching logic simple and deterministic
Use a straightforward heuristic ranking:
- same suburb gets the strongest weight
- same property type gets a strong boost
- similar bedrooms / bathrooms / parking get a boost
- similar land size gets a boost
- recent sales get a boost

A simple weighted score is sufficient for the MVP.

### 4. Use the existing estimated price in the prompt
The system should take the existing estimated price from the broader workflow and include it as part of the grounded context passed into the prompt. The retrieval layer does not need to compute a new estimate in this ticket.

### 5. Wire retrieval into the narrative flow
Update the baseline evaluator in:
- [data_ai/ingestion/evaluate_baseline_model.py](../ingestion/evaluate_baseline_model.py)

The evaluator should:
1. Retrieve context for the selected property.
2. Use the existing estimated price from the subject-property context.
3. Pass the retrieved context and the estimated price into the prompt template.
4. Generate the narrative using the same local Ollama path already in place.

This keeps the baseline workflow grounded without requiring a different model or a new service boundary.

## Proposed files to add or update
- New: [data_ai/ingestion/context_retrieval.py](../ingestion/context_retrieval.py)
- Update: [data_ai/ingestion/evaluate_baseline_model.py](../ingestion/evaluate_baseline_model.py)
- New: [data_ai/tests/unit/context_retrieval_test.py](../tests/unit/context_retrieval_test.py)
- New: [data_ai/docs/context-retrieval-report.md](../docs/context-retrieval-report.md)

## Test plan
Add unit tests for at least these cases:
1. A property with nearby comparables returns ranked comparables.
2. A property in a suburb with suburb summary data returns suburb context.
3. A property with no nearby comparables returns an empty comparable list rather than an exception.
4. A query with no suburb summary rows returns an empty suburb context payload rather than an exception.
5. A small labelled test set of at least 15 property queries should be used to measure hit-rate or top-k relevance.

### Recommended labelled test set
Store a small fixture file such as:
- [data_ai/docs/fixtures/context_retrieval_cases.json](../docs/fixtures/context_retrieval_cases.json)

Each test case should include:
- a property identifier or address
- expected comparable matches
- expected suburb-context presence or absence
- expected value-estimation behavior

## Measurement approach
Create a report at:
- [data_ai/docs/context-retrieval-report.md](../docs/context-retrieval-report.md)

The report should capture:
- number of labelled queries tested
- hit-rate for comparable retrieval
- hit-rate for suburb-context retrieval
- one explicit case showing the empty-result behavior

## Acceptance criteria
- Comparable-sales retrieval is implemented for narrative generation.
- Suburb-context retrieval is implemented for narrative generation.
- The system includes the existing estimated price alongside retrieved context in the narrative prompt.
- The retrieval service returns an empty result set for a property with no nearby matches, not an exception.
- At least 15 labelled test queries are covered and the results are recorded in the report.
- The baseline evaluator can consume the retrieved context and render it into the prompt payload.

## Suggested implementation sequence
1. Add the context retrieval module and SQL queries.
2. Add deterministic scoring for comparables and suburb context.
3. Add unit tests for retrieval behavior.
4. Wire the retrieval output and the existing estimated price into the evaluation prompt.
5. Write the retrieval report and confirm the empty-result edge case.
