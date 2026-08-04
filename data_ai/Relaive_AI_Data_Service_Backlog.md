# Relaive AI/Data Service — Detailed Engineering Backlog

## How to use this document
Every ticket below is written to be self-contained. If you are an engineer, or an LLM
acting as one, you should be able to pick up any single ticket and implement it correctly
without needing any other message, conversation, or context beyond this document. Each
ticket restates the relevant background, defines exact inputs/outputs, gives request/response
schemas where relevant, and lists concrete, testable acceptance criteria.

---

## 0. Project Context (read once, applies to every ticket below)

**What Relaive is:** Relaive is an AI-powered platform that generates professional property
appraisal narratives for Australian residential real estate. Real estate agents and valuers
enter property details, and the system produces a data-grounded written report (Vendor
Appraisal, Bank Valuation, Buyer Advisory, or Investment Report) suitable for sharing with
clients.

**What you are building:** You are **not** building the application backend (user accounts,
authentication, report storage, PDF export, billing). A separate backend team owns that. You
are building a **standalone AI/Data service** — a set of versioned HTTP APIs that the backend
calls to get AI-generated or data-derived results. Think of it as a black box: the backend
sends structured requests (e.g. "give me comparable sales for this address") and receives
structured JSON responses (e.g. a list of comparable properties with prices and match
scores). Your service owns all of the following, and the backend owns none of it:
- Scraping and storing raw property listing data
- Cleaning, standardizing, and aggregating that data
- Training and serving the fine-tuned language model
- Building and querying the RAG (Retrieval-Augmented Generation) index
- Generating narrative text and market commentary
- Checking generated narratives for factual consistency before returning them

**The data pipeline shape (medallion architecture):**
- **Bronze layer**: raw data exactly as scraped/fetched, no cleaning
- **Silver layer**: cleaned, deduplicated, standardized data
- **Gold layer**: joined, aggregated, model-ready data — this is what APIs and model
  training actually read from

**The five-step user workflow your APIs support (for context on why each API exists):**
1. User enters property details (address, type, bedrooms, etc.) — no AI call yet, this is
   backend-only
2. **AI Analysis** — backend calls your scoring API (SCP-429) to get four quality scores
3. **Comparables** — backend calls your comparables API (SCP-427) to get similar recent sales
4. **Market Intelligence** — backend calls your market intelligence API (SCP-428) to get
   suburb-level stats and commentary
5. **Report Generation** — backend calls your narrative generation API (SCP-430) to get the
   final written report text

**Ticket ID convention:** All ticket IDs (SCP-XXX) are stable identifiers. Branch names
should follow the pattern `SCP-XXX/short-description`. Epic D = data pipeline, Epic E =
model/RAG training, Epic F = the public-facing AI/Data service APIs.

---

## EPIC C — Serving Schema & Seed Data (build this first)

**Why this epic exists and comes first:** Everything in Epic D (scraping, cleaning,
joining) and Epic E (model training, RAG) takes real time to build correctly and produces
data that fluctuates in quality as it's being built. None of that should block having a
**working, demoable prototype** of the app. The trick is: the Epic F APIs only care that
certain tables exist with a certain shape and contain rows — they do not care whether
those rows came from a seed script or from the full production pipeline. So this epic
defines that shape up front and fills it with realistic fake data, so Epic F can be built
and demoed immediately. Later, Epic D/E simply replace the seed data with real pipeline
output in the same tables — **no API code changes required** when that swap happens.

**Tables this epic is responsible for creating and seeding** (these are the same table
names referenced later in Epic D/E — this epic creates them first with a fixed schema,
and Epic D/E populate them for real later):
- `gold_property_model_ready` (per-property structured data — see SCP-417 for full column
  list)
- `gold_suburb_aggregates` (suburb-level stats — see SCP-424 for full column list)
- `gold_narrative_training_pairs` (property + narrative pairs — see SCP-425 for full
  column list, though seed data does not need real consent tracking, see below)
- A RAG document/chunk table equivalent to `bronze_rag_documents` (see SCP-426), seeded
  with a handful of realistic fake market-commentary paragraphs instead of real scraped RBA
  PDFs

### [SCP-408] Define and create serving schema (DDL) for all Gold-layer tables
**Type:** Task · **Points:** 2 · **Priority:** Highest
**Branch:** `SCP-408/serving-schema-ddl`
**Dependencies:** none — this is the first ticket in the entire backlog

**Context:** Before any pipeline job or seed script can write data anywhere, the tables
themselves need to exist with a fixed, documented schema. This ticket only creates empty
tables (migrations/DDL) — it does not populate them with any data, real or fake. Every
other ticket in Epic D, E, and F assumes these tables already exist exactly as defined
here.

**What to build:**
1. Write and run database migrations (or table-creation scripts, depending on the chosen
   data store) that create the following tables with these exact columns:

   **`gold_property_model_ready`**
   | Column | Type | Notes |
   |---|---|---|
   | `property_id` | uuid, PK | |
   | `address` | varchar | |
   | `suburb` | varchar | |
   | `postcode` | varchar | |
   | `state` | varchar | |
   | `property_type` | varchar | |
   | `bedrooms` | int | |
   | `bathrooms` | int | |
   | `parking` | int | |
   | `land_size_sqm` | decimal | |
   | `price` | decimal | |
   | `sale_date` | date | |
   | `suburb_median_price_index` | decimal | joined macro feature |
   | `cash_rate_at_sale` | decimal | joined macro feature |

   **`gold_suburb_aggregates`**
   | Column | Type | Notes |
   |---|---|---|
   | `suburb` | varchar, part of PK | |
   | `period_start` | date, part of PK | |
   | `period_end` | date | |
   | `median_price` | decimal | |
   | `listing_count` | int | |
   | `avg_days_on_market` | decimal | |
   | `growth_pct_yoy` | decimal | |

   **`gold_narrative_training_pairs`**
   | Column | Type | Notes |
   |---|---|---|
   | `pair_id` | uuid, PK | |
   | `property_id` | uuid, FK → `gold_property_model_ready` | |
   | `narrative_text` | text | |
   | `buyer_purpose` | enum(`family`,`personal`,`investment`) | |
   | `source_type` | enum(`client_historical`,`llm_bootstrapped_reviewed`,`public_sample`,`seed_synthetic`) | note the added `seed_synthetic` value for this epic's use |
   | `consent_confirmed` | boolean | |
   | `added_at` | timestamp | |

   **`rag_document_chunks`**
   | Column | Type | Notes |
   |---|---|---|
   | `chunk_id` | uuid, PK | |
   | `source_document` | varchar | |
   | `publish_date` | date | |
   | `topic` | varchar | |
   | `chunk_text` | text | |
   | `embedding` | vector | nullable until an embedding job runs against it |

2. Document this exact schema at `/docs/schema/serving-tables.md`
3. Confirm all four tables exist and are queryable (even if empty) as the definition of
   "done" for this ticket

**Acceptance criteria (all must pass):**
- [ ] All four tables above exist in the database with exactly the columns and types
  specified
- [ ] Schema is documented at `/docs/schema/serving-tables.md` and matches the actual
  created tables
- [ ] Tables can be queried (returning zero rows) immediately after this ticket, with no
  errors

---

### [SCP-409] Build seed data generator for prototype demo
**Type:** Story · **Points:** 3 · **Priority:** Highest
**Branch:** `SCP-409/seed-data-generator`
**Dependencies:** SCP-408

**Context:** With the tables from SCP-408 in place, this ticket fills them with enough
realistic-looking fake data that a full demo of the app's five-step workflow (property
input → AI analysis → comparables → market intel → report) can run end-to-end and look
convincing, without any real scraping or model training having happened yet. This data is
explicitly fake and must be clearly marked as such so it can never be confused with real
production data later.

**What to build:**
1. A script (e.g. `seed_prototype_data.py`, runnable via a single documented command) that
   generates and inserts:
   - **At least 100** rows into `gold_property_model_ready`, spread across at least 5
     distinct suburbs, with realistic-looking addresses, prices, and attributes (can use a
     library like Faker for address/name generation, but prices and attributes should stay
     within realistic Australian residential ranges — e.g. don't generate a price of $12)
   - **At least 5** rows into `gold_suburb_aggregates` — one per suburb used above, with a
     realistic median price, listing count, days-on-market, and growth percentage
   - **At least 20** rows into `gold_narrative_training_pairs`, each linked to a real
     `property_id` from the seeded properties above, with `buyer_purpose` covering all
     three values, `source_type` set to `seed_synthetic`, and `consent_confirmed` set to
     `true` (seed data is synthetic, so consent is not a real concern, but the field must
     still be explicitly set, not left null) — narrative text can be hand-written or
     generated by any general-purpose LLM for this seed step specifically, since it is
     never used for real model training, only for demoing the "Report Generation" screen
   - **At least 10** rows into `rag_document_chunks` with plausible-sounding market
     commentary paragraphs (e.g. "The RBA has held the cash rate steady this quarter,
     citing..."), `source_document` set to something clearly marked as fake (e.g.
     `"seed_sample_commentary_1"`), so no one mistakes these for real RBA statements
2. The script must be **idempotent** — running it twice should not create duplicate rows
   (e.g. clear the tables first, or check for an existing seed marker before inserting)
3. Add a `is_seed_data` boolean column (or equivalent flag) to each of the four tables, set
   to `true` on every row this script inserts, so seed rows can be identified and bulk-
   deleted later once real pipeline data replaces them
4. Document, in the same PR, exactly how to run this script and how to clear seed data
   afterward (e.g. `python seed_prototype_data.py --clear` )

**Acceptance criteria (all must pass):**
- [ ] Running the seed script populates all four tables with the minimum row counts
  specified above
- [ ] Running the script twice does not create duplicate rows — verified by running twice
  and checking row counts are unchanged after the second run
- [ ] Every row inserted by this script has `is_seed_data = true`
- [ ] All generated prices, suburb names, and property attributes are realistic enough to
  demo convincingly (spot-checked in PR review, not automatable)
- [ ] A clear command exists to remove all seed data in one step

**Why this matters for later tickets:** Once this ticket is done, **every ticket in Epic F
can be built and demoed immediately**, against this seed data, without waiting for Epic D
or Epic E to be finished. When Epic D/E are eventually complete, their jobs write real rows
into these same tables (with `is_seed_data = false`), and the seed rows can be deleted —
the Epic F API code does not need to change at all when this swap happens, because it was
always just querying these tables, never a seed script directly.

---

## EPIC D — Data Pipeline

**Note:** Every table this epic populates (`gold_property_model_ready`,
`gold_suburb_aggregates`, `bronze_rag_documents`/`rag_document_chunks`) already exists as
of SCP-408. These tickets are about replacing seed data with real pipeline-derived data —
they do not need to create these tables again.

### [SCP-414] Ingestion job for primary listing source
**Type:** Story · **Points:** 3 · **Priority:** Highest
**Branch:** `SCP-414/ingestion-primary-source`
**Dependencies:** SCP-403, SCP-405 (assumed prior infra setup tickets, not detailed here)

**Context:** This is the first stage of the pipeline. It pulls raw property listing data from
an external real estate portal (realestate.com.au or Domain — pick one for MVP scope and
document which) and stores it completely unmodified. No cleaning, no deduplication, no
validation beyond "did the HTTP request succeed" happens here.

**What to build:** A scheduled job (cron or workflow-scheduled, document the schedule
chosen) that:
1. Sends requests to the chosen listing source's public listing pages or API
2. Parses each listing into a flat record with fields: `source` (string, e.g.
   `"realestate_com_au"` or `"domain"`), `address`, `suburb`, `postcode`, `state`,
   `property_type`, `bedrooms`, `bathrooms`, `parking`, `land_size_sqm`, `price`,
   `sale_date` or `listing_date`, `listing_description` (free text), `scraped_at`
   (timestamp of this run)
3. Writes each record as a new row to a Bronze-layer table (e.g. `bronze_listings`) —
   never overwrite or update existing rows, Bronze is append-only
4. If a response cannot be parsed (missing required field, malformed HTML/JSON, unexpected
   schema change from the source), log the raw response plus an error reason to a separate
   `bronze_listings_errors` table and continue processing the rest of the batch — do not
   crash the job
5. Respects a configurable rate limit (requests per second/minute, read from a config
   value, not hardcoded)

**Acceptance criteria (all must pass):**
- [ ] Job fetches listing data and writes raw output to a Bronze-layer table/path
- [ ] Malformed responses are logged to an errors table rather than crashing the job — verify
  by feeding the job a deliberately malformed response and confirming the job completes and
  the error is logged
- [ ] Job respects a configurable rate limit — test against a mock rate-limited endpoint
  (one that returns HTTP 429 if called too fast) and confirm the job produces zero unhandled
  429s in its logs
- [ ] Unit tests cover: (a) a successful fetch-and-parse of a well-formed listing, (b)
  handling of a malformed response without crashing

**Explicitly out of scope for this ticket:** deduplication (SCP-416), cleaning/standardization
(SCP-416), joining with other data (SCP-417). Do not add any of that logic here.

---

### [SCP-415] Ingestion job for macro data (ABS or RBA)
**Type:** Story · **Points:** 2 · **Priority:** High
**Branch:** `SCP-415/ingestion-macro-data`
**Dependencies:** SCP-414

**Context:** Same Bronze-layer pattern as SCP-414, but for macroeconomic/demographic
indicators rather than individual property listings. This data is suburb- or region-level,
not property-level (e.g. a median price index for a postcode, or the national cash rate).

**What to build:** A scheduled job that:
1. Fetches at least one macro indicator from a public source — for example, the ABS
   (Australian Bureau of Statistics) SA2/SA3/SA4 suburb-level datasets, or the RBA cash rate.
   Document exactly which indicator(s) and source(s) were chosen and why.
2. Writes output to a **separate** Bronze-layer table from `bronze_listings` (e.g.
   `bronze_macro_indicators`) — do not mix listing data and macro data in the same table
3. If the source data is delayed or unavailable at the scheduled run time (e.g. ABS hasn't
   published this quarter's figures yet), log this as a soft warning, not a job failure —
   the job should complete successfully and simply not append a new row for that period

**Acceptance criteria (all must pass):**
- [ ] Job fetches at least one macro indicator on a documented schedule (state the schedule
  explicitly in the PR description, e.g. "monthly, first business day")
- [ ] Missing/delayed source data is logged as a warning, not a hard failure — test by
  pointing the job at an endpoint that returns no new data and confirming the job exits
  successfully with a logged warning, not an exception
- [ ] Output lands in a table/path distinct from SCP-414's listing table

---

### [SCP-416] Data cleaning and standardization transform
**Type:** Story · **Points:** 3 · **Priority:** Highest
**Branch:** `SCP-416/data-cleaning-standardization`
**Dependencies:** SCP-414, SCP-415

**Context:** This is the Bronze → Silver transform. Raw listing data from SCP-414 often has
duplicate entries (the same property scraped twice, or listed on both source sites),
inconsistent field types (price as string `"$850,000"` vs. number `850000`), and occasional
garbage rows. This ticket cleans that up into a reliable Silver-layer table.

**What to build:** A transform job that:
1. Reads from `bronze_listings`
2. **Deduplicates** records where `address` (normalized — same casing, whitespace, and
   abbreviation handling, e.g. "St" vs "Street") and `sale_date`/`listing_date` match. Keep
   the most recently scraped version if duplicates are found.
3. **Standardizes field types**: prices become numeric (strip `$` and `,`), dates become
   ISO 8601 (`YYYY-MM-DD`), text fields are trimmed and null-coalesced (empty string → NULL,
   not stored as `""`)
4. Writes output to a Silver-layer table, e.g. `silver_listings_clean`
5. Documents the exact schema (column names, types, nullability) at
   `/docs/schema/clean.md` — this file must exist and be accurate as of the PR
6. Records that fail standardization (e.g. price field contains non-numeric garbage that
   can't be parsed even after cleanup) are **not dropped** — they are written to a
   `silver_listings_rejects` table with a `rejection_reason` column explaining why

**Acceptance criteria (all must pass):**
- [ ] Transform deduplicates records by address + listing date and standardizes field types
- [ ] The schema is documented at `/docs/schema/clean.md` and matches the actual output
  table
- [ ] Re-running the transform on the same raw input data does not create duplicate cleaned
  rows — test by running the job twice on identical input and confirming row count in
  `silver_listings_clean` is unchanged after the second run
- [ ] Records failing standardization are routed to a rejects table with a reason, not
  dropped silently — test with a deliberately malformed record and confirm it appears in
  `silver_listings_rejects` with a non-null reason

---

### [SCP-417] Join listing data with macro indicators into model-ready dataset
**Type:** Story · **Points:** 3 · **Priority:** Highest
**Branch:** `SCP-417/model-ready-dataset-join`
**Dependencies:** SCP-416

**Context:** This is the Silver → Gold transform. It combines per-property listing data
with the suburb/region-level macro indicators, so that every property record has all the
features a model would need in one row — no further joins required at inference time.

**What to build:** A transform job that:
1. Reads from `silver_listings_clean` and `bronze_macro_indicators` (or its cleaned
   equivalent, if SCP-416's scope was extended to cover macro data too — document which)
2. Joins each property record to the relevant macro indicator(s) by matching
   suburb/postcode and the closest available date (e.g. the most recent ABS figure as of
   the listing's sale date)
3. Output is **one row per property**, with all columns needed as model input: property
   attributes (bedrooms, bathrooms, land size, etc.), price, sale date, and the joined macro
   features (e.g. suburb median price index, cash rate at time of sale)
4. Writes to a Gold-layer table, e.g. `gold_property_model_ready`
5. Records missing a required field after the join (e.g. no macro data available for that
   suburb/date at all) are routed to a rejects table with a reason, not silently dropped or
   silently null-filled
6. After each run, automatically checks the null rate on required columns and confirms it
   is below 5% — log the actual percentage

**Acceptance criteria (all must pass):**
- [ ] Transform joins cleaned property records with macro data by suburb/postcode and date,
  producing one row per property with all model-input features populated
- [ ] Records missing required fields are routed to a rejects table with a reason
- [ ] Null rate on required columns is below 5%, and this is checked automatically (not
  manually) after each run, with the result logged

---

### [SCP-418] Add basic data validation checks to the pipeline
**Type:** Task · **Points:** 1 · **Priority:** Medium
**Branch:** `SCP-418/basic-data-validation`
**Dependencies:** SCP-417

**Context:** A safety net across the whole pipeline — catches silent data quality collapse
(e.g. the scraper source changed its page structure and is now returning near-empty
results) before it propagates into model training or live APIs.

**What to build:**
1. After SCP-417's job runs, compare the resulting row count in `gold_property_model_ready`
   against the previous run's row count. If it dropped by more than 50%, fail the pipeline
   run loudly (raise an alert/exception, do not let downstream jobs silently proceed on bad
   data)
2. Similarly, fail loudly if any required column is entirely NULL across all rows in the
   current run
3. Log every validation check's result (pass/fail, which check, timestamp) to a
   `pipeline_validation_log` table — this should be simple: one row per check per run

**Acceptance criteria (all must pass):**
- [ ] Pipeline run fails loudly (raises an alert, does not proceed silently) if row count
  drops more than 50% vs. the previous run
- [ ] Pipeline run fails loudly if a required column is entirely null
- [ ] Validation results are logged to `pipeline_validation_log` with a pass/fail per check

---

### [SCP-424] Build suburb-level aggregation transform
**Type:** Story · **Points:** 2 · **Priority:** High
**Branch:** `SCP-424/suburb-aggregation`
**Dependencies:** SCP-416

**Context:** The per-property Gold table (SCP-417) answers "what does this specific
property look like." But the Market Intelligence API (SCP-428, in Epic F) needs
suburb-level statistics — median price across the whole suburb, how many days properties
are typically on market, how much stock is currently listed. These numbers are computed by
aggregating many cleaned listings together, not by looking at one property at a time. This
is a separate transform from SCP-417 even though both read from the same Silver-layer
source.

**What to build:** A transform job that:
1. Reads from `silver_listings_clean`
2. Groups records by `suburb` + a rolling time window (e.g. trailing 12 months, document
   the exact window chosen)
3. Computes, per suburb per period: median sale price, count of listings (a proxy for
   "stock on market"), average days-on-market (if listing date and sale date are both
   available), and percentage price growth vs. the same period a year prior
4. Writes to a new table, e.g. `gold_suburb_aggregates`, with columns: `suburb`,
   `period_start`, `period_end`, `median_price`, `listing_count`,
   `avg_days_on_market`, `growth_pct_yoy`
5. Re-running for the same suburb/period does not create duplicate rows — either overwrite
   the existing row for that suburb/period or delete-then-insert, document which approach
   was taken

**Acceptance criteria (all must pass):**
- [ ] Aggregation produces suburb-level median price, listing count, days-on-market, and
  YoY growth for each suburb/period combination present in the source data
- [ ] Output lands in a table distinct from `gold_property_model_ready` (SCP-417)
- [ ] Re-running the transform for an already-processed period does not create duplicate
  rows for that suburb/period — test by running twice and checking row count

---

### [SCP-425] Build labeled narrative training set
**Type:** Story · **Points:** 3 · **Priority:** Highest
**Branch:** `SCP-425/labeled-narrative-training-set`
**Dependencies:** SCP-417

**Context:** This is the ticket that makes fine-tuning (SCP-420) actually possible. Everything
built so far (SCP-414 through SCP-417) produces **structured property data** — bedrooms,
price, suburb stats. None of it includes example narrative text. To fine-tune a language
model to write appraisal narratives, you need training pairs of the form
**(property input → professionally-written narrative)**. This ticket builds that paired
dataset. The narrative text itself must be sourced from outside this pipeline (e.g. real
historical appraisal reports obtained from a client/stakeholder with consent, or
LLM-drafted-then-human-reviewed narratives, or public sample reports) — sourcing and
obtaining that narrative text is a prerequisite that should be tracked as its own task if
not already done; this ticket assumes the raw narrative text already exists somewhere
(e.g. a folder of documents or a spreadsheet) and focuses on turning it into a structured,
versioned training set.

**What to build:**
1. A process (script or job) that takes a raw collection of narrative texts, each with:
   the property it describes (enough info to match it to a row in
   `gold_property_model_ready` — e.g. address), the narrative text itself, and a
   `buyer_purpose` label that must be one of exactly three values: `"family"`,
   `"personal"`, or `"investment"`
2. Joins each narrative to its matching property row from SCP-417's output by address
3. For each resulting pair, records a `source_type` field, which must be one of:
   `"client_historical"`, `"llm_bootstrapped_reviewed"`, or `"public_sample"`
4. Records a `consent_confirmed` boolean — `true` only if there is documented permission to
   use this specific narrative for model training. If this cannot be confirmed, the value
   must be `false`, never left null or assumed true.
5. Writes the joined result to a training dataset table/file, e.g.
   `gold_narrative_training_pairs`, with columns: `pair_id`, `property_id` (FK to
   `gold_property_model_ready`), `narrative_text`, `buyer_purpose`, `source_type`,
   `consent_confirmed`, `added_at`
6. Versions this dataset using DVC (or an equivalent, document which tool was used), with
   commit messages describing what changed between versions
7. Splits the dataset into train/validation/test sets at an 80/10/10 ratio — document how
   the split was performed (e.g. random with a fixed seed for reproducibility) so it can be
   regenerated identically
8. **Any row where `consent_confirmed` is `false` must be excluded from the train/validation/
   test split by default.** Write a test that adds a deliberately unconfirmed-consent row and
   confirms it does not appear in any of the three output splits.

**Acceptance criteria (all must pass):**
- [ ] Dataset joins model-ready property records with sourced narrative text and a valid
  `buyer_purpose` label (one of the three exact values above — reject/flag anything else)
- [ ] Every row has a `source_type` and a `consent_confirmed` value; neither is ever null
- [ ] Rows with `consent_confirmed = false` are excluded from the train/val/test split —
  verified by test
- [ ] Dataset is versioned via DVC (or documented equivalent) with a reproducible 80/10/10
  split

**This ticket blocks SCP-420** — do not begin SCP-420 until this dataset exists and passes
its acceptance criteria.

---

### [SCP-426] Ingest and chunk RBA/macro documents for RAG
**Type:** Story · **Points:** 2 · **Priority:** High
**Branch:** `SCP-426/rag-document-ingestion`
**Dependencies:** SCP-415

**Context:** Separate from structured macro indicators (SCP-415), this ticket handles
**unstructured text documents** — RBA (Reserve Bank of Australia) monetary policy
statements and housing market reports, published as PDFs. These aren't used to train the
model's weights; instead, they're chunked, embedded, and stored so that at inference time
the model can retrieve and quote from them when writing market commentary (this is the
"RAG" — Retrieval-Augmented Generation — part of the system, built out fully in SCP-421).
This ticket only covers getting the documents in and chunked, not the embedding/indexing
itself.

**What to build:**
1. A job that fetches RBA statements and housing market report PDFs from their public
   source (document the exact source URLs/feed used)
2. Extracts text from each PDF
3. Splits each document's text into chunks using LangChain's text splitting utilities —
   document the chunk size and overlap chosen and why
4. Tags each chunk with metadata: `source_document` (filename or title), `publish_date`,
   and a rough `topic` label if easily derivable (e.g. "interest rates", "housing supply") —
   topic tagging can be simple keyword-based, it doesn't need to be a model call
5. Writes chunks with metadata to a Bronze-layer table/path distinct from
   `bronze_listings` and `bronze_macro_indicators`, e.g. `bronze_rag_documents`
6. If a PDF cannot be parsed (corrupted file, scanned image with no extractable text, unexpected
   format), log it to an errors table with the reason and continue processing the rest of the
   batch — do not crash the job

**Acceptance criteria (all must pass):**
- [ ] Job fetches RBA/housing report PDFs, extracts text, and splits into chunks using
  LangChain
- [ ] Output (chunks + metadata) lands in a Bronze-layer table/path distinct from the
  listing and macro-indicator tables
- [ ] Malformed or unparseable PDFs are logged to an errors table, not silently dropped and
  not crashing the job — test with a deliberately corrupted/unparseable PDF

---

## EPIC E — Model & RAG

### [SCP-419] Run baseline model evaluation (single chosen model)
**Type:** Spike · **Points:** 2 · **Priority:** High
**Branch:** `SCP-419/baseline-model-eval`
**Dependencies:** SCP-417

**Context:** Before spending time fine-tuning any model, establish a baseline: how well
does an off-the-shelf, non-fine-tuned model perform at writing property narratives, with no
extra training at all? This number is what the fine-tuning step (SCP-420) must beat to
prove the fine-tuning was worthwhile.

**What to build:**
1. Choose one base model for this evaluation (e.g. Llama 3 8B or Mistral 7B — pick one,
   document which and why)
2. Write a documented prompt template that takes property attributes (from
   `gold_property_model_ready`) as input and asks the model to generate a narrative
3. Run this prompt against the model in both zero-shot (no examples given) and few-shot
   (a small number of example narratives included in the prompt) settings, using a
   held-out set of **at least 30** property narratives (from SCP-425's validation split,
   once that exists — if run before SCP-425 is ready, use whatever labeled narrative
   sample is available and clearly note this in the report)
4. Score the generated outputs against the real narratives using BERTScore and ROUGE-L
5. Record average inference latency per generation
6. Write all results (scores, latency, prompt template used, model version) to
   `/eval/baseline-report.md`

**Acceptance criteria (all must pass):**
- [ ] One base model is evaluated against ≥30 held-out property narratives using a
  documented prompt template
- [ ] Results (BERTScore or ROUGE-L, average latency) are recorded in
  `/eval/baseline-report.md`
- [ ] Re-running the evaluation reproduces the recorded metrics within ±5% — test by running
  it twice and comparing

---

### [SCP-420] Build LoRA fine-tuning pipeline
**Type:** Story · **Points:** 5 · **Priority:** Highest
**Branch:** `SCP-420/lora-finetuning-pipeline`
**Dependencies:** SCP-419, SCP-425

**Context:** This is where the model actually learns to write appraisal narratives, using
the labeled training pairs built in SCP-425 (not just the raw structured data from
SCP-417 — the training set must include narrative text and `buyer_purpose` labels, or
this ticket cannot proceed). LoRA (Low-Rank Adaptation) is used instead of full
fine-tuning to reduce compute cost: instead of updating every parameter in the base model,
LoRA adds a small number of new trainable parameters (low-rank matrices) and only updates
those, leaving the original model weights frozen.

**What to build:**
1. A fine-tuning job that loads the same base model chosen in SCP-419
2. Applies LoRA (or QLoRA, if quantization is also needed for memory reasons — document
   which was chosen and why) via the Hugging Face PEFT library
3. Trains on the **training split** of `gold_narrative_training_pairs` (from SCP-425),
   using `buyer_purpose` as a conditioning input so the model learns to vary its narrative
   style for family / personal / investment contexts
4. Validates on the **validation split** during training, logging metrics after each epoch
5. Logs all training runs (hyperparameters, metrics per epoch, final checkpoint location)
   to Weights & Biases or MLflow — document which was chosen
6. The entire job must be runnable end-to-end via a single documented command (e.g.
   `python train_lora.py --config config.yaml`) — document this command in the PR
7. After training, evaluate the fine-tuned model on the same held-out set used in SCP-419
   and confirm it shows measurable improvement over the SCP-419 baseline on at least one
   metric (BERTScore or ROUGE-L)
8. Document the training time taken and confirm it fits within a stated budget (e.g. under
   3 hours on a single GPU instance) — if it exceeds this, document why and what was done
   about it (e.g. reduced epoch count, smaller LoRA rank)

**Acceptance criteria (all must pass):**
- [ ] Fine-tuning job runs the chosen model via LoRA/PEFT on the labeled training set from
  SCP-425 (not the unlabeled SCP-417 dataset alone)
- [ ] Job is runnable end-to-end via a single documented command
- [ ] Post-training evaluation shows measurable improvement over the SCP-419 baseline on at
  least one metric, with numbers recorded
- [ ] Training completes within a documented time budget, or the budget overrun and
  mitigation is documented

---

### [SCP-421] Build RAG index and validate basic retrieval
**Type:** Story · **Points:** 3 · **Priority:** Highest
**Branch:** `SCP-421/rag-index-retrieval`
**Dependencies:** SCP-417, SCP-426

**Context:** RAG lets the model pull in real, current facts at the moment it generates
text, rather than relying only on what it learned during fine-tuning (which can go stale).
This system needs **two separate retrievable collections**, because they answer different
kinds of questions: (1) property/comparable-sales data, for "what similar properties sold
nearby and for how much," and (2) RBA/market-commentary text chunks, for "what's the
current interest rate outlook." Build both as distinct indexes or clearly namespaced
collections within one vector store — do not merge them into a single undifferentiated
index, since mixing property records with prose paragraphs will hurt retrieval quality for
both.

**What to build:**
1. Choose a sentence embedding model (document which) and a vector store (document which
   — e.g. a GCP-hosted vector database)
2. Build **Index A**: embeds each property record from `gold_property_model_ready`
   (SCP-417) — embedding should be built from a text representation of the property's key
   attributes (suburb, price, bed/bath, sale date)
3. Build **Index B**: embeds each text chunk from `bronze_rag_documents` (SCP-426)
4. Write a retrieval function for each index that takes a query and returns the top-K
   matches
5. Create a labeled test set of **at least 15** query examples with known correct/relevant
   results (a mix of property-comparable queries for Index A and market-commentary queries
   for Index B)
6. Measure Recall@5 against this test set for each index separately
7. Record results in `/docs/rag-eval-report.md`
8. Test the edge case where a query has no nearby/relevant matches at all (e.g. a property
   in a suburb with zero comparable sales, or a query about a topic not covered in any RBA
   document) — confirm the retrieval function returns an **empty result set**, not an error
   or exception

**Acceptance criteria (all must pass):**
- [ ] Both indexes (property comparables and RAG documents) are built from a documented
  embedding model and vector store
- [ ] Recall@5 measured against ≥15 labelled test queries is ≥0.6 for each index, recorded
  in `/docs/rag-eval-report.md`
- [ ] A query with no nearby/relevant comparables returns an empty result set, not an error
  — verified by a specific test case

---

### [SCP-422] Build basic factual-consistency check for generated narratives
**Type:** Story · **Points:** 3 · **Priority:** High
**Branch:** `SCP-422/factual-consistency-check`
**Dependencies:** SCP-420, SCP-421

**Context:** This is a quality gate that runs on every narrative before it's allowed to
reach a user. "Factual consistency" here means: every specific claim in the generated
narrative (a price, a suburb statistic, a market comment) must be traceable back to
something actually retrieved from the RAG index or the comparable sales data used to
generate it. If the model states a fact that wasn't in its retrieved context, that's a
hallucination and must be flagged.

**What to build:**
1. A check that, given a generated narrative plus the retrieved context (comparables +
   RAG chunks) used to produce it, extracts factual claims from the narrative (e.g. via
   simple pattern matching for numbers/prices/percentages, or a lightweight secondary model
   call — document the method chosen)
2. For each extracted claim, verifies whether it appears in or is directly supported by the
   retrieved context
3. Runs this check against **at least 20** held-out generated narratives
4. Outputs a pass/fail result against a documented threshold (e.g. "fail if more than 15%
   of narratives have at least one unsupported claim") — document the exact threshold chosen
5. Include one deliberately-corrupted test narrative (i.e. one with a fabricated price or
   statistic not present in its context) in the test set, and confirm the check correctly
   flags it as failing
6. **This check must run before any model version is promoted from Staging 1 to Staging
   2** (this blocks a separate deployment ticket, SCP-411, for any model-affecting change —
   if SCP-411 doesn't exist yet in your tracker, note this dependency explicitly wherever
   deployment promotion is defined)

**Acceptance criteria (all must pass):**
- [ ] Check runs the fine-tuned model + RAG against ≥20 held-out inputs and flags
  narratives containing claims unsupported by retrieved context
- [ ] Outputs a clear pass/fail against a documented threshold
- [ ] A deliberately-corrupted test narrative is correctly flagged as failing
- [ ] This check is wired as a required gate before Staging 1 → Staging 2 promotion for any
  model-affecting change

---

## EPIC F — AI/Data Service APIs

**Context for this entire epic:** Every ticket in this epic produces a versioned HTTP
endpoint that the application backend calls. You do not need to know anything about how
the backend stores its data, handles users, or renders its UI — you only need to honor the
request/response contract defined in each ticket. All endpoints should be prefixed
`/v1/` so that future breaking changes can be introduced as `/v2/` without disrupting the
backend. All endpoints should return JSON. All endpoints should return a `5xx` error with a
JSON body `{"error": "<description>"}` on internal failure, and should never crash without
returning a response.

**Prototype vs. production data source — read this before starting any ticket below:**
Every ticket below lists Epic D/E tickets as dependencies (e.g. SCP-417, SCP-421) because
that's where the tables get populated with real, production-quality data. **In practice,
you can and should start building and demoing these APIs as soon as SCP-409 (seed data) is
done**, querying the exact same tables the Epic D/E jobs will eventually populate for real.
The endpoint code should never know or care whether a given row in
`gold_property_model_ready`, `gold_suburb_aggregates`, `gold_narrative_training_pairs`, or
`rag_document_chunks` came from the seed script or the real pipeline — it just queries the
table. This means: build against seed data now for the working prototype, and the same
code keeps working unmodified once Epic D/E replace seed rows with real ones. Do not write
any logic that special-cases `is_seed_data = true` inside the API layer itself — that flag
exists only for the data-management side (SCP-409's cleanup step), not for API behavior.

---

### [SCP-427] Comparable sales & price estimate API
**Type:** Story · **Points:** 3 · **Priority:** Highest
**Branch:** `SCP-427/comparables-api`
**Dependencies:** SCP-417, SCP-421

**Context:** This is the API the backend calls during the "Comparables" step of the user
workflow. Given a property address (and optionally other attributes), it returns a list of
similar recently-sold properties and an estimated value range for the subject property.

**Endpoint:** `GET /v1/properties/comparables`

**Query parameters:**
| Name | Type | Required | Description |
|---|---|---|---|
| `address` | string | yes | Full address of the subject property |
| `radius_km` | number | no, default `5` | Search radius for comparable properties |
| `limit` | integer | no, default `10` | Max number of comparables to return |

**Successful response (`200`):**
```json
{
  "subject_address": "12 Example St, Melbourne VIC 3000",
  "comparables": [
    {
      "address": "125 Smith Street, Melbourne VIC",
      "sale_price": 840000,
      "sale_date": "2026-07-01",
      "distance_km": 0.2,
      "match_score_pct": 95,
      "bedrooms": 3,
      "bathrooms": 2,
      "parking": 2,
      "land_size_sqm": 450
    }
  ],
  "estimated_value_low": 820000,
  "estimated_value_high": 860000
}
```

**Empty-result response (`200`, not an error):** When no comparables are found within
`radius_km`, return:
```json
{
  "subject_address": "12 Example St, Melbourne VIC 3000",
  "comparables": [],
  "estimated_value_low": null,
  "estimated_value_high": null
}
```

**Implementation notes:**
- Comparable results come from **Index A** (built in SCP-421), filtered by `radius_km`
  and ranked by `match_score_pct`
- Estimated value range is computed from the returned comparables (e.g. min/max or a
  percentile band of their sale prices) — document the exact method chosen
- If `address` cannot be geocoded/matched to a known location at all, return `404` with
  `{"error": "address not found"}`

**Acceptance criteria (all must pass):**
- [ ] Endpoint returns comparable sales and an estimated value range for a valid address
  with known comparables nearby
- [ ] Endpoint returns an empty `comparables` array (with `200`, not an error) when no
  comparables exist within `radius_km`
- [ ] Endpoint returns `404` with a documented error body for an address that cannot be
  matched at all
- [ ] P95 response time is documented and tested against a stated target (e.g. under 2
  seconds), measured across at least 50 test requests
- [ ] Endpoint is versioned under `/v1/`

---

### [SCP-428] Market intelligence API
**Type:** Story · **Points:** 2 · **Priority:** High
**Branch:** `SCP-428/market-intelligence-api`
**Dependencies:** SCP-424, SCP-421, SCP-426

**Context:** This is the API the backend calls during the "Market Intelligence" step. Given
a suburb, it returns quantitative stats plus a short AI-generated narrative paragraph about
current market conditions, grounded in retrieved RBA/market documents.

**Endpoint:** `GET /v1/suburbs/{suburb}/intelligence`

**Path parameters:**
| Name | Type | Required | Description |
|---|---|---|---|
| `suburb` | string | yes | Suburb name (URL-encoded), e.g. `Melbourne` |

**Successful response (`200`):**
```json
{
  "suburb": "Melbourne",
  "median_house_price": 845000,
  "growth_12_month_pct": 8.5,
  "rental_yield_pct": 3.8,
  "days_on_market": 28,
  "stock_on_market": 142,
  "ai_market_narrative": "The suburb is experiencing strong growth driven by...",
  "data_completeness": "full"
}
```

**Partial-data response (`200`):** If suburb-level aggregates (from SCP-424) exist but are
based on a small/unreliable sample, or if some fields cannot be computed, return the fields
that are available and set others to `null`, with `data_completeness` set to `"partial"`:
```json
{
  "suburb": "SmallTownName",
  "median_house_price": 610000,
  "growth_12_month_pct": null,
  "rental_yield_pct": null,
  "days_on_market": null,
  "stock_on_market": 3,
  "ai_market_narrative": null,
  "data_completeness": "partial"
}
```

**Not-found response:** If the suburb has no data at all in `gold_suburb_aggregates`,
return `404` with `{"error": "no data available for this suburb"}`.

**Implementation notes:**
- Quantitative fields come from `gold_suburb_aggregates` (SCP-424)
- `ai_market_narrative` is generated by retrieving relevant chunks from **Index B**
  (SCP-426/SCP-421) for this suburb/region and having the fine-tuned model (or a
  general-purpose model, if narrative generation for this field doesn't require the
  fine-tuned model — document which is used) summarize current conditions
- Define and document the exact threshold for "partial" vs "full" data completeness (e.g.
  fewer than 10 underlying listings in the aggregation window = partial)

**Acceptance criteria (all must pass):**
- [ ] Endpoint returns full suburb statistics and an AI narrative for a suburb with
  sufficient underlying data
- [ ] Endpoint returns a `partial` response with `null` fields (not fabricated values) when
  underlying data is thin, per a documented threshold
- [ ] Endpoint returns `404` for a suburb with no data at all
- [ ] Endpoint is versioned under `/v1/`

---

### [SCP-429] AI property analysis scoring API
**Type:** Story · **Points:** 2 · **Priority:** High
**Branch:** `SCP-429/property-analysis-api`
**Dependencies:** SCP-417, SCP-420

**Context:** This is the API the backend calls during the "AI Analysis" step — the one that
produces the four scored progress bars (Location Quality, Property Condition, Market
Demand, Growth Potential) and a short summary paragraph.

**Endpoint:** `POST /v1/properties/analyze`

**Request body:**
```json
{
  "address": "12 Example St, Melbourne VIC 3000",
  "property_type": "house",
  "bedrooms": 3,
  "bathrooms": 2,
  "parking": 2,
  "land_size_sqm": 450,
  "zoning": "residential"
}
```

**Successful response (`200`):**
```json
{
  "location_quality_score": 92,
  "property_condition_score": 85,
  "market_demand_score": 88,
  "growth_potential_score": 78,
  "ai_summary_text": "This 3-bedroom house is located in a highly desirable area with strong market fundamentals...",
  "model_version": "relaive-lora-v1.2"
}
```

**Validation error response (`400`):** If required fields are missing (e.g. no `address`),
return:
```json
{"error": "missing required field: address"}
```

**Implementation notes:**
- All four scores must be integers in the range 0–100
- `model_version` must reflect the actual model/adapter version used to produce this
  response, so the backend can log/audit which version generated which score (this ties
  into SCP-431's version routing)
- Calling this endpoint twice with **identical** input should produce scores within a
  small, documented tolerance of each other (e.g. ±3 points) — if the model is
  non-deterministic by design (e.g. sampling-based generation), document the tolerance and
  why exact reproducibility isn't expected

**Acceptance criteria (all must pass):**
- [ ] Endpoint returns four integer scores (0–100) plus a summary and model version for a
  valid property input
- [ ] Endpoint returns `400` with a clear error message when required fields are missing
- [ ] Repeated identical calls produce scores within a documented tolerance — verified by
  test with at least 5 repeated calls on identical input
- [ ] Endpoint is versioned under `/v1/`

---

### [SCP-430] Narrative generation API
**Type:** Story · **Points:** 5 · **Priority:** Highest
**Branch:** `SCP-430/narrative-generation-api`
**Dependencies:** SCP-420, SCP-421, SCP-422

**Context:** This is the most important endpoint in the system — it's called during the
final "Report Generation" step and produces the actual written appraisal narrative the
user will review, edit, and export. Internally, this endpoint orchestrates several of the
other pieces built in this backlog: it pulls property data, retrieves comparables and RAG
context, calls the fine-tuned model, and **must** run the factual-consistency check (SCP-
422) before returning a result — a narrative that fails the check must never be silently
returned as if it were fine.

**Endpoint:** `POST /v1/reports/generate-narrative`

**Request body:**
```json
{
  "property_id": "a1b2c3d4-property-uuid",
  "address": "12 Example St, Melbourne VIC 3000",
  "template_type": "vendor_appraisal",
  "buyer_purpose": "family"
}
```

- `template_type` must be one of exactly: `"vendor_appraisal"`, `"bank_valuation"`,
  `"buyer_advisory"`, `"investment_report"`
- `buyer_purpose` must be one of exactly: `"family"`, `"personal"`, `"investment"`

**Successful response (`200`, factual-consistency check passed):**
```json
{
  "narrative_text": "Executive Summary: This 3-bedroom house represents a solid investment opportunity...",
  "estimated_value_low": 820000,
  "estimated_value_high": 860000,
  "confidence_score_pct": 87,
  "flagged": false,
  "model_version": "relaive-lora-v1.2",
  "rag_index_version": "relaive-rag-index-v1.0"
}
```

**Flagged response (`200`, factual-consistency check failed):** The endpoint still
returns `200` (this is not a server error — it's a valid outcome that the backend must
handle), but marks the result as flagged so the backend can decide not to show it to the
user without review, or to regenerate:
```json
{
  "narrative_text": "Executive Summary: This property recently sold for $1,200,000 based on...",
  "estimated_value_low": 820000,
  "estimated_value_high": 860000,
  "confidence_score_pct": 41,
  "flagged": true,
  "unsupported_claims": ["recently sold for $1,200,000"],
  "model_version": "relaive-lora-v1.2",
  "rag_index_version": "relaive-rag-index-v1.0"
}
```

**Validation error response (`400`):** If `template_type` or `buyer_purpose` is not one of
the exact allowed values, or `property_id`/`address` is missing:
```json
{"error": "invalid template_type: must be one of vendor_appraisal, bank_valuation, buyer_advisory, investment_report"}
```

**Implementation notes:**
- Internal flow: (1) load property data, (2) retrieve comparables via SCP-427's
  underlying logic, (3) retrieve relevant RAG chunks via Index B, (4) construct the prompt
  including `template_type` and `buyer_purpose` as conditioning, (5) call the fine-tuned
  model, (6) run the SCP-422 factual-consistency check against the output, (7) return the
  result with `flagged` set accordingly
- `model_version` and `rag_index_version` must always be included in the response so the
  backend can log exactly which versions produced which report — this is required for
  audit purposes, not optional
- Never omit `flagged` from the response, even when `false`

**Acceptance criteria (all must pass):**
- [ ] Endpoint returns a generated narrative, value range, confidence score, and
  `flagged: false` for a valid request that passes the factual-consistency check
- [ ] Endpoint returns `flagged: true` plus a list of `unsupported_claims` when the
  factual-consistency check fails — verified with a test case designed to trigger this
- [ ] Endpoint returns `400` for an invalid `template_type` or `buyer_purpose` value
- [ ] Response always includes `model_version` and `rag_index_version`
- [ ] Endpoint is versioned under `/v1/`

---

### [SCP-431] Model/index version routing
**Type:** Task · **Points:** 1 · **Priority:** Medium
**Branch:** `SCP-431/model-version-routing`
**Dependencies:** SCP-422

**Context:** As new fine-tuned model versions and RAG index versions are produced over
time, the AI/Data service needs to control which version is "live" without requiring the
application backend to know or care. The backend should only ever call the stable
`/v1/...` endpoints defined above — version switching happens entirely inside this
service.

**What to build:**
1. The AI/Data service reads which model checkpoint and which RAG index version are
   currently active from environment variables (e.g. `ACTIVE_MODEL_VERSION`,
   `ACTIVE_RAG_INDEX_VERSION`) — never hardcode a version string anywhere in the request-
   handling code
2. Updating these environment variables and redeploying the service switches the active
   model/index with **zero changes** to any endpoint code, request schema, or response
   schema
3. Confirm that different environments (Staging 1, Staging 2, Production — or whatever
   environment names this project uses) can have different values for these variables
   without any code differences between environments

**Acceptance criteria (all must pass):**
- [ ] Service reads active model/RAG index version from environment variables, never
  hardcoded
- [ ] Updating the env var and redeploying switches the active model with no code change —
  verified by changing the value, redeploying, and confirming `model_version` in SCP-430's
  response reflects the new value
- [ ] Env var values differ correctly across at least two environments without code changes
  between them

---

## Summary dependency graph

**Build order for a working prototype (fastest path to a demoable app):**
```
SCP-408 (schema) ──> SCP-409 (seed data) ──> SCP-427, SCP-428, SCP-429, SCP-430 (all buildable now)
                                              SCP-431 can wait, or be stubbed with a single
                                              hardcoded version string until SCP-422 exists
```

**Full production path (replaces seed data with real pipeline + trained model, no API
changes required):**
```
SCP-408 ──> SCP-409 (prototype ready here)

SCP-414 ─┬─> SCP-416 ──> SCP-417 ─┬─> SCP-419 ──> SCP-420 ──> SCP-422 ──> SCP-431
SCP-415 ─┘        │                ├─> SCP-424
                   │                ├─> SCP-425 ──> SCP-420
                   └─> SCP-426 ─────┴─> SCP-421 ──> SCP-422

SCP-427 depends on: SCP-417, SCP-421   (or SCP-409 for prototype)
SCP-428 depends on: SCP-424, SCP-421, SCP-426   (or SCP-409 for prototype)
SCP-429 depends on: SCP-417, SCP-420   (or SCP-409 for prototype)
SCP-430 depends on: SCP-420, SCP-421, SCP-422   (or SCP-409 for prototype)
SCP-431 depends on: SCP-422
```
