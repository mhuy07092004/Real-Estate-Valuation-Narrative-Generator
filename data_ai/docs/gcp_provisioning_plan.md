# GCP resource provisioning plan

## Background

Long (project sponsor contact) created GCP project `csit321-508209` and granted the team editor access, with a $1,401.15 "GenAI App Builder" trial credit plus sponsorship for further usage. Truc's original request (2026-09-08) asked for:

- Vertex AI Training GPU (L4/A100) for LoRA/QLoRA fine-tuning, ~40-80 GPU-hours
- Vertex AI Endpoint (L4) for serving during testing/demos, activated on demand
- GCS, ~60-90GB: datasets, scraped listings, suburb demographics, sales records, RAG chunks/embeddings, fine-tuning data, model checkpoints
- BigQuery (on-demand, free-tier where possible) for joining sales/suburb/macro data
- Vertex AI Workbench (small CPU dev environment) for ingestion/cleaning scripts
- AUD $500 in credits as a buffer

Long's reply (2026-09-10) flagged that the credit shown ("Trial credit for GenAI App Builder") has restricted usage scope — worth confirming which of the above resources it actually covers before spending against it, particularly before any GPU training/serving usage.

Starting state as of this doc (2026-09-11): nothing provisioned yet. No `gcloud` CLI, no APIs enabled, no bucket, no BigQuery dataset, no Workbench, no Vertex AI resources.

## Status

| Resource | Status | Notes |
|---|---|---|
| GCS bucket | In progress | `gs://csit321-508209-relaive-data`, `australia-southeast1` |
| BigQuery dataset | Not started | |
| Vertex AI Workbench | Not started | |
| Vertex AI Training/Endpoint | Not started | Confirm GenAI App Builder credit scope first |
| Credit scope confirmation | Not started | Deferred per team decision to provision GCS first |

## Step 1: GCS bucket

- Name: `csit321-508209-relaive-data` (project-id-prefixed for global uniqueness)
- Region: `australia-southeast1` (Sydney) — lowest latency for the team
- Uniform bucket-level access: enabled
- Storage class: Standard
- Prefix layout: `datasets/`, `scraped-listings/`, `suburb-demographics/`, `sales-records/`, `rag-chunks-embeddings/`, `fine-tuning-data/`, `model-checkpoints/`

Not yet wired into any script — `data_ai/ingestion/config.py` is still entirely local-Postgres-driven. Adding a `GCS_BUCKET_NAME` env var + `google-cloud-storage` client is a follow-up once the bucket is confirmed working.

## Later steps (not started)

- BigQuery dataset for sales/suburb/macro joins
- Vertex AI Workbench (CPU) for ingestion/cleaning
- Vertex AI Training + Endpoint (GPU) for fine-tuning/serving — confirm "GenAI App Builder" credit terms first
