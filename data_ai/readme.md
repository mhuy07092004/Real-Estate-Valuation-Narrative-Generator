# data_ai

Data collection, dataset-building, and Gemma fine-tuning experiments supporting the main app. Not a standalone service — everything here either feeds real data into the backend's DB (`backend/prisma/schema.prisma`) or builds/trains an AI narrative model for it.

## Folder map

| Path | What's there |
| --- | --- |
| `ingestion/` | Scraping scripts for external data: `bronze_listing_ingest.py` (property listings), `domain_suburb_insights_ingest.py`, `sqm_vacancy_rate_ingest.py`, `abs_sa2_raw_ingest.py`, plus `suburb_source.py` (shared helper — reads the real suburb list from the backend's live SQLite DB rather than re-deriving it). |
| `run_full_scrape.py` | Orchestrates the three external-data scripts (Domain/SQM/ABS) across every real suburb already in the backend DB, not just a test batch. |
| `scripts/` | `prepare_finetune_dataset.py` and `split_narrative_dataset.py` (the narrative dataset pipeline — see below), plus one-off `probe_*.py` scripts used to inspect a scrape target's page structure before writing a real ingestion script against it. |
| `docs/` | `scp425_plan.md` (the real, current narrative-dataset design), `scp419_plan.md` (historical baseline-eval plan), `gcp_provisioning_plan.md`, `fixtures/` (the actual dataset files at each pipeline stage — see below). |
| `training/` | Vertex AI custom-training-job code: the `trainer/` Python package (`finetune_gemma.py`, `merge_adapter.py`), `setup.py` to package it, and job config YAML files (gitignored — they hold a plaintext Hugging Face token). |
| `eval/` | `generate_baseline.py` (runs a deployed model against the held-out test set), `score_rouge.py` (ROUGE-L scoring against real reference text), `baseline-report.md`. |
| `narrative_training_pairs.jsonl` | The actual dataset deliverable — role-conditioned narrative text paired with real property data. |
| `Relaive_AI_Data_Service_Backlog.md` | Original ticket backlog (historical reference — some of it describes a simpler scheme than what's actually implemented; `docs/scp425_plan.md` has the real, current design). |
| Root CSVs (`bronze_listings.csv`, `abs_*.csv`, `sqm_vacancy_rate_raw.csv`, `domain_suburb_insights.csv`) | Scraper outputs — real data pulled by `ingestion/`. |
| `requirements.txt` | Scraping dependencies only (pandas, undetected_chromedriver, webdriver-manager, openpyxl). `training/` and `eval/` have their own separate, smaller dependency lists documented in their sections below. |

## First-time setup (scraping/dataset tooling)

```bash
cd data_ai
python -m venv venv
.\venv\Scripts\Activate.ps1      # Windows; `source venv/bin/activate` elsewhere
pip install -r requirements.txt
```

This covers the scraping and dataset-building scripts. The fine-tuning pipeline (`training/`, `eval/`) needs separate setup — see "Fine-tuning pipeline" below.

## Scraping pipeline

Run an individual ingestion script directly (each is a real scraper, expects real network access):

```bash
python ingestion/domain_suburb_insights_ingest.py
```

Or scrape every real suburb at once via the orchestrator:

```bash
python run_full_scrape.py
```

This clears each script's previous output CSV first (none of them are resume-aware — re-running without clearing silently duplicates rows) and runs the three external-data scripts sequentially, not in parallel, so no scrape target sees two concurrent sessions from this machine.

**Handoff to the backend**: the CSVs these scripts produce (`bronze_listings.csv`, `domain_suburb_insights.csv`, `abs_*.csv`, `sqm_vacancy_rate_raw.csv`) get imported into the backend's real DB by scripts in `backend/scripts/` (`ingest-bronze-listings.ts`, `load-external-market-data.ts`, `build-suburb-market-intelligence.ts`) — see `backend/README.md`'s "Data import" section for the exact commands. Nothing in `data_ai/` writes to the backend DB directly.

## Narrative dataset pipeline

The real, verified chain that produces `narrative_training_pairs.jsonl` and its splits:

1. **`backend/scripts/export-narrative-training-inputs.ts`** (run from `backend/`, not here) — pulls real properties/comparables/market-intelligence/ROI/affordability data from the backend's live DB, writes `docs/fixtures/narrative_dataset_inputs.jsonl` (300 rows, 75 per role: agent/valuer/buyer/investor).
2. **Hand-authored narratives** — `narrative_training_pairs.jsonl` (this directory's root) pairs each of those 300 rows with real narrative text, grounded strictly in that row's own data (verifiable — every dollar figure traces back to the row's comparables/market/ROI/affordability numbers).
3. **`python scripts/split_narrative_dataset.py`** — fixed-seed (42), stratified 80/10/10 split by role → `docs/fixtures/narrative_training_pairs.{train,val,test}.jsonl`.
4. **`python scripts/prepare_finetune_dataset.py`** — joins the split files back to their grounding data from step 1, formats each as a `{"messages": [...]}` chat example → `docs/fixtures/finetune_ready/{train,val,test}.jsonl`, ready for fine-tuning.

## GCP / Vertex AI setup

Project used so far: `csit321-508209`. Adjust for whatever project you're actually using.

```bash
gcloud auth login
gcloud auth application-default login   # needed separately — this is what lets Node/Python code get an access token, not just the CLI
gcloud config set project csit321-508209
gcloud services enable aiplatform.googleapis.com compute.googleapis.com
```

**One bucket, correct region from the start** — a mistake made once already: creating a bucket in a different region than where GPU quota/compute actually is causes Vertex AI Training jobs to fail with a region-mismatch error when writing output (reading training input across regions works fine; writing training *output* does not). Pick the bucket's region to match wherever your GPU quota is (check with the quota command below first), then:

```bash
gsutil mb -l us-central1 gs://YOUR_PROJECT-training
```

**GPU quota — two separate pools, not one.** Vertex AI keeps *serving* GPU quota and *training* GPU quota completely separate, even for the identical accelerator type in the identical region — having one does not imply having the other. Check both before assuming either is available:

```bash
gcloud compute regions describe us-central1 --project=YOUR_PROJECT --format="table(quotas)"
```

Look for `NVIDIA_L4_GPUS`/`NVIDIA_TESLA_T4_GPUS` (serving) — training quota isn't shown here; check it via Console: **IAM & Admin → Quotas**, filter for `custom_model_training_nvidia_t4_gpus` (or `_l4_gpus`). If either is 0, select the region row and request an increase — approval can be fast (minutes, in practice) despite Console's "2-3 weeks" disclaimer banner.

## Fine-tuning pipeline (`training/`)

**Setup** (separate from the root `requirements.txt`):
```
transformers==4.44.2
peft==0.12.0
accelerate==0.33.0
trl==0.9.6
datasets==2.21.0
```
(these are installed automatically inside the Vertex training container via `setup.py`'s `install_requires` — no local install needed unless you want to test the script locally, which requires a GPU to be practical.)

**Package and upload the training code:**
```bash
cd training
python setup.py sdist --formats=gztar
gsutil cp dist/trainer-0.1.tar.gz gs://YOUR_PROJECT-training/training-code/
```

**Job config** (`job_config.yaml`, kept local and gitignored — it holds a plaintext `HF_TOKEN`):
```yaml
baseOutputDirectory:
  outputUriPrefix: gs://YOUR_PROJECT-training/models/RUN_NAME
workerPoolSpecs:
  - machineSpec:
      machineType: n1-standard-8
      acceleratorType: NVIDIA_TESLA_T4
      acceleratorCount: 1
    replicaCount: 1
    pythonPackageSpec:
      executorImageUri: us-docker.pkg.dev/vertex-ai/training/pytorch-gpu.2-3.py310:latest
      packageUris:
        - gs://YOUR_PROJECT-training/training-code/trainer-0.1.tar.gz
      pythonModule: trainer.finetune_gemma
      args:
        - --train-file=gs://YOUR_PROJECT-training/training-data/train.jsonl
        - --val-file=gs://YOUR_PROJECT-training/training-data/val.jsonl
      env:
        - name: HF_TOKEN
          value: "hf_..."
        - name: USE_TORCH_XLA
          value: "0"
```

**Submit and monitor:**
```bash
gcloud ai custom-jobs create --region=us-central1 --project=YOUR_PROJECT --display-name=RUN_NAME --config=job_config.yaml
gcloud ai custom-jobs stream-logs <job-id-from-above>
```

### Real gotchas hit and fixed (don't repeat these)

- **`baseOutputDirectory` is required, or your trained model is silently lost.** Without it, `AIP_MODEL_DIR` is never set, the script falls back to a local path inside the training container, training completes with exit code 0 looking totally fine, and the container is torn down with the result gone forever. Always set it.
- **Vertex mounts every accessible bucket at `/gcs/<bucket>/...` via Cloud Storage FUSE.** Plain filesystem writes (`torch.save`, HF's `save_pretrained`) only reach the real bucket through that mount — passing a bare `gs://...` URI straight to standard file I/O does *not* work (it silently creates a bogus local path instead). Convert `gs://bucket/path` → `/gcs/bucket/path` before using it as a local output directory. `datasets.load_dataset(..., data_files="gs://...")` is the one exception — the `datasets` library has its own `gcsfs`-based GCS support and reads `gs://` URIs directly, no conversion needed there.
- **The training container defaults to a `torch_xla`/PJRT runtime that can OOM on Gemma's 256k-token vocabulary**, even when nothing else about the job is oversized (its `BFCAllocator` reserves the large majority of the GPU's memory upfront, before any real tensor exists). Set `USE_TORCH_XLA=0` as an env var to force plain PyTorch/CUDA instead — this alone fixed a repeated OOM crash that batch-size reduction did not.
- **T4's 16GB needs a small batch size.** `--batch-size=1 --grad-accum=8` (effective batch size 8) fit comfortably for Gemma 2 2B; `--batch-size=2` did not.
- **Disable the training loop's own mid-training eval** (`eval_strategy="no"` in `SFTConfig`) if evaluation isn't otherwise needed — it runs an extra forward pass that computes the full vocabulary logits again, which was enough extra memory pressure to OOM right at the first epoch boundary even after the batch-size fix above. Real evaluation happens separately anyway (see "Evaluation" below).
- **Smoke-test before the real run.** Build a 5-row subset of `train.jsonl`/`val.jsonl`, run 1 epoch, and confirm the *actual output files* land in GCS (`gsutil ls -r gs://.../models/RUN_NAME/model/`) before spending real GPU-hours on the full dataset. A clean exit code is not proof the output was saved correctly — verify the files exist.

## Merging + serving

A LoRA adapter alone isn't directly deployable to the same serving container a Model Garden base model uses (that container needs a full model directory) — merge it into the base weights first.

`training/trainer/merge_adapter.py` loads the base model + adapter, calls `merge_and_unload()`, saves the full merged model. Run it the same way as training (its own job config, `pythonModule: trainer.merge_adapter`, args `--adapter-dir=gs://.../model --output-dir=gs://.../merged`).

**Upload the merged model as a Vertex AI Model resource.** Get the exact serving container spec from a working Model Garden deployment first (`gcloud ai models describe <model-id> --format=json`) rather than guessing it — the container image, args, ports, and health/predict routes need to match exactly what the container actually expects:

```bash
gcloud ai models upload --region=us-central1 --project=YOUR_PROJECT \
  --display-name=YOUR_MODEL_NAME \
  --container-image-uri=us-docker.pkg.dev/vertex-ai/vertex-vision-model-garden-dockers/pytorch-vllm-serve:20250114_0916_RC00_maas \
  --container-args="python,-m,vllm.entrypoints.api_server,--host=0.0.0.0,--port=8080,--model=gs://YOUR_PROJECT-training/models/merged,--tensor-parallel-size=1,--swap-space=16,--gpu-memory-utilization=0.95,--max-num-seqs=256" \
  --container-ports=8080 --container-health-route=/ping --container-predict-route=/generate
```

Note: this same container also supports `--enable-lora --max-loras=1` for serving an adapter directly without merging — worth trying next time as a simpler alternative, not yet verified end-to-end.

**Grant the serving service account access to your bucket** if it's not the same bucket a Model Garden deployment already used — the online-prediction service account needs explicit read access to any bucket you point a custom model's artifacts at:
```bash
gsutil iam ch serviceAccount:custom-online-prediction@<PROJECT-SUFFIX>-tp.iam.gserviceaccount.com:objectViewer gs://YOUR_PROJECT-training
```
(get the exact service account name from the deploy failure's error message if you hit this — it's project-specific.)

**Create a persistent endpoint once, reuse it across deploys** (Model Garden's UI always creates a *new* endpoint per deploy, with a new address each time — do this instead so the endpoint's identity stays stable):
```bash
gcloud ai endpoints create --region=us-central1 --project=YOUR_PROJECT --display-name=persistent-endpoint
gcloud ai endpoints deploy-model <endpoint-id> --region=us-central1 --project=YOUR_PROJECT \
  --model=<model-id> --display-name=deployment-name \
  --machine-type=g2-standard-12 --accelerator="type=nvidia-l4,count=1" --traffic-split=0=100
```

**Cost discipline**: an empty endpoint (nothing deployed) is free. A deployed model bills continuously per GPU-hour whether or not it's receiving requests (~$1-2/hour depending on model size). Undeploy the *model* when done testing — `gcloud ai endpoints undeploy-model <endpoint-id> --deployed-model-id=<id>` — and leave the endpoint itself alive for next time, rather than deleting the endpoint (which loses its address and forces every consumer, e.g. `backend/src/services/vertex-narrative.service.ts`, to be updated with a new one). **Check for multiple models deployed on the same endpoint** before assuming you've stopped billing — deploying a new model with `--traffic-split=0=100` only redirects traffic, it does not automatically undeploy whatever was already there; `gcloud ai endpoints describe <id> --format="value(deployedModels)"` shows everything actually running.

## Evaluation

```bash
python eval/generate_baseline.py    # requires the model deployed on the endpoint it's pointed at
python eval/score_rouge.py docs/fixtures/finetune_ready/test_baseline_gemma2b.jsonl --label baseline
```

`generate_baseline.py` runs the deployed model against every prompt in the held-out test set and saves `{pair_id, prompt, reference, generated}` rows. `score_rouge.py` computes ROUGE-L precision/recall/f-measure against the real reference text.

Recorded baseline (untrained Gemma 2 2B-it, zero-shot): **ROUGE-L f-measure 0.2206** — the number a fine-tuned run needs to beat to prove the fine-tuning actually helped. Re-run both scripts against a fine-tuned model's output (same test set, `--label finetuned`) to compare.

## Full teardown

To tear everything down to a clean slate (e.g. between experiments, or to stop all billing):
```bash
gcloud ai endpoints describe <endpoint-id> --format="value(deployedModels)"   # check what's actually deployed first
gcloud ai endpoints undeploy-model <endpoint-id> --deployed-model-id=<id>      # repeat for each deployed model found
gcloud ai endpoints delete <endpoint-id> --quiet
gcloud ai models delete <model-id> --quiet                                     # repeat for each model resource
gsutil rm -r gs://YOUR_PROJECT-training
```
Verify with `gcloud ai endpoints list`, `gcloud ai models list`, `gsutil ls -p YOUR_PROJECT` — all three should return empty.
