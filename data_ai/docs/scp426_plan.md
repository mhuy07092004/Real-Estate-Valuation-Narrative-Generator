# SCP-426 plan: RAG document ingestion and chunking

## Goal
Create a lightweight MVP for RAG document ingestion using the data and table shape we already have in place. The first version should be practical and demo-friendly, not a full production-grade PDF ingestion pipeline.

## Current state we can build on
- The serving schema already has a RAG table: [data_ai/database/ddl/001_serving_schema.sql](../database/ddl/001_serving_schema.sql)
- The API already reads from [data_ai/api/db.py](../api/db.py) and expects RAG chunks to be available in the table [data_ai/database/ddl/001_serving_schema.sql](../database/ddl/001_serving_schema.sql)
- The prototype seed script already populates [data_ai/scripts/seed_prototype_data.py](../scripts/seed_prototype_data.py) with synthetic RAG rows, so the ingestion layer only needs to plug into the same table format
- The current backlog already frames SCP-426 as PDF ingestion plus chunking, but for the MVP we can use a local fixture of market commentary documents instead of fetching live RBA PDFs

## Recommended MVP scope
1. Use a small local fixture file containing a handful of markdown or plain-text market commentary documents.
2. Read those documents from disk.
3. Split each document into short chunks using a simple chunking strategy.
4. Insert each chunk into rag_document_chunks with metadata:
   - source_document
   - publish_date
   - topic
   - chunk_text
   - embedding (left null for now)
   - is_seed_data = false
5. Make the script idempotent so reruns do not create duplicate rows.

## Why this approach fits the current project
- We already have a working gold-layer and seed data pattern.
- The current API only needs the table populated; embedding and retrieval are not required for this step.
- A local fixture is sufficient to keep the implementation moving without depending on external PDF access or brittle parsing.

## Proposed inputs
- A local fixture file such as:
  - [data_ai/narrative_training_pairs.jsonl](../narrative_training_pairs.jsonl) is not suitable as-is for RAG documents, so a new fixture file should be added, for example: [data_ai/docs/fixtures/rag_documents.jsonl](../docs/fixtures/rag_documents.jsonl)
- Each fixture row should contain:
  - source_document
  - publish_date
  - topic
  - chunk_text

## Proposed output table
Use the existing schema in [data_ai/database/ddl/001_serving_schema.sql](../database/ddl/001_serving_schema.sql):
- chunk_id
- source_document
- publish_date
- topic
- chunk_text
- embedding
- is_seed_data

## Suggested implementation steps
1. Add a lightweight fixture file with a few sample documents and chunks.
2. Add a Python script such as:
   - [data_ai/ingestion/build_rag_chunks.py](../ingestion/build_rag_chunks.py)
3. The script should:
   - read the fixture file
   - normalize the rows
   - insert them into rag_document_chunks
   - use ON CONFLICT on a stable key such as source_document + publish_date + chunk_text if a unique constraint is introduced, or simply upsert by chunk_id if the script generates one deterministically
4. Add a simple CLI entry point to run the loader.

## MVP behavior
- One or more chunks per document
- Metadata populated for each chunk
- Re-running the script does not duplicate rows
- The current app can read the data immediately after the script runs

## Stretch goals later
- Replace the fixture with real PDFs from RBA or housing-market sources
- Add PDF text extraction and chunking from actual files
- Add embedding generation and a vector index
- Add error logging for unreadable documents

## Recommended acceptance criteria for this MVP
- The loader can populate rag_document_chunks from a local fixture.
- The rows are readable by the existing API layer.
- Re-running the loader does not create duplicates.
- The script can be run in a single command from the data_ai directory.
